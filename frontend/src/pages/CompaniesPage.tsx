import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import { useToast } from '../components/Toast';
import { companiesApi } from '../services/api';
import type { Company } from '../types';

interface CompanyForm {
  nombre: string;
  rfc: string;
  direccion: string;
  sector: string;
  contacto_nombre: string;
  contacto_email: string;
  contacto_telefono: string;
  is_active: boolean;
}

const emptyForm: CompanyForm = {
  nombre: '',
  rfc: '',
  direccion: '',
  sector: '',
  contacto_nombre: '',
  contacto_email: '',
  contacto_telefono: '',
  is_active: true,
};

export default function CompaniesPage() {
  const showToast = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const [form, setForm] = useState<CompanyForm>(emptyForm);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setCompanies(await companiesApi.list());
    } catch {
      showToast('Error al cargar empresas', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditCompany(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (c: Company) => {
    setEditCompany(c);
    setForm({
      nombre: c.nombre,
      rfc: c.rfc,
      direccion: c.direccion ?? '',
      sector: c.sector ?? '',
      contacto_nombre: c.contacto_nombre ?? '',
      contacto_email: c.contacto_email ?? '',
      contacto_telefono: c.contacto_telefono ?? '',
      is_active: c.is_active,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        nombre: form.nombre,
        rfc: form.rfc,
        direccion: form.direccion || null,
        sector: form.sector || null,
        contacto_nombre: form.contacto_nombre || null,
        contacto_email: form.contacto_email || null,
        contacto_telefono: form.contacto_telefono || null,
        is_active: form.is_active,
      };
      if (editCompany) {
        await companiesApi.update(editCompany.id, payload);
        showToast('Empresa actualizada', 'success');
      } else {
        await companiesApi.create(payload);
        showToast('Empresa creada', 'success');
      }
      setModalOpen(false);
      load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Error al guardar empresa';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const filtered = companies.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.nombre.toLowerCase().includes(q) ||
      c.rfc.toLowerCase().includes(q) ||
      (c.sector ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <Layout title="Empresas Aliadas">
      <div className="flex items-center justify-between mb-5">
        <input
          type="text"
          placeholder="Buscar por nombre, RFC o sector..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          onClick={openCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Nueva Empresa
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-3 py-16 text-center text-gray-400">
              No se encontraron empresas
            </div>
          ) : (
            filtered.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-xl shadow p-5 flex flex-col gap-2 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate">{c.nombre}</h3>
                    <p className="text-xs text-gray-400 font-mono">RFC: {c.rfc}</p>
                  </div>
                  <span
                    className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                      c.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {c.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </div>

                {c.sector && (
                  <p className="text-xs text-indigo-600 font-medium">📂 {c.sector}</p>
                )}
                {c.direccion && (
                  <p className="text-xs text-gray-500">📍 {c.direccion}</p>
                )}
                {c.contacto_nombre && (
                  <div className="border-t border-gray-100 pt-2 mt-1">
                    <p className="text-xs text-gray-600 font-medium">👤 {c.contacto_nombre}</p>
                    {c.contacto_email && (
                      <p className="text-xs text-gray-400">{c.contacto_email}</p>
                    )}
                    {c.contacto_telefono && (
                      <p className="text-xs text-gray-400">📞 {c.contacto_telefono}</p>
                    )}
                  </div>
                )}

                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => openEdit(c)}
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
        title={editCompany ? 'Editar Empresa' : 'Nueva Empresa'}
        onClose={() => setModalOpen(false)}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                className="input-field"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RFC *</label>
              <input
                className="input-field font-mono"
                value={form.rfc}
                onChange={(e) => setForm({ ...form, rfc: e.target.value.toUpperCase() })}
                required
                disabled={!!editCompany}
                placeholder="ABC123456DEF"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
              <input
                className="input-field"
                value={form.sector}
                onChange={(e) => setForm({ ...form, sector: e.target.value })}
                placeholder="Ej: Tecnología"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input
                className="input-field"
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              />
            </div>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Datos de contacto</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  className="input-field"
                  value={form.contacto_nombre}
                  onChange={(e) => setForm({ ...form, contacto_nombre: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="input-field"
                  value={form.contacto_email}
                  onChange={(e) => setForm({ ...form, contacto_email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  className="input-field"
                  value={form.contacto_telefono}
                  onChange={(e) => setForm({ ...form, contacto_telefono: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="rounded text-indigo-600"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Empresa activa
            </label>
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
              {saving ? 'Guardando...' : editCompany ? 'Actualizar' : 'Crear Empresa'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
