/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, type FormEvent } from 'react';
import { Fingerprint, LoaderCircle, LogIn, UserPlus, X } from 'lucide-react';
import { useAuth } from './AuthContext';
import type { Territory } from '../types';

interface AuthModalProps {
  territories: Territory[];
}

type AuthMode = 'login' | 'register';

export default function AuthModal({ territories }: AuthModalProps) {
  const { isAuthModalOpen, closeAuthModal, login, register } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [isSubmitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [territoryId, setTerritoryId] = useState('');

  if (!isAuthModalOpen) return null;

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      if (mode === 'login') {
        await login(cpf, birthDate);
      } else {
        await register({
          fullName,
          cpf,
          birthDate,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          territoryId: territoryId || undefined
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha inesperada.';
      setErrorMessage(
        message === 'Failed to fetch'
          ? 'Não foi possível conectar à API do Código Público. Verifique se o backend está em execução.'
          : message
      );
    } finally {
      setSubmitting(false);
    }
  };

  const labelClass = 'block font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--color-git-muted)] mb-1.5';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={closeAuthModal}
      id="auth-modal-overlay"
    >
      <div
        className="w-full max-w-md rounded-[20px] border border-[var(--color-git-border2)] bg-[var(--color-git-bg2)] shadow-[0_24px_80px_rgba(0,0,0,0.7)] animate-in fade-in slide-in-from-top-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--color-git-border)] p-5">
          <div className="flex items-center space-x-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
              style={{
                background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                boxShadow: '0 0 16px rgba(56,189,248,0.5), 0 4px 8px rgba(0,0,0,0.4)'
              }}
            >
              <Fingerprint className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-white leading-tight">
                Identificação Cívica
              </h3>
              <p className="font-mono text-[10px] text-[var(--color-git-muted)]">
                Sessão segura • CPF protegido por hash criptográfico
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="rounded-lg p-1.5 text-[var(--color-git-muted)] hover:bg-white/5 hover:text-white transition-colors"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex border-b border-[var(--color-git-border)] px-5 pt-3 space-x-1">
          {([
            { key: 'login', label: 'Entrar', icon: LogIn },
            { key: 'register', label: 'Criar cadastro', icon: UserPlus }
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => switchMode(key)}
              className={`flex items-center space-x-1.5 rounded-t-lg px-4 py-2.5 text-xs font-semibold transition-colors border-b-2 ${
                mode === key
                  ? 'border-[var(--color-git-blue)] text-[var(--color-git-blue)] bg-[rgba(56,189,248,0.06)]'
                  : 'border-transparent text-[var(--color-git-muted)] hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {mode === 'register' && (
            <div>
              <label className={labelClass} htmlFor="auth-fullname">Nome completo</label>
              <input
                id="auth-fullname"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Maria da Silva"
                className="field"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="auth-cpf">CPF</label>
              <input
                id="auth-cpf"
                type="text"
                required
                inputMode="numeric"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="000.000.000-00"
                className="field font-mono"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="auth-birthdate">Data de nascimento</label>
              <input
                id="auth-birthdate"
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="field font-mono"
              />
            </div>
          </div>

          {mode === 'register' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} htmlFor="auth-email">E-mail (opcional)</label>
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@exemplo.com"
                    className="field"
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="auth-phone">Telefone (opcional)</label>
                  <input
                    id="auth-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+55 11 99999-0000"
                    className="field"
                  />
                </div>
              </div>
              <div>
                <label className={labelClass} htmlFor="auth-territory">Território (opcional)</label>
                <select
                  id="auth-territory"
                  value={territoryId}
                  onChange={(e) => setTerritoryId(e.target.value)}
                  className="field"
                >
                  <option value="">Selecione seu bairro ou distrito</option>
                  {territories.map(territory => (
                    <option key={territory.id} value={territory.id}>
                      {territory.name} — {territory.zone}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {errorMessage && (
            <div className="rounded-xl border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.08)] px-3.5 py-2.5 text-xs text-[var(--color-git-red)]">
              {errorMessage}
            </div>
          )}

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : mode === 'login' ? (
              <LogIn className="h-4 w-4" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            <span>{mode === 'login' ? 'Entrar na plataforma' : 'Cadastrar e entrar'}</span>
          </button>

          <p className="text-center font-mono text-[10px] leading-relaxed text-[var(--color-git-muted)]">
            Seu CPF nunca é armazenado em texto puro. A plataforma registra apenas um
            hash HMAC-SHA256 para verificação de identidade.
          </p>
        </form>
      </div>
    </div>
  );
}
