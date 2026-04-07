import axios from 'axios';

const CORE_API_URL = import.meta.env.VITE_CORE_API_URL || 'http://localhost:8000';
const DUAL_API_URL = import.meta.env.VITE_DUAL_API_URL || 'http://localhost:8001';

export const coreApi = axios.create({ baseURL: CORE_API_URL });
export const dualApi = axios.create({ baseURL: DUAL_API_URL });

// Inject JWT token from localStorage
[coreApi, dualApi].forEach((api) => {
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
});

export async function login(email: string, password: string) {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);
  const res = await coreApi.post('/auth/token', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return res.data;
}

export const usersApi = {
  list: () => coreApi.get('/users/').then((r) => r.data),
  get: (id: number) => coreApi.get(`/users/${id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) => coreApi.post('/users/', data).then((r) => r.data),
  update: (id: number, data: Record<string, unknown>) =>
    coreApi.patch(`/users/${id}`, data).then((r) => r.data),
  delete: (id: number) => coreApi.delete(`/users/${id}`),
};

export const academicLoadApi = {
  list: () => coreApi.get('/academic-load/').then((r) => r.data),
  getByStudent: (studentId: number) =>
    coreApi.get(`/academic-load/student/${studentId}`).then((r) => r.data),
  create: (data: Record<string, unknown>) =>
    coreApi.post('/academic-load/', data).then((r) => r.data),
  update: (id: number, data: Record<string, unknown>) =>
    coreApi.patch(`/academic-load/${id}`, data).then((r) => r.data),
};

export const companiesApi = {
  list: () => dualApi.get('/companies/').then((r) => r.data),
  get: (id: number) => dualApi.get(`/companies/${id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) => dualApi.post('/companies/', data).then((r) => r.data),
  update: (id: number, data: Record<string, unknown>) =>
    dualApi.patch(`/companies/${id}`, data).then((r) => r.data),
};

export const dualProjectsApi = {
  list: () => dualApi.get('/dual-projects/').then((r) => r.data),
  get: (id: number) => dualApi.get(`/dual-projects/${id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) =>
    dualApi.post('/dual-projects/', data).then((r) => r.data),
  update: (id: number, data: Record<string, unknown>) =>
    dualApi.patch(`/dual-projects/${id}`, data).then((r) => r.data),
};

export const evaluationsApi = {
  list: () => dualApi.get('/evaluations/').then((r) => r.data),
  get: (id: number) => dualApi.get(`/evaluations/${id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) =>
    dualApi.post('/evaluations/', data).then((r) => r.data),
  update: (id: number, data: Record<string, unknown>) =>
    dualApi.patch(`/evaluations/${id}`, data).then((r) => r.data),
  syncToCore: (id: number) =>
    dualApi.post(`/evaluations/${id}/sync-core`).then((r) => r.data),
};
