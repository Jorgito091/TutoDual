import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import { useToast } from '../components/Toast';
import { dualProjectsApi, companiesApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { DualProject, ProjectStatus, Company } from '../types';

const STATUS_LABELS: Record<ProjectStatus, string> = {
  ACTIVO: 'Activo',
  COMPLETADO: 'Completado',
  CANCELADO: 'Cancelado',
};
const STATUS_COLORS: Record<ProjectStatus, string> = {
  ACTIVO: 'bg-blue-100 text-blue-700',
  COMPLETADO: 'bg-green-100 text-green-700',
  CANCELADO: 'bg-red-100 text-red-600',
};

interface ProjectForm {
  student_id: string;
  asesor_academico_id: string;
  mentor_empresarial_id: string;
  company_id: string;
  materia: string;
  periodo: string;
  status: ProjectStatus;
  descripcion: string;
  academic_load_id: string;
}

const emptyForm: ProjectForm = {
  student_id: '',
  asesor_academico_id: '',
  mentor_empresarial_id: '',
  company_id: '',
  materia: '',
  periodo: '',
  status: 'ACTIVO',
  descripcion: '',
  academic_load_id: '',
};

export default function DualProjectsPage() {
  const showToast = useToast();
  const { role, userId } = useAuth();
  const [projects, setProjects] = useState<DualProject[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editProject, setEditProject] = useState<DualProject | null>(null);
  const [form, setForm] = useState<ProjectForm>(emptyForm);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | ''>('');

  const load = async () => {
    setLoading(true);
    try {
      const [projs, comps] = await Promise.all([
        dualProjectsApi.list(),
        companiesApi.list(),
      ]);
      setProjects(projs);
      setCompanies(comps);
    } catch {
      showToast('Error al cargar proyectos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditProject(null);
    setForm({
      ...emptyForm,
      student_id: role === 'ALUMNO' && userId ? String(userId) : '',
    });
    setModalOpen(true);
  };

  const openEdit = (p: DualProject) => {
    setEditProject(p);
    setForm({
      student_id: String(p.student_id),
      asesor_academico_id: String(p.asesor_academico_id),
      mentor_empresarial_id: String(p.mentor_empresarial_id),
      company_id: String(p.company_id),
      materia: p.materia,
      periodo: p.periodo,
      status: p.status,
      descripcion: p.descripcion ?? '',
      academic_load_id: p.academic_load_id !== null ? String(p.academic_load_id) : '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editProject) {
        await dualProjectsApi.update(editProject.id, {
          status: form.status,
          descripcion: form.descripcion || null,
          academic_load_id: form.academic_load_id ? parseInt(form.academic_load_id) : null,
        });
        showToast('Proyecto actualizado', 'success');
      } else {
        await dualProjectsApi.create({
          student_id: parseInt(form.student_id),
          asesor_academico_id: parseInt(form.asesor_academico_id),
          mentor_empresarial_id: parseInt(form.mentor_empresarial_id),
          company_id: parseInt(form.company_id),
          materia: form.materia,
          periodo: form.periodo,
          status: form.status,
          descripcion: form.descripcion || null,
          academic_load_id: form.academic_load_id ? parseInt(form.academic_load_id) : null,
        });
        showToast('Proyecto dual creado', 'success');
      }
      setModalOpen(false);
      load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Error al guardar proyecto';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const canCreate = role === 'ADMINISTRADOR' || role === 'DOCENTE';

  const filtered = projects.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      p.materia.toLowerCase().includes(q) ||
      p.periodo.toLowerCase().includes(q) ||
      String(p.student_id).includes(q);
    const matchStatus = !filterStatus || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const companyName = (id: number) =>
    companies.find((c) => c.id === id)?.nombre ?? `Empresa #${id}`;

  return (
    <Layout title="Proyectos Duales">
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Buscar por materia, periodo, alumno..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ProjectStatus | '')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">Todos los estados</option>
            {(Object.keys(STATUS_LABELS) as ProjectStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        {canCreate && (
          <button
            onClick={openCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            + Nuevo Proyecto
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-2 py-16 text-center text-gray-400">
              No se encontraron proyectos duales
            </div>
          ) : (
            filtered.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-xl shadow p-5 hover:shadow-md transition flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">{p.materia}</h3>
                    <p className="text-sm text-gray-500">Periodo: {p.periodo}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[p.status]}`}>
                    {STATUS_LABELS[p.status]}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                  <span>👤 Alumno: <strong>#{p.student_id}</strong></span>
                  <span>🎓 Asesor: <strong>#{p.asesor_academico_id}</strong></span>
                  <span>🏢 {companyName(p.company_id)}</span>
                  <span>👔 Mentor: <strong>#{p.mentor_empresarial_id}</strong></span>
                  {p.academic_load_id && (
                    <span className="text-indigo-600">📋 Kardex ID: #{p.academic_load_id}</span>
                  )}
                </div>

                {p.descripcion && (
                  <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 line-clamp-2">
                    {p.descripcion}
                  </p>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={() => openEdit(p)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition"
                  >
                    Editar →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editProject ? 'Editar Proyecto Dual' : 'Nuevo Proyecto Dual'}
        onClose={() => setModalOpen(false)}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editProject && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID del Alumno *
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={form.student_id}
                    onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                    required
                    min="1"
                    readOnly={role === 'ALUMNO'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID Asesor Académico *
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={form.asesor_academico_id}
                    onChange={(e) => setForm({ ...form, asesor_academico_id: e.target.value })}
                    required
                    min="1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID Mentor Empresarial *
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={form.mentor_empresarial_id}
                    onChange={(e) => setForm({ ...form, mentor_empresarial_id: e.target.value })}
                    required
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Empresa *
                  </label>
                  <select
                    className="input-field"
                    value={form.company_id}
                    onChange={(e) => setForm({ ...form, company_id: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar empresa...</option>
                    {companies.filter((c) => c.is_active).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Materia *</label>
                  <input
                    className="input-field"
                    value={form.materia}
                    onChange={(e) => setForm({ ...form, materia: e.target.value })}
                    required
                    placeholder="Debe coincidir con el Core"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Periodo *</label>
                  <input
                    className="input-field"
                    value={form.periodo}
                    onChange={(e) => setForm({ ...form, periodo: e.target.value })}
                    required
                    placeholder="Ej: 2024-A"
                  />
                </div>
              </div>
            </>
          )}

          {editProject && (
            <div>
              <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-2">
                ✏️ Solo se puede modificar el estado, descripción y el ID de kardex del Core.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              className="input-field"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}
            >
              {(Object.keys(STATUS_LABELS) as ProjectStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              className="input-field resize-none"
              rows={3}
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Descripción del proyecto (opcional)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID Carga Académica (Core)
              <span className="text-gray-400 font-normal ml-1 text-xs">
                — para sincronizar calificación
              </span>
            </label>
            <input
              type="number"
              className="input-field"
              value={form.academic_load_id}
              onChange={(e) => setForm({ ...form, academic_load_id: e.target.value })}
              placeholder="ID del registro en academic_load"
              min="1"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition disabled:opacity-50"
            >
              {saving ? 'Guardando...' : editProject ? 'Actualizar' : 'Crear Proyecto'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
