import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { academicLoadApi, companiesApi, dualProjectsApi, evaluationsApi } from '../services/api';
import type { AcademicLoad, Company, DualProject, Evaluation7030 } from '../types';

export default function DashboardPage() {
  const { role, userId, logout } = useAuth();
  const [academicLoads, setAcademicLoads] = useState<AcademicLoad[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<DualProject[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation7030[]>([]);
  const [activeTab, setActiveTab] = useState<'kardex' | 'empresas' | 'proyectos' | 'evaluaciones'>('kardex');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (role === 'ALUMNO' && userId) {
          const [loads, projs, evals] = await Promise.all([
            academicLoadApi.getByStudent(userId),
            dualProjectsApi.list(),
            evaluationsApi.list(),
          ]);
          setAcademicLoads(loads);
          setProjects(projs);
          setEvaluations(evals);
        } else {
          const [loads, comps, projs, evals] = await Promise.all([
            academicLoadApi.list(),
            companiesApi.list(),
            dualProjectsApi.list(),
            evaluationsApi.list(),
          ]);
          setAcademicLoads(loads);
          setCompanies(comps);
          setProjects(projs);
          setEvaluations(evals);
        }
      } catch (e) {
        console.error('Error loading data', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [role, userId]);

  const roleLabel: Record<string, string> = {
    ALUMNO: 'Alumno',
    DOCENTE: 'Docente',
    ADMINISTRADOR: 'Administrador',
    EXTERNO: 'Externo / Mentor',
  };

  const tabClass = (tab: typeof activeTab) =>
    `px-4 py-2 font-medium rounded-t-lg transition ${
      activeTab === tab
        ? 'bg-white text-indigo-700 border-b-2 border-indigo-600'
        : 'text-gray-500 hover:text-gray-700'
    }`;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-indigo-700 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold">TutoDual</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm bg-indigo-600 px-3 py-1 rounded-full">
              {role ? roleLabel[role] : ''}
            </span>
            <button
              onClick={logout}
              className="text-sm bg-white text-indigo-700 hover:bg-gray-100 px-3 py-1 rounded-lg font-medium transition"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-300">
          <button className={tabClass('kardex')} onClick={() => setActiveTab('kardex')}>
            📚 Kardex
          </button>
          {role !== 'ALUMNO' && (
            <button className={tabClass('empresas')} onClick={() => setActiveTab('empresas')}>
              🏢 Empresas
            </button>
          )}
          <button className={tabClass('proyectos')} onClick={() => setActiveTab('proyectos')}>
            🎯 Proyectos Duales
          </button>
          <button className={tabClass('evaluaciones')} onClick={() => setActiveTab('evaluaciones')}>
            📊 Evaluaciones
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
          </div>
        ) : (
          <>
            {/* Kardex Tab */}
            {activeTab === 'kardex' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Carga Académica</h2>
                {academicLoads.length === 0 ? (
                  <p className="text-gray-500">Sin registros.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full bg-white rounded-xl shadow text-sm">
                      <thead className="bg-indigo-50 text-indigo-700">
                        <tr>
                          <th className="px-4 py-3 text-left">ID</th>
                          <th className="px-4 py-3 text-left">Materia</th>
                          <th className="px-4 py-3 text-left">Periodo</th>
                          <th className="px-4 py-3 text-left">Alumno ID</th>
                          <th className="px-4 py-3 text-left">Docente ID</th>
                          <th className="px-4 py-3 text-left">Calificación Final</th>
                        </tr>
                      </thead>
                      <tbody>
                        {academicLoads.map((load) => (
                          <tr key={load.id} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-3">{load.id}</td>
                            <td className="px-4 py-3 font-medium">{load.materia}</td>
                            <td className="px-4 py-3">{load.periodo}</td>
                            <td className="px-4 py-3">{load.student_id}</td>
                            <td className="px-4 py-3">{load.docente_id}</td>
                            <td className="px-4 py-3">
                              {load.calificacion_final !== null ? (
                                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-semibold">
                                  {load.calificacion_final}
                                </span>
                              ) : (
                                <span className="text-gray-400 italic">Pendiente</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Empresas Tab */}
            {activeTab === 'empresas' && role !== 'ALUMNO' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Empresas Aliadas</h2>
                {companies.length === 0 ? (
                  <p className="text-gray-500">Sin empresas registradas.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {companies.map((company) => (
                      <div key={company.id} className="bg-white rounded-xl shadow p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-800">{company.nombre}</h3>
                            <p className="text-sm text-gray-500">RFC: {company.rfc}</p>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              company.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {company.is_active ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>
                        {company.sector && (
                          <p className="text-sm text-indigo-600 mt-1">Sector: {company.sector}</p>
                        )}
                        {company.contacto_nombre && (
                          <p className="text-sm text-gray-600 mt-2">
                            Contacto: {company.contacto_nombre}
                          </p>
                        )}
                        {company.contacto_email && (
                          <p className="text-sm text-gray-500">{company.contacto_email}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Proyectos Tab */}
            {activeTab === 'proyectos' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Proyectos Duales</h2>
                {projects.length === 0 ? (
                  <p className="text-gray-500">Sin proyectos registrados.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full bg-white rounded-xl shadow text-sm">
                      <thead className="bg-indigo-50 text-indigo-700">
                        <tr>
                          <th className="px-4 py-3 text-left">ID</th>
                          <th className="px-4 py-3 text-left">Alumno</th>
                          <th className="px-4 py-3 text-left">Materia</th>
                          <th className="px-4 py-3 text-left">Periodo</th>
                          <th className="px-4 py-3 text-left">Empresa</th>
                          <th className="px-4 py-3 text-left">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projects.map((p) => (
                          <tr key={p.id} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-3">{p.id}</td>
                            <td className="px-4 py-3">{p.student_id}</td>
                            <td className="px-4 py-3 font-medium">{p.materia}</td>
                            <td className="px-4 py-3">{p.periodo}</td>
                            <td className="px-4 py-3">{p.company_id}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  p.status === 'ACTIVO'
                                    ? 'bg-blue-100 text-blue-700'
                                    : p.status === 'COMPLETADO'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Evaluaciones Tab */}
            {activeTab === 'evaluaciones' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Evaluaciones 70/30
                </h2>
                {evaluations.length === 0 ? (
                  <p className="text-gray-500">Sin evaluaciones registradas.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full bg-white rounded-xl shadow text-sm">
                      <thead className="bg-indigo-50 text-indigo-700">
                        <tr>
                          <th className="px-4 py-3 text-left">ID</th>
                          <th className="px-4 py-3 text-left">Proyecto</th>
                          <th className="px-4 py-3 text-left">Nota Empresa (70%)</th>
                          <th className="px-4 py-3 text-left">Nota Docente (30%)</th>
                          <th className="px-4 py-3 text-left">Nota Final</th>
                          <th className="px-4 py-3 text-left">Sincronizado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {evaluations.map((ev) => (
                          <tr key={ev.id} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-3">{ev.id}</td>
                            <td className="px-4 py-3">{ev.dual_project_id}</td>
                            <td className="px-4 py-3">
                              {ev.nota_empresa !== null ? ev.nota_empresa : <span className="text-gray-400 italic">—</span>}
                            </td>
                            <td className="px-4 py-3">
                              {ev.nota_docente !== null ? ev.nota_docente : <span className="text-gray-400 italic">—</span>}
                            </td>
                            <td className="px-4 py-3">
                              {ev.final_grade_calculated !== null ? (
                                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-semibold">
                                  {ev.final_grade_calculated}
                                </span>
                              ) : (
                                <span className="text-gray-400 italic">Pendiente</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  ev.sincronizado_core
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}
                              >
                                {ev.sincronizado_core ? '✓ Sincronizado' : 'Pendiente'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
