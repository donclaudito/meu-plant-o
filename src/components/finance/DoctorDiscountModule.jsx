import React, { useState } from 'react';
import { MinusCircle, Plus, X, Save } from 'lucide-react';

export default function DoctorDiscountModule({ 
  doctorName, 
  currentDiscount, 
  onSave, 
  onDelete, 
  currentMonth, 
  currentYear,
  normalizeDoctorName 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(currentDiscount?.value || 0);
  const [description, setDescription] = useState(currentDiscount?.description || '');

  if (!doctorName || doctorName === 'TODOS') {
    return null;
  }

  const handleSave = () => {
    const normalizedName = normalizeDoctorName(doctorName);
    
    if (currentDiscount) {
      // Atualizar existente
      onSave({ 
        id: currentDiscount.id, 
        data: { value: Number(value), description, doctorName: normalizedName, month: currentMonth, year: currentYear }
      });
    } else {
      // Criar novo
      onSave({ 
        data: { value: Number(value), description, doctorName: normalizedName, month: currentMonth, year: currentYear }
      });
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm('Remover este desconto personalizado?')) {
      onDelete(currentDiscount.id);
      setValue(0);
      setDescription('');
      setIsEditing(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 p-8 rounded-[2.5rem] border-2 border-amber-200 dark:border-amber-800 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-black text-amber-900 dark:text-amber-200 flex items-center gap-2">
          <MinusCircle className="text-amber-600 dark:text-amber-400" /> Desconto Adicional (Ajuste ADM)
        </h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-amber-600 dark:bg-amber-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase hover:bg-amber-700 dark:hover:bg-amber-600 transition-colors shadow-lg"
          >
            {currentDiscount ? 'Editar' : <><Plus size={16} /> Adicionar</>}
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-600 dark:text-slate-400 uppercase mb-2">
              Médico Selecionado
            </label>
            <div className="px-4 py-3 bg-slate-100 dark:bg-slate-700 rounded-xl font-bold text-slate-900 dark:text-white">
              {doctorName}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-600 dark:text-slate-400 uppercase mb-2">
                Valor do Desconto (R$)
              </label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0.00"
                step="0.01"
                className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-600 dark:text-slate-400 uppercase mb-2">
                Motivo do Desconto
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Glosa Hospital, Uso de Material"
                className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={!value || !description}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 dark:bg-green-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 dark:hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} /> Salvar
            </button>
            
            {currentDiscount && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 bg-red-600 dark:bg-red-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
              >
                <X size={18} /> Remover
              </button>
            )}

            <button
              onClick={() => {
                setIsEditing(false);
                setValue(currentDiscount?.value || 0);
                setDescription(currentDiscount?.description || '');
              }}
              className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : currentDiscount ? (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Valor do Desconto:</p>
              <p className="text-3xl font-black text-red-600 dark:text-red-400">- R$ {Number(currentDiscount.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
            <p className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase mb-1">Motivo:</p>
            <p className="text-sm font-bold text-amber-900 dark:text-amber-200">{currentDiscount.description}</p>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-slate-400 dark:text-slate-500">
          <p className="text-sm font-bold">Nenhum desconto adicional configurado para este médico</p>
          <p className="text-xs mt-2">Clique em "Adicionar" para criar um ajuste personalizado</p>
        </div>
      )}
    </div>
  );
}