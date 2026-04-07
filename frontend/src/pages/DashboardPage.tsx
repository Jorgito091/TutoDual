import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Spinner from '../components/Spinner';
import { useAuth } from '../hooks/useAuth';
import {
  academicLoadApi,
  companiesApi,
  dualProjectsApi,
  evaluationsApi,
  usersApi,
} from '../services/api';
import type { AcademicLoad, Company, DualProject, Evaluation7030, User } from '../types';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  onClick?: () => void;
}

function StatCard({ label, value, icon, color, onClick }: StatCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white rounded-xl shadow p-5 flex items-center gap-4 hover:shadow-md transition ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </button>
  );
}

export default function DashboardPage() {
  const { role, userId } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState<User[]>([]);
  const [loads, setLoads] = useState<AcademicLoad[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<DualProject[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation7030[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const promises: Promise<unknown>[] = [
          role === 'ALUMNO' && userId
            ? academicLoadApi.getByStudent(userId)
            : academicLoadApi.list(),
          dualProjectsApi.list(),
          evaluationsApi.list(),
        ];
        if (role === 'ADMINISTRADOR') {
          promises.push(usersApi.list(), companiesApi.list());
        } else if (role !== 'ALUMNO') {
          promises.push(companiesApi.list());
        }

        const results = await Promise.allSettled(promises);
        if (results[0].status === 'fulfilled') setLoads(results[0].value as AcademicLoad[]);
        if (results[1].status === 'fulfilled') setProjects(results[1].value as DualProject[]);
        if (results[2].status === 'fulfilled') setEvaluations(results[2].value as Evaluation7030[]);
        if (role === 'ADMINISTRADOR') {
          if (results[3].status === 'fulfilled') setUsers(results[3].value as User[]);
          if (results[4].status === 'fulfilled') setCompanies(results[4].value as Company[]);
        } else if (role !== 'ALUMNO') {
          if (results[3].status === 'fulfilled') setCompanies(results[3].value as Company[]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [role, userId]);

  const pendingSync = evaluations.filter(
    (e) => e.final_grade_calculated !== null && !e.sincronizado_core
  ).length;

  const activeProjects = projects.filter((p) => p.status === 'ACTIVO').length;
  const gradeAvg =
    evaluations.filter((e) => e.final_grade_calculated !== null).length > 0
      ? (
          evaluations
            .filter((e) => e.final_grade_calculated !== null)
            .reduce((sum, e) => sum + (e.final_grade_calculated ?? 0), 0) /
          evaluations.filter((e) => e.final_grade_calculated !== null).length
        ).toFixed(1)
      : '—';

  const recentEvals = [...evaluations]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <Layout title="Inicio — Panel General">
      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats */}
          <div
            className={`grid gap-4 ${
              role === 'ADMINISTRADOR'
                ? 'grid-cols-2 lg:grid-cols-5'
                : 'grid-cols-2 lg:grid-cols-4'
            }`}
          >
            {role === 'ADMINISTRADOR' && (
              <StatCard
                label="Usuarios registrados"
                value={users.length}
                icon="👥"
                color="bg-blue-50"
                onClick={() => navigate('/usuarios')}
              />
            )}
            <StatCard
              label="Carga académica"
              value={loads.length}
              icon="📚"
              color="bg-indigo-50"
              onClick={() => navigate('/kardex')}
            />
            {role !== 'ALUMNO' && (
              <StatCard
                label="Empresas activas"
                value={companies.filter((c) => c.is_active).length}
                icon="🏢"
                color="bg-amber-50"
                onClick={() => navigate('/empresas')}
              />
            )}
            <StatCard
              label="Proyectos activos"
              value={activeProjects}
              icon="🎯"
              color="bg-purple-50"
              onClick={() => navigate('/proyectos')}
            />
            <StatCard
              label="Promedio de notas"
              value={gradeAvg}
              icon="📊"
              color="bg-green-50"
              onClick={() => navigate('/evaluaciones')}
            />
          </div>

          {/* Pending sync alert */}
          {pendingSync > 0 && (
            <div
              className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-amber-100 transition"
              onClick={() => navigate('/evaluaciones')}
            >
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-semibold text-amber-800">
                  {pendingSync} evaluación{pendingSync > 1 ? 'es' : ''} pendiente{pendingSync > 1 ? 's' : ''} de sincronizar al Core
                </p>
                <p className="text-sm text-amber-600">
                  Haz clic aquí para ir a Evaluaciones y sincronizar.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Evaluations */}
            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Evaluaciones recientes</h3>
                <button
                  onClick={() => navigate('/evaluaciones')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition"
                >
                  Ver todas →
                </button>
              </div>
              {recentEvals.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">Sin evaluaciones</p>
              ) : (
                <div className="space-y-3">
                  {recentEvals.map((ev) => (
                    <div key={ev.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Proyecto #{ev.dual_project_id}
                        </p>
                        <p className="text-xs text-gray-400">Alumno #{ev.student_id}</p>
                      </div>
                      <div className="text-right">
                        {ev.final_grade_calculated !== null ? (
                          <span
                            className={`text-sm font-bold ${
                              ev.final_grade_calculated >= 7 ? 'text-green-600' : 'text-red-500'
                            }`}
                          >
                            {ev.final_grade_calculated}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Pendiente</span>
                        )}
                        <p className="text-xs mt-0.5">
                          {ev.sincronizado_core ? (
                            <span className="text-green-500">✓ Sync</span>
                          ) : (
                            <span className="text-yellow-500">⏳</span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Projects */}
            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Proyectos duales recientes</h3>
                <button
                  onClick={() => navigate('/proyectos')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition"
                >
                  Ver todos →
                </button>
              </div>
              {recentProjects.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">Sin proyectos</p>
              ) : (
                <div className="space-y-3">
                  {recentProjects.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-700">{p.materia}</p>
                        <p className="text-xs text-gray-400">{p.periodo} · Alumno #{p.student_id}</p>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          p.status === 'ACTIVO'
                            ? 'bg-blue-100 text-blue-700'
                            : p.status === 'COMPLETADO'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Acciones rápidas</h3>
            <div className="flex flex-wrap gap-3">
              {role === 'ADMINISTRADOR' && (
                <button
                  onClick={() => navigate('/usuarios')}
                  className="flex items-center gap-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition"
                >
                  👥 Gestionar usuarios
                </button>
              )}
              {(role === 'ADMINISTRADOR' || role === 'DOCENTE') && (
                <>
                  <button
                    onClick={() => navigate('/kardex')}
                    className="flex items-center gap-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition"
                  >
                    📚 Agregar carga académica
                  </button>
                  <button
                    onClick={() => navigate('/empresas')}
                    className="flex items-center gap-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-lg transition"
                  >
                    🏢 Registrar empresa
                  </button>
                  <button
                    onClick={() => navigate('/proyectos')}
                    className="flex items-center gap-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition"
                  >
                    🎯 Crear proyecto dual
                  </button>
                </>
              )}
              <button
                onClick={() => navigate('/evaluaciones')}
                className="flex items-center gap-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg transition"
              >
                📊 {role === 'EXTERNO' ? 'Asignar nota empresa' : 'Ver evaluaciones'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
