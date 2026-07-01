import React, { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { opApi, type ApiCitizenDashboard } from './api';
import { userProfile, profileLabel } from '../../app/navigation';
import { 
  User, 
  Shield, 
  CheckCircle, 
  Info, 
  Key, 
  LogOut, 
  Lock, 
  Activity,
  MapPin,
  Calendar,
  Mail,
  UserCheck,
  ChevronRight,
  ClipboardList,
  AlertTriangle,
  UserPlus,
  FileText
} from 'lucide-react';

interface ApiTerritory {
  id: string;
  name: string;
  zone: string;
}

export default function UserSection() {
  const { user, adminContext, isAuthenticated, login, logout } = useAuth();
  
  // Dashboard & Bond States
  const [dashboard, setDashboard] = useState<ApiCitizenDashboard | null>(null);
  const [bond, setBond] = useState<any>(null);
  const [territories, setTerritories] = useState<ApiTerritory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Tab state for unauthenticated: 'login' | 'register'
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  
  // Login Form
  const [loginCpf, setLoginCpf] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Register Form
  const [regName, setRegName] = useState('');
  const [regCpf, setRegCpf] = useState('');
  const [regBirthDate, setRegBirthDate] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regTerritoryId, setRegTerritoryId] = useState('');

  // Request Bond Form
  const [bondTerritoryId, setBondTerritoryId] = useState('');
  const [bondType, setBondType] = useState('morador');
  const [bondEvidence, setBondEvidence] = useState('');
  const [bondLoading, setBondLoading] = useState(false);

  // Developer Simulator Collapse
  const [showDevSandbox, setShowDevSandbox] = useState(false);

  const profile = userProfile(user?.role, adminContext);

  useEffect(() => {
    loadTerritories();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboard();
      loadActiveBond();
    } else {
      setDashboard(null);
      setBond(null);
    }
  }, [isAuthenticated, user]);

  const loadTerritories = async () => {
    try {
      const data = await opApi.territories();
      setTerritories(data);
    } catch (err) {
      console.error('Erro ao buscar territórios:', err);
    }
  };

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await opApi.meDashboard();
      setDashboard(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveBond = async () => {
    try {
      const activeBond = await opApi.myBond();
      setBond(activeBond);
    } catch (err) {
      // 404/no bond is a valid state
      setBond(null);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAuthLoading(true);
    try {
      await login(loginCpf, loginPassword);
      setLoginCpf('');
      setLoginPassword('');
    } catch (err) {
      setError((err as Error).message || 'Credenciais inválidas. Verifique os dados inseridos.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setAuthLoading(true);

    const payload = {
      fullName: regName.trim(),
      cpf: regCpf.replace(/\D/g, ''),
      birthDate: regBirthDate,
      email: regEmail.trim(),
      password: regPassword,
      territoryId: regTerritoryId || undefined
    };

    try {
      // Register using client
      const response = await fetch(`http://${window.location.hostname}:8082/api/v1/citizens/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro no cadastro');
      }
      setSuccessMsg('Cadastro realizado com sucesso! Faça login com suas credenciais.');
      // Auto-fill login and swap tab
      setLoginCpf(regCpf);
      setAuthTab('login');
      // Reset registration form
      setRegName('');
      setRegCpf('');
      setRegBirthDate('');
      setRegEmail('');
      setRegPassword('');
      setRegTerritoryId('');
    } catch (err) {
      setError((err as Error).message || 'Falha ao realizar cadastro.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRequestBondSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bondTerritoryId || !bondEvidence.trim()) return;
    setError('');
    setSuccessMsg('');
    setBondLoading(true);

    try {
      await opApi.requestBond(bondTerritoryId, {
        bondType,
        evidenceNote: bondEvidence.trim()
      });
      setSuccessMsg('Solicitação de vínculo territorial enviada com sucesso! Aguarde homologação.');
      setBondEvidence('');
      loadActiveBond();
    } catch (err) {
      setError((err as Error).message || 'Erro ao solicitar vínculo territorial.');
    } finally {
      setBondLoading(false);
    }
  };

  const handleSimulateLogin = async (roleType: 'citizen' | 'manager' | 'admin') => {
    setError('');
    setAuthLoading(true);
    let cpf = '';
    const password = 'senha-teste';

    if (roleType === 'citizen') {
      cpf = '000.000.000-01';
    } else if (roleType === 'manager') {
      cpf = '000.000.000-02';
    } else {
      cpf = '000.000.000-03';
    }

    try {
      await login(cpf, password);
    } catch (err) {
      setError(`Falha ao simular perfil: ${(err as Error).message}.`);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="space-y-8" id="user-area-section">
      <header>
        <span className="text-sm font-semibold text-emerald-700">Área de Identidade</span>
        <h1 className="mt-1 font-display text-2xl font-bold text-slate-950">
          Portal do Cidadão
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Gerencie seu perfil de participação cívica, acompanhe suas contribuições e comprove sua ligação com o território.
        </p>
      </header>

      {!isAuthenticated ? (
        <div className="mx-auto max-w-lg border border-slate-200 bg-white shadow-sm">
          {/* Tabs para Login / Cadastro */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => { setAuthTab('login'); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-all ${
                authTab === 'login'
                  ? 'border-emerald-700 text-emerald-800 bg-slate-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Acessar Conta
            </button>
            <button
              onClick={() => { setAuthTab('register'); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-all ${
                authTab === 'register'
                  ? 'border-emerald-700 text-emerald-800 bg-slate-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Criar Conta
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {error && (
              <div className="mb-4 border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="mb-4 border-l-4 border-emerald-500 bg-emerald-50 p-3 text-sm text-emerald-800">
                {successMsg}
              </div>
            )}

            {authTab === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">CPF</label>
                  <input
                    type="text"
                    required
                    value={loginCpf}
                    onChange={e => setLoginCpf(e.target.value)}
                    className="h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    placeholder="Ex: 123.456.789-00"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Senha</label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    className="h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    placeholder="Sua senha secreta"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full h-11 bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 transition-colors disabled:opacity-50"
                >
                  {authLoading ? 'Verificando...' : 'Entrar'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    className="h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    placeholder="Seu nome e sobrenome"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">CPF</label>
                    <input
                      type="text"
                      required
                      value={regCpf}
                      onChange={e => setRegCpf(e.target.value)}
                      className="h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Data de Nascimento</label>
                    <input
                      type="date"
                      required
                      value={regBirthDate}
                      onChange={e => setRegBirthDate(e.target.value)}
                      className="h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">E-mail</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    className="h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    placeholder="exemplo@email.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Bairro / Território Principal</label>
                  <select
                    value={regTerritoryId}
                    onChange={e => setRegTerritoryId(e.target.value)}
                    className="h-11 w-full border border-slate-300 px-3 text-sm bg-white outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="">Selecione seu bairro principal...</option>
                    {territories.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Senha (mínimo 8 caracteres)</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    className="h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    placeholder="Crie uma senha forte"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full h-11 bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  {authLoading ? 'Cadastrando...' : 'Registrar Nova Conta'}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Seção Principal de Perfil Autenticado */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Card Detalhes do Usuário */}
            <div className="md:col-span-2 border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center bg-emerald-50 text-emerald-800 rounded-full">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="font-display text-lg font-bold text-slate-950">{user?.fullName}</h2>
                      <span className="text-xs text-slate-500 font-mono">ID: {dashboard?.citizenId || 'Carregando...'}</span>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 uppercase rounded-full ${
                    profile === 'admin' 
                      ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                      : profile === 'management'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {profileLabel(profile)}
                  </span>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 border-t border-slate-100 pt-6">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span>{dashboard?.email || 'Nenhum e-mail cadastrado'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span>Território: {dashboard?.territoryName || 'Não definido'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>Cadastrado em: {dashboard?.registeredAt || '---'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <UserCheck className="h-4 w-4 text-slate-400" />
                    <span>Status da Conta: Ativa</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                <button
                  onClick={logout}
                  className="inline-flex items-center gap-2 text-xs font-bold text-red-600 hover:text-red-800 transition-colors uppercase tracking-wider"
                >
                  <LogOut className="h-4 w-4" />
                  Sair da Conta
                </button>
                <span className="text-[11px] text-slate-400">Código Público • Brumadinho</span>
              </div>
            </div>

            {/* Permissões do Nível Atual */}
            <div className="border border-slate-200 bg-slate-50 p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-display text-xs font-bold text-slate-950 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Lock className="h-4 w-4 text-slate-600" />
                  Permissões do Papel
                </h3>
                <ul className="space-y-3">
                  {profile === 'admin' && (
                    <>
                      <li className="flex gap-2 text-xs text-slate-700">
                        <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Controle total sobre parâmetros do Ciclo e Regimento.</span>
                      </li>
                      <li className="flex gap-2 text-xs text-slate-700">
                        <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Poder de congelar e publicar o resultado final do ciclo.</span>
                      </li>
                      <li className="flex gap-2 text-xs text-slate-700">
                        <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Atualizar andamento de execução de obras na memória pública.</span>
                      </li>
                    </>
                  )}
                  {profile === 'management' && (
                    <>
                      <li className="flex gap-2 text-xs text-slate-700">
                        <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Acesso ao Painel de Gestão e moderação de demandas.</span>
                      </li>
                      <li className="flex gap-2 text-xs text-slate-700">
                        <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Avaliar viabilidade territorial e técnica das propostas.</span>
                      </li>
                      <li className="flex gap-2 text-xs text-slate-700">
                        <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Classificar demandas e aprovar envio para votação.</span>
                      </li>
                    </>
                  )}
                  {profile === 'citizen' && (
                    <>
                      <li className="flex gap-2 text-xs text-slate-700">
                        <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Enviar sugestões de melhoria para o seu bairro.</span>
                      </li>
                      <li className="flex gap-2 text-xs text-slate-700">
                        <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Apoiar e curtir ideias de outros moradores.</span>
                      </li>
                      <li className="flex gap-2 text-xs text-slate-700">
                        <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Votar nas propostas elegíveis do seu território.</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Situação da Governança / Vínculo Territorial */}
          <div className="border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-display text-lg font-bold text-slate-950 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-emerald-700" />
              Vínculo Territorial e Validação
            </h3>
            
            {bond ? (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">Bairro Homologado:</span>
                    <strong className="text-sm text-slate-900">{bond.territoryName}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">Tipo de Relação:</span>
                    <span className="capitalize text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-800 border rounded">
                      {bond.bondType}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">Nível de Confiança:</span>
                    <strong className="text-xs text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      {bond.trustLevel}
                    </strong>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-4 flex flex-col justify-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Status da Homologação:</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded ${
                      bond.status === 'Aprovado' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : bond.status === 'Pendente' 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {bond.status}
                    </span>
                  </div>
                  {bond.evidenceNote && (
                    <div className="mt-3 text-[11px] text-slate-500">
                      <span className="font-semibold block text-slate-600">Nota de Comprovação:</span>
                      "{bond.evidenceNote}"
                    </div>
                  )}
                  {bond.decisionReason && (
                    <div className="mt-2 text-[11px] text-slate-500">
                      <span className="font-semibold block text-slate-600">Resposta da Auditoria:</span>
                      "{bond.decisionReason}"
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-start gap-3 border border-amber-200 bg-amber-50/70 p-4 text-amber-900 rounded">
                  <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-sm font-semibold">Sem vínculo territorial ativo</strong>
                    <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                      Sua conta ainda não está vinculada a nenhum território (bairro). Sem isso, você não poderá propor demandas locais nem votar nas propostas territoriais no orçamento participativo de Brumadinho.
                    </p>
                  </div>
                </div>

                {/* Formulário para solicitar vínculo */}
                <form onSubmit={handleRequestBondSubmit} className="max-w-xl space-y-4 border border-slate-200 p-5 bg-slate-50">
                  <h4 className="font-display text-sm font-bold text-slate-950">Solicitar Vínculo Territorial</h4>
                  
                  {error && (
                    <div className="border-l-4 border-red-500 bg-red-50 p-3 text-xs text-red-700">
                      {error}
                    </div>
                  )}
                  {successMsg && (
                    <div className="border-l-4 border-emerald-500 bg-emerald-50 p-3 text-xs text-emerald-800">
                      {successMsg}
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Selecione o Bairro</label>
                      <select
                        required
                        value={bondTerritoryId}
                        onChange={e => setBondTerritoryId(e.target.value)}
                        className="h-10 w-full border border-slate-300 px-2 text-sm bg-white outline-none focus:border-emerald-600"
                      >
                        <option value="">Selecione...</option>
                        {territories.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Relação com o Bairro</label>
                      <select
                        required
                        value={bondType}
                        onChange={e => setBondType(e.target.value)}
                        className="h-10 w-full border border-slate-300 px-2 text-sm bg-white outline-none focus:border-emerald-600"
                      >
                        <option value="morador">Sou Morador</option>
                        <option value="trabalhador">Trabalho no Bairro</option>
                        <option value="estudante">Estudo no Bairro</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Descrição/Comprovante de Vínculo</label>
                    <textarea
                      required
                      value={bondEvidence}
                      onChange={e => setBondEvidence(e.target.value)}
                      placeholder="Descreva brevemente a sua residência ou vínculo para que o conselho de moradores possa validar a solicitação (ex: endereço, local de trabalho ou escola)."
                      rows={3}
                      className="w-full border border-slate-300 px-3 py-2 text-sm bg-white outline-none focus:border-emerald-600 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={bondLoading}
                    className="h-10 bg-emerald-700 text-white px-4 font-semibold text-xs hover:bg-emerald-800 disabled:opacity-50"
                  >
                    {bondLoading ? 'Enviando...' : 'Enviar Solicitação'}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Atividades e Contribuições do Usuário (da API /me/dashboard) */}
          <div className="border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-display text-lg font-bold text-slate-950 mb-6 flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-700" />
              Minhas Contribuições
            </h3>

            {loading ? (
              <div className="py-8 text-center text-sm text-slate-500">
                Carregando contribuições...
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {/* Votos Registrados com Criptografia / Recibos */}
                <div className="space-y-4">
                  <h4 className="font-display text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                    <ClipboardList className="h-4.5 w-4.5 text-slate-500" />
                    Recibos de Voto (Criptográficos)
                  </h4>
                  {dashboard?.votedList && dashboard.votedList.length > 0 ? (
                    <div className="space-y-3">
                      {dashboard.votedList.map(voto => (
                        <div key={voto.id} className="border border-slate-100 bg-slate-50 p-3 rounded">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-slate-800">Votação: {voto.id}</span>
                            <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded">Votado</span>
                          </div>
                          <p className="text-xs text-slate-600 mb-1">
                            Opção escolhida: <strong className="text-emerald-700">{voto.selection}</strong>
                          </p>
                          <div className="text-[10px] text-slate-500 font-mono space-y-0.5">
                            <div className="truncate">Código: {voto.receipt}</div>
                            <div className="truncate">Hash na Rede: {voto.txHash}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Nenhum voto registrado no ciclo atual.</p>
                  )}
                </div>

                {/* Demandas e Propostas Criadas */}
                <div className="space-y-4">
                  <h4 className="font-display text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                    <FileText className="h-4.5 w-4.5 text-slate-500" />
                    Minhas Demandas Sugeridas
                  </h4>
                  {dashboard?.createdIssues && dashboard.createdIssues.length > 0 ? (
                    <div className="space-y-3">
                      {dashboard.createdIssues.map(issue => (
                        <div key={issue.id} className="flex justify-between items-center border border-slate-100 bg-slate-50 p-3 rounded">
                          <div className="min-w-0 mr-3">
                            <span className="block truncate text-xs font-bold text-slate-800">{issue.title}</span>
                            <span className="text-[10px] text-slate-500">ID: {issue.id}</span>
                          </div>
                          <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 bg-slate-200 text-slate-800 rounded">
                            {issue.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Você ainda não enviou sugestões de demandas.</p>
                  )}

                  {/* PRs Normativos do Cidadão (se houver) */}
                  {dashboard?.createdPRs && dashboard.createdPRs.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                      <h5 className="text-xs font-bold text-slate-900">Minhas Propostas de Emenda</h5>
                      {dashboard.createdPRs.map(pr => (
                        <div key={pr.id} className="flex justify-between items-center bg-slate-50 p-2 rounded">
                          <span className="truncate text-xs text-slate-800 font-medium">{pr.title}</span>
                          <span className="text-[10px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5">{pr.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Seção Oculta para Desenvolvedores / Testes (Apenas Rodapé) */}
      <footer className="pt-10 border-t border-slate-200 flex flex-col items-center">
        <button 
          onClick={() => setShowDevSandbox(!showDevSandbox)} 
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors underline"
        >
          {showDevSandbox ? 'Ocultar painel de engenharia' : 'Homologação e Testes (Modo Desenvolvedor)'}
        </button>

        {showDevSandbox && (
          <div className="mt-4 w-full max-w-xl border border-dashed border-amber-300 bg-amber-50/20 p-4 rounded text-center animate-fade-in">
            <h5 className="text-xs font-bold text-amber-900 mb-2 flex items-center justify-center gap-1.5">
              <Shield className="h-4 w-4" />
              Atalhos de Simulação
            </h5>
            <p className="text-[11px] text-slate-500 mb-3">
              Use estes atalhos para se autenticar instantaneamente com os perfis de teste e avaliar as permissões de cada um.
            </p>
            <div className="flex justify-center gap-3">
              <button 
                onClick={() => handleSimulateLogin('citizen')}
                className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-sm"
              >
                Simular Cidadão
              </button>
              <button 
                onClick={() => handleSimulateLogin('manager')}
                className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-sm"
              >
                Simular Gestor
              </button>
              <button 
                onClick={() => handleSimulateLogin('admin')}
                className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-sm"
              >
                Simular Admin
              </button>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
}
