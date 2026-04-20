import { useAuth } from '../hooks/useAuth';

const roleLabel: Record<string, string> = {
  ALUMNO: 'Alumno',
  DOCENTE: 'Docente',
  ADMINISTRADOR: 'Administrador',
  EXTERNO: 'Externo / Mentor',
};

const roleColor: Record<string, string> = {
  ALUMNO: 'bg-blue-100 text-blue-700',
  DOCENTE: 'bg-purple-100 text-purple-700',
  ADMINISTRADOR: 'bg-red-100 text-red-700',
  EXTERNO: 'bg-amber-100 text-amber-700',
};

export default function Navbar({ title }: { title: string }) {
  const { role, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      <div className="flex items-center gap-3">
        {role && (
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${roleColor[role]}`}>
            {roleLabel[role]}
          </span>
        )}
        <button
          onClick={logout}
          className="text-sm text-gray-500 hover:text-red-600 font-medium transition"
        >
          Cerrar sesión →
        </button>
      </div>
    </header>
  );
}
