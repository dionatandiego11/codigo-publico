import {
  BarChart3,
  ClipboardCheck,
  FileText,
  Home,
  Settings,
  Vote,
  User,
  type LucideIcon,
} from 'lucide-react';
import type { AdminContext } from '../auth/AuthContext';

export type AppView = 'inicio' | 'demandas' | 'votacao' | 'resultados' | 'usuario';
export type UserProfile = 'guest' | 'citizen' | 'management' | 'admin';

type AccessLevel = 'public' | 'management' | 'admin';

export interface NavItem {
  id: AppView;
  label: string;
  icon: LucideIcon;
  access: AccessLevel;
}

export const navItems: NavItem[] = [
  { id: 'inicio', label: 'Início', icon: Home, access: 'public' },
  { id: 'demandas', label: 'Demandas', icon: FileText, access: 'public' },
  { id: 'votacao', label: 'Votação', icon: Vote, access: 'public' },
  { id: 'resultados', label: 'Resultados', icon: BarChart3, access: 'public' },
  { id: 'usuario', label: 'Minha Área', icon: User, access: 'public' },
];

function normalizeRole(role?: string | null) {
  return role?.trim().toLowerCase() || 'guest';
}

export function userProfile(role?: string | null, adminContext?: AdminContext | null): UserProfile {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === 'sysadmin' || normalizedRole === 'admin' || adminContext?.canTechnical || adminContext?.canGeneral) {
    return 'admin';
  }
  if (
    ['institutional_admin', 'legislative_admin', 'vereador', 'mesa_diretora'].includes(normalizedRole) ||
    adminContext?.canTerritorial
  ) {
    return 'management';
  }
  return normalizedRole === 'guest' ? 'guest' : 'citizen';
}

export function canAccessView(view: string, profile: UserProfile) {
  const item = navItems.find(navItem => navItem.id === view);
  if (!item) return false;
  if (item.access === 'public') return true;
  if (item.access === 'management') return profile === 'management' || profile === 'admin';
  return profile === 'admin';
}

export function visibleNavItems(profile: UserProfile) {
  return navItems.filter(item => canAccessView(item.id, profile));
}

export function profileLabel(profile: UserProfile) {
  switch (profile) {
    case 'admin':
      return 'Administrador';
    case 'management':
      return 'Gestão';
    case 'citizen':
      return 'Cidadão';
    default:
      return 'Visitante';
  }
}
