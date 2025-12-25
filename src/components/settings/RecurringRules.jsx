import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Repeat, Plus, Trash2, Power, Sparkles, Loader2 } from 'lucide-react';

const specialties = [
  "CIRURGIA GERAL", "CLÍNICA MÉDICA", "PEDIATRIA", "GINECOLOGIA", "ORTOPEDIA", "ANESTESIA", "OUTRA"
];

const frequencies = {
  weekly: 'Semanal',
  biweekly: 'Quinzenal',
  monthly: 'Mensal',
  custom: 'Personalizado'
};

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function RecurringRules({ doctors, hospitals, showToast }) {
  const [showForm, setShowForm] = useState(false);
  const [analyzingPatterns, setAnalyzingPatterns] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    doctorName: '',
    unit: '',
    specialty: 'CIRURGIA GERAL',
    type: '12h Dia',
    value: 2000,
    hours: 12,
    frequency: 'monthly',
    dayOfWeek: 1,
    weekOfMonth: 1,
    active: true,
    startDate: new Date().toISOString().split('T')[0]
  });

  const queryClient = useQueryClient();

  const { data: rules = [] } = useQuery({
    queryKey: ['recurringRules'],
    queryFn: () => base44.entities.RecurringRule.list('-created_date'),
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => base44.entities.Shift.list('-date'),
  });

  const createRuleMutation = useMutation({
    mutationFn: (data) => base44.entities.RecurringRule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringRules'] });
      setShowForm(false);
      setNewRule({
        name: '',
        doctorName: '',
        unit: '',
        specialty: 'CIRURGIA GERAL',
        type: '12h Dia',
        value: 2000,
        hours: 12,
        frequency: 'monthly',
        dayOfWeek: 1,
        weekOfMonth: 1,
        active: true,
        startDate: new Date().toISOString().split('T')[0]
      });
      showToast('Regra criada!');
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.RecurringRule.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringRules'] });
      showToast('Regra atualizada!');
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id) => base44.entities.RecurringRule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringRules'] });
      showToast('Regra removida!');
    },
  });

  const analyzePatterns = async () => {
    setAnalyzingPatterns(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze the following medical shift data and identify recurring patterns. Look for doctors who work regularly at specific hospitals on specific days/weeks.
        
Shift data: ${JSON.stringify(shifts.slice(0, 100))}

Please identify up to 5 clear recurring patterns and return them in this exact JSON format:
{
  "patterns": [
    {
      "name": "Dr. Name - Hospital - Pattern description",
      "doctorName": "doctor name from data",
      "unit": "hospital name from data",
      "specialty": "specialty from data",
      "type": "shift type from data",
      "value": average_value_number,
      "hours": hours_number,
      "frequency": "weekly or biweekly or monthly",
      "dayOfWeek": day_number_0_to_6,
      "weekOfMonth": week_number_1_to_4,
      "confidence": percentage_0_to_100
    }
  ]
}

Only include patterns with confidence > 70%. Use actual data from the shifts provided.`,
        response_json_schema: {
          type: "object",
          properties: {
            patterns: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  doctorName: { type: "string" },
                  unit: { type: "string" },
                  specialty: { type: "string" },
                  type: { type: "string" },
                  value: { type: "number" },
                  hours: { type: "number" },
                  frequency: { type: "string" },
                  dayOfWeek: { type: "number" },
                  weekOfMonth: { type: "number" },
                  confidence: { type: "number" }
                }
              }
            }
          }
        }
      });

      if (response.patterns && response.patterns.length > 0) {
        showToast(`${response.patterns.length} padrões identificados pela IA!`);
        // Criar regras automaticamente para padrões com alta confiança
        for (const pattern of response.patterns) {
          if (pattern.confidence >= 80) {
            await createRuleMutation.mutateAsync({
              ...pattern,
              active: true,
              startDate: new Date().toISOString().split('T')[0]
            });
          }
        }
      } else {
        showToast('Nenhum padrão claro identificado. Continue registrando plantões!', 'info');
      }
    } catch (error) {
      console.error('Error analyzing patterns:', error);
      showToast('Erro ao analisar padrões', 'error');
    } finally {
      setAnalyzingPatterns(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createRuleMutation.mutate(newRule);
  };

  const toggleRule = (id, active) => {
    updateRuleMutation.mutate({ id, data: { active: !active } });
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-[2.5rem] p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black mb-2 flex items-center gap-2">
              <Sparkles size={24} /> IA de Padrões
            </h3>
            <p className="text-white/80 text-sm">
              Use inteligência artificial para identificar plantões recorrentes automaticamente
            </p>
          </div>
          <button
            onClick={analyzePatterns}
            disabled={analyzingPatterns || shifts.length < 10}
            className="bg-white text-purple-600 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-purple-50 transition-colors flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            {analyzingPatterns ? (
              <>
                <Loader2 className="animate-spin" size={16} /> Analisando...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Analisar Padrões
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black flex items-center gap-2">
            <Repeat className="text-blue-600" /> Regras de Recorrência
          </h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl font-black text-xs uppercase flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} /> Nova Regra
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-8 p-6 bg-slate-50 rounded-2xl space-y-4">
            <input
              type="text"
              placeholder="Nome da regra (ex: Dr. João - Segunda-feira)"
              required
              value={newRule.name}
              onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
              className="w-full px-4 py-3 bg-white rounded-2xl font-bold border border-slate-200 focus:ring-2 focus:ring-blue-600"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={newRule.doctorName}
                onChange={(e) => setNewRule({ ...newRule, doctorName: e.target.value })}
                required
                className="px-4 py-3 bg-white rounded-2xl font-bold border border-slate-200 focus:ring-2 focus:ring-blue-600"
              >
                <option value="">Selecione o médico...</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>

              <select
                value={newRule.unit}
                onChange={(e) => setNewRule({ ...newRule, unit: e.target.value })}
                required
                className="px-4 py-3 bg-white rounded-2xl font-bold border border-slate-200 focus:ring-2 focus:ring-blue-600"
              >
                <option value="">Selecione o hospital...</option>
                {hospitals.map((h) => (
                  <option key={h.id} value={h.name}>{h.name}</option>
                ))}
              </select>

              <select
                value={newRule.type}
                onChange={(e) => {
                  const val = e.target.value;
                  let h = 12;
                  if (val === "24h") h = 24;
                  else if (val.includes("6h")) h = 6;
                  setNewRule({ ...newRule, type: val, hours: h });
                }}
                className="px-4 py-3 bg-white rounded-2xl font-bold border border-slate-200 focus:ring-2 focus:ring-blue-600"
              >
                <option value="12h Dia">12h Dia</option>
                <option value="12h Noite">12h Noite</option>
                <option value="24h">24h</option>
                <option value="6h Dia">6h Dia</option>
                <option value="6h Noite">6h Noite</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={newRule.frequency}
                onChange={(e) => setNewRule({ ...newRule, frequency: e.target.value })}
                className="px-4 py-3 bg-white rounded-2xl font-bold border border-slate-200 focus:ring-2 focus:ring-blue-600"
              >
                {Object.entries(frequencies).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>

              {newRule.frequency === 'monthly' && (
                <select
                  value={newRule.weekOfMonth}
                  onChange={(e) => setNewRule({ ...newRule, weekOfMonth: Number(e.target.value) })}
                  className="px-4 py-3 bg-white rounded-2xl font-bold border border-slate-200 focus:ring-2 focus:ring-blue-600"
                >
                  <option value={1}>Primeira semana</option>
                  <option value={2}>Segunda semana</option>
                  <option value={3}>Terceira semana</option>
                  <option value={4}>Quarta semana</option>
                </select>
              )}

              <select
                value={newRule.dayOfWeek}
                onChange={(e) => setNewRule({ ...newRule, dayOfWeek: Number(e.target.value) })}
                className="px-4 py-3 bg-white rounded-2xl font-bold border border-slate-200 focus:ring-2 focus:ring-blue-600"
              >
                {weekDays.map((day, idx) => (
                  <option key={idx} value={idx}>{day}</option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Valor (R$)"
                required
                value={newRule.value}
                onChange={(e) => setNewRule({ ...newRule, value: Number(e.target.value) })}
                className="px-4 py-3 bg-white rounded-2xl font-bold border border-slate-200 focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <button
              type="submit"
              disabled={createRuleMutation.isPending}
              className="w-full bg-blue-600 text-white py-3 rounded-2xl font-black hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Criar Regra
            </button>
          </form>
        )}

        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`p-6 rounded-2xl border ${
                rule.active
                  ? 'bg-white border-slate-200'
                  : 'bg-slate-50 border-slate-100 opacity-60'
              } flex justify-between items-center transition-all`}
            >
              <div className="flex-1">
                <h4 className="font-black text-slate-900">{rule.name}</h4>
                <p className="text-sm text-slate-600 mt-1">
                  {rule.doctorName} • {rule.unit} • {rule.type} • {frequencies[rule.frequency]}
                </p>
                <p className="text-xs text-blue-600 font-bold mt-2">
                  {frequencies[rule.frequency] === 'Mensal' && `${rule.weekOfMonth}ª semana • `}
                  {weekDays[rule.dayOfWeek]} • R$ {rule.value}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleRule(rule.id, rule.active)}
                  className={`p-2 rounded-xl transition-colors ${
                    rule.active
                      ? 'text-green-600 hover:bg-green-50'
                      : 'text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <Power size={20} />
                </button>
                <button
                  onClick={() => deleteRuleMutation.mutate(rule.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
          {rules.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Repeat size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-medium">Nenhuma regra de recorrência criada</p>
              <p className="text-sm mt-2">Use a IA para identificar padrões ou crie manualmente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}