import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Save, User, Check, X, Eye, Edit3, Trash2 } from 'lucide-react';
import Toast from '../components/common/Toast';

const pages = [
  'Shifts',
  'Finance',
  'Deposits',
  'Reports',
  'Doctors',
  'Hospitals',
  'Settings'
];

export default function Permissions() {
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => base44.entities.Permission.list(),
  });

  const createPermissionMutation = useMutation({
    mutationFn: (data) => base44.entities.Permission.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
    },
  });

  const updatePermissionMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Permission.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
    },
  });

  const deletePermissionMutation = useMutation({
    mutationFn: (id) => base44.entities.Permission.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
    },
  });

  const userPermissions = useMemo(() => {
    const map = {};
    users.forEach(user => {
      map[user.id] = {};
      pages.forEach(page => {
        const perm = permissions.find(p => p.userId === user.id && p.pageName === page);
        map[user.id][page] = perm || null;
      });
    });
    return map;
  }, [users, permissions]);

  const togglePermission = async (userId, userEmail, pageName, permType) => {
    const currentPerm = userPermissions[userId][pageName];

    try {
      if (!currentPerm) {
        // Criar nova permissão
        await createPermissionMutation.mutateAsync({
          userId,
          userEmail,
          pageName,
          canView: permType === 'canView',
          canEdit: permType === 'canEdit',
          canDelete: permType === 'canDelete',
        });
      } else {
        // Atualizar permissão existente
        await updatePermissionMutation.mutateAsync({
          id: currentPerm.id,
          data: {
            ...currentPerm,
            [permType]: !currentPerm[permType],
          },
        });
      }
      setToast({ message: 'Permissão atualizada!', type: 'success' });
      setTimeout(() => setToast(null), 2000);
    } catch (error) {
      setToast({ message: 'Erro ao atualizar permissão', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const saveAllPermissions = async () => {
    setSaving(true);
    try {
      setToast({ message: 'Permissões salvas com sucesso!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      setToast({ message: 'Erro ao salvar permissões', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
    setSaving(false);
  };

  const grantAllPermissions = async (userId, userEmail) => {
    setSaving(true);
    try {
      for (const page of pages) {
        const currentPerm = userPermissions[userId][page];
        
        if (!currentPerm) {
          await createPermissionMutation.mutateAsync({
            userId,
            userEmail,
            pageName: page,
            canView: true,
            canEdit: true,
            canDelete: true,
          });
        } else {
          await updatePermissionMutation.mutateAsync({
            id: currentPerm.id,
            data: {
              ...currentPerm,
              canView: true,
              canEdit: true,
              canDelete: true,
            },
          });
        }
      }
      setToast({ message: 'Todas as permissões concedidas!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      setToast({ message: 'Erro ao conceder permissões', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
    setSaving(false);
  };

  const revokeAllPermissions = async (userId) => {
    setSaving(true);
    try {
      for (const page of pages) {
        const currentPerm = userPermissions[userId][page];
        if (currentPerm) {
          await deletePermissionMutation.mutateAsync(currentPerm.id);
        }
      }
      setToast({ message: 'Todas as permissões revogadas!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      setToast({ message: 'Erro ao revogar permissões', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <Shield className="text-blue-600 dark:text-blue-400" size={32} />
            Gerenciar Permissões
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Controle o acesso de cada usuário às páginas do sistema
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-2xl border-2 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Shield className="text-blue-600 dark:text-blue-400 mt-1" size={24} />
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
              Como funciona?
            </h3>
            <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
              <li>• <strong>Visualizar:</strong> Permite acessar e ver os dados da página</li>
              <li>• <strong>Editar:</strong> Permite modificar dados existentes</li>
              <li>• <strong>Excluir:</strong> Permite remover dados</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm"
          >
            <div className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-800 p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg">
                    {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      {user.full_name || user.email}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{user.email}</p>
                    <span className={`inline-block mt-1 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' 
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => grantAllPermissions(user.id, user.email)}
                    disabled={saving}
                    className="flex items-center gap-2 bg-green-600 dark:bg-green-500 text-white px-4 py-2 rounded-xl font-black text-xs uppercase hover:bg-green-700 dark:hover:bg-green-600 transition-all disabled:opacity-50"
                  >
                    <Check size={16} />
                    Conceder Todas
                  </button>
                  <button
                    onClick={() => revokeAllPermissions(user.id)}
                    disabled={saving}
                    className="flex items-center gap-2 bg-red-600 dark:bg-red-500 text-white px-4 py-2 rounded-xl font-black text-xs uppercase hover:bg-red-700 dark:hover:bg-red-600 transition-all disabled:opacity-50"
                  >
                    <X size={16} />
                    Revogar Todas
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid gap-4">
                {pages.map((page) => {
                  const perm = userPermissions[user.id][page];
                  return (
                    <div
                      key={page}
                      className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-200 dark:border-slate-600"
                    >
                      <div className="font-black text-slate-900 dark:text-white">
                        {page}
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => togglePermission(user.id, user.email, page, 'canView')}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                            perm?.canView
                              ? 'bg-blue-600 dark:bg-blue-500 text-white'
                              : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <Eye size={16} />
                          Visualizar
                        </button>
                        <button
                          onClick={() => togglePermission(user.id, user.email, page, 'canEdit')}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                            perm?.canEdit
                              ? 'bg-amber-600 dark:bg-amber-500 text-white'
                              : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <Edit3 size={16} />
                          Editar
                        </button>
                        <button
                          onClick={() => togglePermission(user.id, user.email, page, 'canDelete')}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                            perm?.canDelete
                              ? 'bg-red-600 dark:bg-red-500 text-white'
                              : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <Trash2 size={16} />
                          Excluir
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700">
          <User className="mx-auto text-slate-400 dark:text-slate-500 mb-4" size={48} />
          <p className="text-slate-600 dark:text-slate-400 font-bold">
            Nenhum usuário encontrado
          </p>
        </div>
      )}
    </div>
  );
}