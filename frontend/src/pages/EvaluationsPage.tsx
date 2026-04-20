import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import { useToast } from '../components/Toast';
import { evaluationsApi, dualProjectsApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { Evaluation7030, DualProject } from '../types';

interface EvalForm {
  dual_project_id: string;
  student_id: string;
  nota_empresa: string;
  nota_docente: string;
  observaciones_empresa: string;
  observaciones_docente: string;
}

const emptyForm: EvalForm = {
  dual_project_id: '',
  student_id: '',
  nota_empresa: '',
  nota_docente: '',
  observaciones_empresa: '',
  observaciones_docente: '',
};

function GradeBar({ label, value, color }: { label: string; value: number | null; color: string }) {
  const pct = value !== null ? (value / 10) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{label}</span>
        <span className="font-semibold text-gray-700">{value !== null ? value : '—'}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function EvaluationsPage() {
  const showToast = useToast();
  const { role, userId } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation7030[]>([]);
  const [projects, setProjects] = useState<DualProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState<number | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editEval, setEditEval] = useState<Evaluation7030 | null>(null);
  const [form, setForm] = useState<EvalForm>(emptyForm);
  const [detailEval, setDetailEval] = useState<Evaluation7030 | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [evals, projs] = await Promise.all([
        evaluationsApi.list(),
        dualProjectsApi.list(),
      ]);
      setEvaluations(evals);
      setProjects(projs);
    } catch {
      showToast('Error al cargar evaluaciones', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditEval(null);
    setForm({
      ...emptyForm,
      student_id: role === 'ALUMNO' && userId ? String(userId) : '',
    });
    setModalOpen(true);
  };

  const openEdit = (ev: Evaluation7030) => {
    setEditEval(ev);
    setForm({
      dual_project_id: String(ev.dual_project_id),
      student_id: String(ev.student_id),
      nota_empresa: ev.nota_empresa !== null ? String(ev.nota_empresa) : '',
      nota_docente: ev.nota_docente !== null ? String(ev.nota_docente) : '',
      observaciones_empresa: ev.observaciones_empresa ?? '',
      observaciones_docente: ev.observaciones_docente ?? '',
    });
    setModalOpen(true);
  };

  // Preview the 70/30 calculation live
  const previewGrade = () => {
    const empresa = parseFloat(form.nota_empresa);
    const docente = parseFloat(form.nota_docente);
    if (!isNaN(empresa) && !isNaN(docente)) {
      return Math.round((empresa * 0.7 + docente * 0.3) * 100) / 100;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        nota_empresa: form.nota_empresa !== '' ? parseFloat(form.nota_empresa) : null,
        nota_docente: form.nota_docente !== '' ? parseFloat(form.nota_docente) : null,
        observaciones_empresa: form.observaciones_empresa || null,
        observaciones_docente: form.observaciones_docente || null,
      };

      if (editEval) {
        await evaluationsApi.update(editEval.id, payload);
        showToast('Evaluación actualizada', 'success');
      } else {
        await evaluationsApi.create({
          ...payload,
          dual_project_id: parseInt(form.dual_project_id),
          student_id: parseInt(form.student_id),
        });
        showToast('Evaluación creada', 'success');
      }
      setModalOpen(false);
      load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Error al guardar evaluación';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async (ev: Evaluation7030) => {
    setSyncing(ev.id);
    try {
      await evaluationsApi.syncToCore(ev.id);
      showToast('✓ Calificación sincronizada al Core (academic_load)', 'success');
      load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Error al sincronizar';
      showToast(msg, 'error');
    } finally {
      setSyncing(null);
    }
  };

  const canCreate = role !== 'ALUMNO';
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  return (
    <Layout title="Evaluaciones 70/30">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">
          Calificación final = <strong>Empresa × 70%</strong> + <strong>Docente × 30%</strong>
        </p>
        {canCreate && (
          <button
            onClick={openCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            + Nueva Evaluación
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="space-y-3">
          {evaluations.length === 0 ? (
            <div className="py-16 text-center text-gray-400">No hay evaluaciones registradas</div>
          ) : (
            evaluations.map((ev) => {
              const project = projectMap.get(ev.dual_project_id);
              const isSyncing = syncing === ev.id;
              return (
                <div
                  key={ev.id}
                  className="bg-white rounded-xl shadow p-5 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-800">
                          {project ? `${project.materia} — ${project.periodo}` : `Proyecto #${ev.dual_project_id}`}
                        </h3>
                        {ev.sincronizado_core ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            ✓ Sincronizado
                          </span>
                        ) : (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                            Pendiente sincronización
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-3">
                        Alumno ID: {ev.student_id} · Evaluación #{ev.id}
                      </p>

                      <div className="grid grid-cols-3 gap-3 max-w-md">
                        <GradeBar label="Empresa (70%)" value={ev.nota_empresa} color="bg-blue-400" />
                        <GradeBar label="Docente (30%)" value={ev.nota_docente} color="bg-purple-400" />
                        <GradeBar
                          label="Final"
                          value={ev.final_grade_calculated}
                          color={
                            ev.final_grade_calculated !== null && ev.final_grade_calculated >= 7
                              ? 'bg-green-500'
                              : 'bg-red-400'
                          }
                        />
                      </div>

                      {ev.final_grade_calculated !== null && (
                        <div className="mt-3 inline-flex items-center gap-2">
                          <span className="text-2xl font-bold text-gray-800">
                            {ev.final_grade_calculated}
                          </span>
                          <span className="text-sm text-gray-400">/ 10</span>
                          <span className={`ml-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                            ev.final_grade_calculated >= 7
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-600'
                          }`}>
                            {ev.final_grade_calculated >= 7 ? 'Aprobado' : 'Reprobado'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => setDetailEval(ev)}
                        className="text-xs text-gray-500 hover:text-gray-700 font-medium transition border border-gray-200 rounded-lg px-3 py-1.5"
                      >
                        Ver detalle
                      </button>
                      <button
                        onClick={() => openEdit(ev)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition border border-indigo-200 rounded-lg px-3 py-1.5"
                      >
                        Editar notas
                      </button>
                      {!ev.sincronizado_core && ev.final_grade_calculated !== null && !isSyncing && (
                        <button
                          onClick={() => handleSync(ev)}
                          className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition rounded-lg px-3 py-1.5"
                        >
                          Sincronizar →
                        </button>
                      )}
                      {isSyncing && (
                        <div className="flex justify-center py-1">
                          <Spinner size="sm" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        title={editEval ? 'Editar Evaluación' : 'Nueva Evaluación'}
        onClose={() => setModalOpen(false)}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editEval && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID Proyecto Dual *
                </label>
                <select
                  className="input-field"
                  value={form.dual_project_id}
                  onChange={(e) => {
                    const proj = projects.find((p) => p.id === parseInt(e.target.value));
                    setForm({
                      ...form,
                      dual_project_id: e.target.value,
                      student_id: proj ? String(proj.student_id) : form.student_id,
                    });
                  }}
                  required
                >
                  <option value="">Seleccionar proyecto...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.id} — {p.materia} ({p.periodo})
                    </option>
                  ))}
                </select>
              </div>
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
                />
              </div>
            </div>
          )}

          {/* Grade Inputs with Live Preview */}
          <div className="bg-indigo-50 rounded-xl p-4 space-y-4">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
              Calificaciones
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nota Empresa (70%) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  className="input-field"
                  value={form.nota_empresa}
                  onChange={(e) => setForm({ ...form, nota_empresa: e.target.value })}
                  placeholder="0.0 — 10.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nota Docente (30%) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  className="input-field"
                  value={form.nota_docente}
                  onChange={(e) => setForm({ ...form, nota_docente: e.target.value })}
                  placeholder="0.0 — 10.0"
                />
              </div>
            </div>

            {/* Live Calculation Preview */}
            {(form.nota_empresa !== '' || form.nota_docente !== '') && (
              <div className="bg-white rounded-lg p-3 text-sm">
                <p className="text-gray-500 text-xs mb-1">Cálculo en tiempo real:</p>
                <p className="font-mono text-gray-700">
                  {form.nota_empresa !== '' ? form.nota_empresa : '?'} × 0.7
                  {' + '}
                  {form.nota_docente !== '' ? form.nota_docente : '?'} × 0.3
                  {' = '}
                  {previewGrade() !== null ? (
                    <strong className="text-indigo-700 text-lg">{previewGrade()}</strong>
                  ) : (
                    <span className="text-gray-400">...</span>
                  )}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones empresa
            </label>
            <textarea
              className="input-field resize-none"
              rows={2}
              value={form.observaciones_empresa}
              onChange={(e) => setForm({ ...form, observaciones_empresa: e.target.value })}
              placeholder="Retroalimentación del mentor empresarial..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones docente
            </label>
            <textarea
              className="input-field resize-none"
              rows={2}
              value={form.observaciones_docente}
              onChange={(e) => setForm({ ...form, observaciones_docente: e.target.value })}
              placeholder="Retroalimentación del asesor académico..."
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
              {saving ? 'Guardando...' : editEval ? 'Actualizar' : 'Crear Evaluación'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        open={!!detailEval}
        title="Detalle de Evaluación"
        onClose={() => setDetailEval(null)}
        size="md"
      >
        {detailEval && (() => {
          const project = projectMap.get(detailEval.dual_project_id);
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Proyecto</p>
                  <p className="font-medium text-gray-800">
                    {project ? `${project.materia}` : `#${detailEval.dual_project_id}`}
                  </p>
                  {project && <p className="text-xs text-gray-500">{project.periodo}</p>}
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Alumno ID</p>
                  <p className="font-medium text-gray-800">{detailEval.student_id}</p>
                </div>
              </div>

              <div className="space-y-3">
                <GradeBar label="Nota Empresa (70%)" value={detailEval.nota_empresa} color="bg-blue-400" />
                <GradeBar label="Nota Docente (30%)" value={detailEval.nota_docente} color="bg-purple-400" />

                <div className="border-t border-gray-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Nota Final Calculada</span>
                    {detailEval.final_grade_calculated !== null ? (
                      <span className={`text-2xl font-bold ${
                        detailEval.final_grade_calculated >= 7 ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {detailEval.final_grade_calculated}
                        <span className="text-sm font-normal text-gray-400 ml-1">/10</span>
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">Pendiente</span>
                    )}
                  </div>
                  {detailEval.final_grade_calculated !== null && (
                    <p className="text-xs text-gray-400 mt-1">
                      {detailEval.nota_empresa} × 0.7 + {detailEval.nota_docente} × 0.3
                    </p>
                  )}
                </div>
              </div>

              {detailEval.observaciones_empresa && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Obs. Empresa</p>
                  <p className="text-sm text-gray-700 bg-blue-50 rounded-lg p-3">
                    {detailEval.observaciones_empresa}
                  </p>
                </div>
              )}
              {detailEval.observaciones_docente && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Obs. Docente</p>
                  <p className="text-sm text-gray-700 bg-purple-50 rounded-lg p-3">
                    {detailEval.observaciones_docente}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                <span>Estado en Core:</span>
                <span className={`font-medium ${detailEval.sincronizado_core ? 'text-green-600' : 'text-yellow-600'}`}>
                  {detailEval.sincronizado_core ? '✓ Sincronizado' : '⏳ Pendiente'}
                </span>
              </div>
            </div>
          );
        })()}
      </Modal>
    </Layout>
  );
}
