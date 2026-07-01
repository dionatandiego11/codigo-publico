import { useEffect, useState } from 'react';
import { User, Shield, Key } from 'lucide-react';
import { opApi } from '../api';

export default function UserManagementTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New User Form
  const [showNewUser, setShowNewUser] = useState(false);
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [role, setRole] = useState('citizen');
  const [createdInfo, setCreatedInfo] = useState<{ publicId: string; message: string } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await opApi.adminListUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await opApi.adminUpdateUserRole(userId, newRole);
      setUsers(curr => curr.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      window.alert('Erro ao atualizar permissão');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await opApi.adminCreateUser({ fullName: name, cpf, role });
      setCreatedInfo(res);
      setShowNewUser(false);
      setName('');
      setCpf('');
      setRole('citizen');
      loadUsers();
    } catch (err) {
      window.alert('Erro ao criar usuário');
    }
  };

  if (loading) return <div className="p-4 text-slate-500">Carregando usuários...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-slate-900">Gestão de Usuários</h2>
        <button
          onClick={() => setShowNewUser(true)}
          className="bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Novo Cidadão / Gestor
        </button>
      </div>

      {createdInfo && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 text-emerald-900">
          <strong>Sucesso!</strong> {createdInfo.message} <br />
          ID Público: {createdInfo.publicId}
        </div>
      )}

      {showNewUser && (
        <form onSubmit={handleCreateUser} className="border border-slate-200 bg-white p-5">
          <h3 className="mb-4 font-bold text-slate-900">Cadastrar Usuário Rápido</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <label className="block text-sm font-medium text-slate-700">
              Nome Completo
              <input required value={name} onChange={e => setName(e.target.value)} className="mt-1 h-10 w-full border border-slate-300 px-3 outline-none focus:border-emerald-600" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              CPF
              <input required value={cpf} onChange={e => setCpf(e.target.value)} className="mt-1 h-10 w-full border border-slate-300 px-3 outline-none focus:border-emerald-600" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Papel Inicial
              <select value={role} onChange={e => setRole(e.target.value)} className="mt-1 h-10 w-full border border-slate-300 px-3 outline-none focus:border-emerald-600">
                <option value="citizen">Cidadão Comum</option>
                <option value="management">Gestão / Moderador</option>
                <option value="admin">Admin / Sysadmin</option>
              </select>
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowNewUser(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 border border-slate-300">Cancelar</button>
            <button type="submit" className="bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">Salvar Usuário</button>
          </div>
        </form>
      )}

      <div className="border border-slate-200 bg-white">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 font-medium text-slate-900 border-b border-slate-200">
            <tr>
              <th className="p-3">Nome</th>
              <th className="p-3">ID Público</th>
              <th className="p-3">Nível de Acesso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="p-3 font-medium text-slate-900">{user.fullName}</td>
                <td className="p-3 font-mono text-xs">{user.publicId}</td>
                <td className="p-3">
                  <select
                    value={user.role}
                    onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                    className="h-8 border border-slate-300 px-2 outline-none focus:border-emerald-600 bg-white"
                  >
                    <option value="citizen">Cidadão</option>
                    <option value="management">Gestão</option>
                    <option value="admin">Administrador</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
