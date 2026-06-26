import type { LucideIcon } from 'lucide-react';
import {
  CheckSquare,
  ClipboardList,
  Landmark,
  LayoutDashboard,
  Layers,
  MapPin,
  Shield,
  Vote,
} from 'lucide-react';

export type AppView =
  | 'painel'
  | 'cidadao'
  | 'sorteio'
  | 'votacao'
  | 'execucao'
  | 'auditoria'
  | 'institucional'
  | 'gestor';

type AccessLevel = 'public' | 'institutional' | 'general';

export interface NavItem {
  id: AppView;
  label: string;
  icon: LucideIcon;
  num: string;
  access: AccessLevel;
}

export const navItems: NavItem[] = [
  { id: 'painel', label: 'Painel do Ciclo', icon: LayoutDashboard, num: '00', access: 'public' },
  { id: 'cidadao', label: 'Meu Território', icon: MapPin, num: '01', access: 'public' },
  { id: 'sorteio', label: 'Conselho Territorial', icon: Layers, num: '02', access: 'public' },
  { id: 'votacao', label: 'Votação Territorial', icon: Vote, num: '03', access: 'public' },
  { id: 'execucao', label: 'Execução e Aprendizado', icon: CheckSquare, num: '04', access: 'public' },
  { id: 'auditoria', label: 'Auditoria Pública', icon: Shield, num: '05', access: 'public' },
  { id: 'institucional', label: 'Matriz e Câmara', icon: Landmark, num: '06', access: 'institutional' },
  { id: 'gestor', label: 'Gestão do Ciclo', icon: ClipboardList, num: '07', access: 'general' },
];

const institutionalRoles = new Set([
  'sysadmin',
  'admin',
  'institutional_admin',
  'legislative_admin',
  'vereador',
  'mesa_diretora',
]);

const generalRoles = new Set([
  ...institutionalRoles,
]);

function normalizeRole(role?: string | null) {
  return role?.trim().toLowerCase() || 'guest';
}

export function isInstitutionalRole(role?: string | null) {
  return institutionalRoles.has(normalizeRole(role));
}

export function isGeneralRole(role?: string | null) {
  return generalRoles.has(normalizeRole(role));
}

export function canAccessView(view: string, role?: string | null) {
  const item = navItems.find(navItem => navItem.id === view);
  if (!item) return false;
  if (item.access === 'public') return true;
  if (item.access === 'institutional') return isInstitutionalRole(role);
  return isGeneralRole(role);
}

export function visibleNavItems(role?: string | null) {
  return navItems.filter(item => canAccessView(item.id, role));
}

export function roleLabel(role?: string | null) {
  switch (normalizeRole(role)) {
    case 'sysadmin':
      return 'Maintainer técnico';
    case 'admin':
      return 'Administrador';
    case 'institutional_admin':
      return 'Admin institucional';
    case 'legislative_admin':
      return 'Admin legislativo';
    case 'vereador':
      return 'Vereador';
    case 'mesa_diretora':
      return 'Mesa diretora';
    case 'citizen':
      return 'Cidadão';
    default:
      return 'Visitante';
  }
}
