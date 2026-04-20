import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import { useToast } from '../components/Toast';
import { academicLoadApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { AcademicLoad } from '../types';

interface LoadForm {
  student_id: string;
  docente_id: string;
  materia: string;
  periodo: string;
  calificacion_final: string;
}

const emptyForm: LoadForm = {
  student_id: '',
  docente_id: '',
  materia: '',
  periodo: '',
  calificacion_final: '',
};

export default function AcademicLoadPage() {
  const showToast = useToast();
  const { role, userId } = useAuth();
  const [loads, setLoads] = useState<AcademicLoad[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editLoad, setEditLoad] = useState<AcademicLoad | null>(null);
  const [form, setForm] = useState<LoadForm>(emptyForm);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      let data: AcademicLoad[];
      if (role === 'ALUMNO' && userId) {
        data = await academicLoadApi.getByStudent(userId);
      } else {
        data = await academicLoadApi.list();
      }
      setLoads(data);
    } catch {
      showToast('Error al cargar el kardex', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditLoad(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (l: AcademicLoad) => {
    setEditLoad(l);
    setForm({
      student_id: String(l.student_id),
      docente_id: String(l.docente_id),
      materia: l.materia,
      periodo: l.periodo,
      calificacion_final: l.calificacion_final !== null ? String(l.calificacion_final) : '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        materia: form.materia,
        periodo: form.periodo,
        calificacion_final: form.calificacion_final !== '' ? parseFloat(form.calificacion_final) : null,
      };
      if (!editLoad) {
        payload.student_id = parseInt(form.student_id);
        payload.docente_id = parseInt(form.docente_id);
      } else {
        if (form.docente_id) payload.docente_id = parseInt(form.docente_id);
      }

      if (editLoad) {
        await academicLoadApi.update(editLoad.id, payload);
        showToast('Carga académica actualizada', 'success');
      } else {
        await academicLoadApi.create(payload);
        showToast('Carga académica creada', 'success');
      }
      setModalOpen(false);
      load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Error al guardar';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const canCreate = role === 'ADMINISTRADOR' || role === 'DOCENTE';

  const filtered = loads.filter((l) => {
    const q = search.toLowerCase();
    return !q || l.materia.toLowerCase().includes(q) || l.periodo.toLowerCase().includes(q);
  });

  return (
    <Layout title="Carga Académica (Kardex)">
      <div className="flex items-center justify-between mb-5">
        <input
          type="text"
          placeholder="Buscar por materia o periodo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        {canCreate && (
          <button
            onClick={openCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            + Agregar Registro
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Materia</th>
                <th className="px-4 py-3 text-left">Periodo</th>
                <th className="px-4 py-3 text-left">Alumno ID</th>
                <th className="px-4 py-3 text-left">Docente ID</th>
                <th className="px-4 py-3 text-left">Calificación Final</th>
                {canCreate && <th className="px-4 py-3 text-left">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                    No hay registros de carga académica
                  </td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-500">{l.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{l.materia}</td>
                    <td className="px-4 py-3 text-gray-600">{l.periodo}</td>
                    <td className="px-4 py-3 text-gray-500">{l.student_id}</td>
                    <td className="px-4 py-3 text-gray-500">{l.docente_id}</td>
                    <td className="px-4 py-3">
                      {l.calificacion_final !== null ? (
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          l.calificacion_final >= 7
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {l.calificacion_final}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Pendiente</span>
                      )}
                    </td>
                    {canCreate && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openEdit(l)}
                          className="text-indigo-600 hover:text-indigo-800 text-xs font-medium transition"
                        >
                          Editar
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editLoad ? 'Editar Carga Académica' : 'Nueva Carga Académica'}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editLoad && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID del Alumno
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID del Docente
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={form.docente_id}
                  onChange={(e) => setForm({ ...form, docente_id: e.target.value })}
                  required
                  min="1"
                />
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Materia</label>
            <input
              className="input-field"
              value={form.materia}
              onChange={(e) => setForm({ ...form, materia: e.target.value })}
              required
              placeholder="Ej: Programación Avanzada"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Periodo</label>
            <input
              className="input-field"
              value={form.periodo}
              onChange={(e) => setForm({ ...form, periodo: e.target.value })}
              required
              placeholder="Ej: 2024-A"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Calificación Final
              <span className="text-gray-400 font-normal ml-1">(0–10, opcional)</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              className="input-field"
              value={form.calificacion_final}
              onChange={(e) => setForm({ ...form, calificacion_final: e.target.value })}
              placeholder="Dejar vacío si está pendiente"
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
              {saving ? 'Guardando...' : editLoad ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
