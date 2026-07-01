import { useState } from 'react';
import { opApi } from '../api';
import type { Territorio } from '../../../shared/domain/types';

interface TerritoryManagementTabProps {
  territorios: Territorio[];
  onTerritoriesChange: () => void;
}

export default function TerritoryManagementTab({ territorios, onTerritoriesChange }: TerritoryManagementTabProps) {
  const [showNewTerritory, setShowNewTerritory] = useState(false);
  const [name, setName] = useState('');
  const [zone, setZone] = useState('Zona Urbana');
  const [createdInfo, setCreatedInfo] = useState<{ id: string; name: string } | null>(null);

  const handleCreateTerritory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await opApi.adminCreateTerritory({ name, zone });
      setCreatedInfo(res);
      setShowNewTerritory(false);
      setName('');
      setZone('Zona Urbana');
      onTerritoriesChange();
    } catch (err) {
      window.alert('Erro ao criar território');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-slate-900">Gestão de Territórios</h2>
        <button
          onClick={() => setShowNewTerritory(true)}
          className="bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Novo Território
        </button>
      </div>

      {createdInfo && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 text-emerald-900">
          <strong>Sucesso!</strong> O território <strong>{createdInfo.name}</strong> foi criado com sucesso.
        </div>
      )}

      {showNewTerritory && (
        <form onSubmit={handleCreateTerritory} className="border border-slate-200 bg-white p-5">
          <h3 className="mb-4 font-bold text-slate-900">Cadastrar Território</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <label className="block text-sm font-medium text-slate-700">
              Nome do Bairro / Região
              <input required value={name} onChange={e => setName(e.target.value)} className="mt-1 h-10 w-full border border-slate-300 px-3 outline-none focus:border-emerald-600" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Zona
              <select value={zone} onChange={e => setZone(e.target.value)} className="mt-1 h-10 w-full border border-slate-300 px-3 outline-none focus:border-emerald-600">
                <option value="Zona Urbana">Zona Urbana</option>
                <option value="Zona Rural">Zona Rural</option>
              </select>
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowNewTerritory(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 border border-slate-300">Cancelar</button>
            <button type="submit" className="bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">Salvar Território</button>
          </div>
        </form>
      )}

      <div className="border border-slate-200 bg-white">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 font-medium text-slate-900 border-b border-slate-200">
            <tr>
              <th className="p-3">Nome</th>
              <th className="p-3">Identificador (Slug)</th>
              <th className="p-3">População (Base OP)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {territorios.map(t => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="p-3 font-medium text-slate-900">{t.nome}</td>
                <td className="p-3 font-mono text-xs">{t.slug || t.id.split('-')[0]}</td>
                <td className="p-3 text-slate-500">
                  {new Intl.NumberFormat('pt-BR').format(t.populacao || 0)} hab.
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
