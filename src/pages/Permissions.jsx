import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Save, User, Check, X, Eye, Edit3, Trash2, Search, Filter } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('todos');
  const [pageFilter, setPageFilter] = useState('todas');
  const [permissionFilter, setPermissionFilter] = useState('todos');
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

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Filtro de busca por nome ou email
      const searchMatch = searchTerm === '' || 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro por role
      const roleMatch = roleFilter === 'todos' || user.role === roleFilter;

      // Filtro por página e permissão
      let pagePermMatch = true;
      if (pageFilter !== 'todas') {
        const perm = userPermissions[user.id]?.[pageFilter];
        
        if (permissionFilter === 'com-acesso') {
          pagePermMatch = perm && (perm.canView || perm.canEdit || perm.canDelete);
        } else if (permissionFilter === 'sem-acesso') {
          pagePermMatch = !perm || (!perm.canView && !perm.canEdit && !perm.canDelete);
        } else if (permissionFilter === 'pode-visualizar') {
          pagePermMatch = perm?.canView === true;
        } else if (permissionFilter === 'pode-editar') {
          pagePermMatch = perm?.canEdit === true;
        } else if (permissionFilter === 'pode-excluir') {
          pagePermMatch = perm?.canDelete === true;
        }
      }

      return searchMatch && roleMatch && pagePermMatch;
    });
  }, [users, searchTerm, roleFilter, pageFilter, permissionFilter, userPermissions]);

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

      <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Filter className="text-blue-600 dark:text-blue-400" size={24} />
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            Buscar e Filtrar Usuários
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 block mb-2">
              <Search size={12} className="inline mr-1" />
              Buscar
            </label>
            <input
              type="text"
              placeholder="Nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-2xl font-bold border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 block mb-2">
              Papel
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-2xl font-bold border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
            >
              <option value="todos">Todos os Papéis</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 block mb-2">
              Página
            </label>
            <select
              value={pageFilter}
              onChange={(e) => setPageFilter(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-2xl font-bold border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
            >
              <option value="todas">Todas as Páginas</option>
              {pages.map(page => (
                <option key={page} value={page}>{page}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 block mb-2">
              Permissão
            </label>
            <select
              value={permissionFilter}
              onChange={(e) => setPermissionFilter(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-2xl font-bold border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
              disabled={pageFilter === 'todas'}
            >
              <option value="todos">Todas</option>
              <option value="com-acesso">Com Acesso</option>
              <option value="sem-acesso">Sem Acesso</option>
              <option value="pode-visualizar">Pode Visualizar</option>
              <option value="pode-editar">Pode Editar</option>
              <option value="pode-excluir">Pode Excluir</option>
            </select>
          </div>
        </div>

        {(searchTerm || roleFilter !== 'todos' || pageFilter !== 'todas') && (
          <div className="mt-4 flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Mostrando {filteredUsers.length} de {users.length} usuários
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('todos');
                setPageFilter('todas');
                setPermissionFilter('todos');
              }}
              className="text-xs font-black text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Limpar Filtros
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {filteredUsers.map((user) => (
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

      {filteredUsers.length === 0 && users.length > 0 && (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700">
          <Search className="mx-auto text-slate-400 dark:text-slate-500 mb-4" size={48} />
          <p className="text-slate-600 dark:text-slate-400 font-bold mb-2">
            Nenhum usuário encontrado com esses filtros
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setRoleFilter('todos');
              setPageFilter('todas');
              setPermissionFilter('todos');
            }}
            className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            Limpar Filtros
          </button>
        </div>
      )}

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