import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from './AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { login } = useAuth();
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(cpf, password);
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
      <div className="w-full max-w-sm border border-slate-200 bg-white shadow-xl">
        <div className="p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-950">Entrar</h2>
              <p className="mt-1 text-sm text-slate-500">Use sua conta do Código Público.</p>
            </div>
            <button onClick={onClose} className="grid h-9 w-9 place-items-center border border-slate-300 text-slate-500 hover:bg-slate-100" title="Fechar">
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">CPF</label>
              <input 
                type="text" 
                required 
                value={cpf} 
                onChange={e => setCpf(e.target.value)} 
                className="h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                placeholder="123.456.789-00" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
              <input 
                type="password" 
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="h-11 w-full bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
