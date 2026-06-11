/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Scale,
  GitPullRequest,
  AlertCircle,
  Vote,
  History,
  Activity,
  MapPin,
  User,
  Database,
  Settings,
  Compass,
  Bell,
  Globe,
  ArrowRight,
  Terminal,
  RefreshCw,
  Copy,
  Check,
  Menu,
  ChevronDown,
  LogIn,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../auth';
import { useApiHealth, type ApiHealthStatus } from '../../hooks';

const apiHealthBadge: Record<ApiHealthStatus, { label: string; className: string }> = {
  checking: { label: 'VERIFICANDO API…', className: 'bg-slate-100 text-slate-500' },
  online: { label: 'API GO ONLINE', className: 'bg-emerald-100 text-emerald-800' },
  degraded: { label: 'API DEGRADADA', className: 'bg-amber-100 text-amber-800' },
  offline: { label: 'MODO LOCAL (FALLBACK)', className: 'bg-rose-100 text-rose-800' }
};

interface NotificationItem {
  id: string;
  prId: string;
  title: string;
  date: string;
  unread: boolean;
}

interface NavbarProps {
  currentPath: string;
  initialNotifications: NotificationItem[];
  setPath: (path: string) => void;
  onRequestOpenNotification: (prId: string) => void;
}

export default function Navbar({ currentPath, initialNotifications, setPath, onRequestOpenNotification }: NavbarProps) {
  const { citizen, isAuthenticated, openAuthModal, logout } = useAuth();
  const apiHealth = useApiHealth();
  const [utcNow, setUtcNow] = useState(() => new Date());

  useEffect(() => {
    const timerId = window.setInterval(() => setUtcNow(new Date()), 30_000);
    return () => window.clearInterval(timerId);
  }, []);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [copied, setCopied] = useState(false);

  const citizenInitials = citizen
    ? citizen.fullName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0])
        .join('')
        .toUpperCase()
    : '';

  // Mark notification read
  const handleNotifClick = (id: string, prId: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, unread: false } : n))
    );
    setShowNotifications(false);
    onRequestOpenNotification(prId);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(`https://codigopublico.gov.br${currentPath}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  const navItems = [
    { label: 'Início', path: '/', icon: Compass },
    { label: 'Lei Orgânica (Kernel)', path: '/lei-organica', icon: Scale },
    { label: 'Issues Públicas', path: '/issues', icon: AlertCircle },
    { label: 'PRs Cívicos', path: '/prs', icon: GitPullRequest },
    { label: 'Votações', path: '/votacoes', icon: Vote },
    { label: 'Releases Leg.', path: '/releases', icon: History },
    { label: 'Fiscalização', path: '/fiscalizacao', icon: Activity },
    { label: 'Meu Território', path: '/meu-territorio', icon: MapPin },
    { label: 'Minha Area', path: '/minha-area', icon: User },
    { label: 'Dados Públicos', path: '/dados-publicos', icon: Database },
    { label: 'Admin', path: '/admin', icon: Settings, isAdmin: true },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white shadow-sm">
      {/* Real-time branding and public metadata bar */}
      <div className="flex h-12 w-full items-center justify-between px-4 sm:px-6 lg:px-8 bg-slate-900 text-white text-xs font-medium shrink-0">
        <div className="flex items-center space-x-2">
          <Globe className="h-4 w-4 text-emerald-400 animate-pulse" />
          <span className="tracking-wide">SISTEMA OPERACIONAL CÍVICO: NOVO HORIZONTE</span>
          <span className="hidden sm:inline px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
            KERNEL v2026.0
          </span>
        </div>
        <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-300">
          <span className="hidden md:inline">BRANCH: <b className="text-emerald-400 text-xs">lei-organica/main</b></span>
          <span className="border-l border-slate-700 pl-3 hidden md:inline">
            UTC: {utcNow.toISOString().slice(0, 16).replace('T', ' ')}
          </span>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="w-full flex h-16 max-w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo and title */}
        <div 
          onClick={() => setPath('/')} 
          className="flex cursor-pointer items-center space-x-2.5"
          id="brand-logo"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md">
            <Scale className="h-5.5 w-5.5" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold tracking-tight text-slate-900 leading-none">CP / Código Público</h1>
            <p className="font-mono text-[10px] text-indigo-600 font-semibold uppercase tracking-wider">Democracia Direta Versionada</p>
          </div>
        </div>

        {/* Consolidated Dropdown Menu Button for Desktop */}
        <div 
          className="hidden lg:relative lg:block"
          onMouseLeave={() => setShowMenuDropdown(false)}
        >
          <button
            onClick={() => setShowMenuDropdown(!showMenuDropdown)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl border text-xs font-semibold shadow-xs transition-all ${
              showMenuDropdown
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            id="main-menu-dropdown-btn"
          >
            <Menu className="h-4 w-4 text-slate-500" />
            <span>Módulos Cívicos</span>
            <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${showMenuDropdown ? 'rotate-180 text-indigo-500' : ''}`} />
          </button>

          {showMenuDropdown && (
            <div
              className="absolute left-0 mt-2 w-64 rounded-2xl border border-slate-205 bg-white py-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 divide-y divide-slate-100"
              id="main-menu-dropdown-box"
            >
              <div className="px-4 py-2 bg-slate-50 rounded-t-2xl">
                <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">Navegação da Plataforma</span>
              </div>
              <div className="py-1">
                {navItems.filter(item => !item.isAdmin && item.path !== '/').map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        setPath(item.path);
                        setShowMenuDropdown(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-2.5 text-left text-xs font-semibold transition-colors ${
                        isActive
                          ? 'bg-indigo-50/50 text-indigo-700 border-l-2 border-indigo-600'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-2 border-transparent'
                      }`}
                    >
                      <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right side utilities */}
        <div className="flex items-center space-x-3">
          {/* Admin backdoor identifier */}
          <button
            onClick={() => setPath('/admin')}
            className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-md border font-mono text-[11px] font-semibold transition-colors ${
              currentPath.startsWith('/admin')
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold'
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
            id="admin-btn"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Admin</span>
          </button>

          {/* Citizen profile widget (auth-aware) */}
          {isAuthenticated && citizen ? (
            <div className="flex items-center space-x-1.5">
              <div
                onClick={() => setPath('/minha-area')}
                className="flex cursor-pointer items-center space-x-2 rounded-full border border-slate-200 bg-slate-50 p-1 pr-3 hover:bg-slate-100 transition-colors"
                id="citizen-profile-summary"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500 text-white font-semibold text-xs uppercase shadow-sm">
                  {citizenInitials}
                </div>
                <div className="hidden xl:block text-left text-[11px]">
                  <p className="font-semibold text-slate-800 leading-tight">{citizen.fullName}</p>
                  <p className="text-[9px] text-emerald-600 font-mono">
                    {citizen.territoryName ?? 'Sessão autenticada'}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                title="Encerrar sessão"
                id="logout-btn"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="flex items-center space-x-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
              id="login-btn"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Entrar</span>
            </button>
          )}

          {/* Notifications dropdown anchor */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative flex h-9.5 w-9.5 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 focus:outline-none"
              id="notification-bell"
            >
              <Bell className="h-4.5 w-4.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-600 font-mono text-[9px] font-bold text-white leading-none">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div 
                className="absolute right-0 mt-2 w-80 rounded-lg border border-slate-200 bg-white py-1 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                id="notifications-box"
              >
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
                  <span className="font-display font-bold text-xs text-slate-900">Notificações Cívicas</span>
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-mono text-[9px] font-semibold text-indigo-700">
                    {unreadCount} Pendentes
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotifClick(n.id, n.prId)}
                      className={`flex cursor-pointer flex-col px-4 py-3 border-b border-slate-50 transition-colors hover:bg-slate-50 ${
                        n.unread ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between space-x-1">
                        <span className="text-[11px] text-slate-700 font-medium leading-normal">
                          {n.title}
                        </span>
                        {n.unread && (
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-600" />
                        )}
                      </div>
                      <span className="mt-1 font-mono text-[9px] text-slate-400">
                        {n.date} • {n.prId}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-50 border-t border-slate-100 px-4 py-1.5 text-center">
                  <button 
                    onClick={() => {
                      setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
                      setShowNotifications(false);
                    }} 
                    className="font-mono text-[10px] font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    Marcar todas como lidas
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Simulated Browser Address Bar for Architecture Auditability */}
      <div className="border-t border-slate-200 bg-slate-50 px-4 py-2.5 hidden sm:block">
        <div className="w-full max-w-full flex items-center justify-between space-x-2 px-2 sm:px-4 lg:px-6">
          {/* Navigation Controls */}
          <div className="flex items-center space-x-1.5 shrink-0 text-slate-400">
            <button 
              onClick={() => setPath('/')} 
              disabled={currentPath === '/'}
              className="p-1 rounded hover:bg-slate-200 disabled:opacity-40 transition-colors"
              title="Voltar para o início"
            >
              <Compass className="h-3.5 w-3.5" />
            </button>
            <button 
              onClick={() => {
                const parts = currentPath.split('/');
                if (parts.length > 2) {
                  parts.pop();
                  setPath(parts.join('/') || '/');
                } else {
                  setPath('/');
                }
              }}
              disabled={currentPath === '/'}
              className="p-1 rounded hover:bg-slate-200 disabled:opacity-40 transition-colors"
              title="Voltar um diretório"
            >
              <ArrowRight className="h-3.5 w-3.5 rotate-180" />
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="p-1 rounded hover:bg-slate-200 transition-colors"
              title="Recarregar aplicação"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>

          {/* Interactive Input Bar */}
          <div className="flex-1 flex items-center space-x-2 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500 font-mono shadow-inner">
            <Terminal className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-400 select-none">app/</span>
            <input
              type="text"
              readOnly
              value={`${currentPath.replace(/^\//, '') || 'page.tsx'}`}
              className="flex-1 bg-transparent text-slate-800 font-mono outline-none cursor-default"
            />
            <span
              className={`px-1.5 py-0.5 rounded ml-auto text-[9px] font-bold tracking-wide uppercase select-none ${apiHealthBadge[apiHealth].className}`}
              title="Estado da conexão com a API do Código Público"
            >
              {apiHealthBadge[apiHealth].label}
            </span>
          </div>

          {/* Copy Shareable Path */}
          <button
            onClick={handleCopyUrl}
            className="flex items-center space-x-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors font-mono text-[10px]"
            title="Copiar URL simulada"
            id="copy-simulated-url"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-emerald-600 font-bold">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copiar Rota</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Rail (Responsive Menu bottom drawer) */}
      <div className="block lg:hidden border-t border-slate-200 bg-white">
        <div className="flex items-center justify-around overflow-x-auto py-2">
          {navItems.filter(item => !item.isAdmin && item.label !== 'Dados Públicos' && item.label !== 'Releases Leg.').map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => setPath(item.path)}
                className={`flex flex-col items-center space-y-0.5 px-2 py-1 text-center transition-all ${
                  isActive ? 'text-indigo-600' : 'text-slate-500'
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
                <span className="text-[9px] font-medium leading-none">{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
          {/* Admin link mobile */}
          <button
            onClick={() => setPath('/admin')}
            className={`flex flex-col items-center space-y-0.5 px-2 py-1 text-center transition-all ${
              currentPath.startsWith('/admin') ? 'text-indigo-600' : 'text-slate-500'
            }`}
          >
            <Settings className="h-4.5 w-4.5" />
            <span className="text-[9px] font-medium leading-none">Admin</span>
          </button>
        </div>
      </div>
    </header>
  );
}
