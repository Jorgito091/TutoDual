import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  roles?: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Inicio', icon: '🏠' },
  { to: '/usuarios', label: 'Usuarios', icon: '👥', roles: ['ADMINISTRADOR'] },
  { to: '/kardex', label: 'Kardex', icon: '📚' },
  { to: '/empresas', label: 'Empresas', icon: '🏢', roles: ['ADMINISTRADOR', 'DOCENTE', 'EXTERNO'] },
  { to: '/proyectos', label: 'Proyectos Duales', icon: '🎯' },
  { to: '/evaluaciones', label: 'Evaluaciones', icon: '📊' },
];

export default function Sidebar() {
  const { role } = useAuth();

  const visible = NAV_ITEMS.filter(
    (item) => !item.roles || (role && item.roles.includes(role))
  );

  return (
    <aside className="w-60 bg-indigo-900 text-white min-h-screen flex flex-col shrink-0">
      <div className="px-6 py-5 border-b border-indigo-800">
        <h1 className="text-xl font-bold tracking-tight">TutoDual</h1>
        <p className="text-indigo-300 text-xs mt-0.5">Gestión Académica</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {visible.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive
                  ? 'bg-indigo-700 text-white'
                  : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
