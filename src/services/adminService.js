import { api, imageUrl } from './api.js';

const token = () => localStorage.getItem('ababil-admin-token') || '';
const auth = () => ({ Authorization: `Bearer ${token()}` });
const query = (values = {}) => {
  const params = new URLSearchParams();
  Object.entries(values).forEach(
    ([key, value]) =>
      value !== '' && value !== undefined && params.set(key, value)
  );
  return params.size ? `?${params}` : '';
};

export const adminService = {
  login: (email, password) =>
    api('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }),
  summary: () => api('/dashboard/summary', { headers: auth() }),
  products: (filters) =>
    api(`/products/admin/all${query(filters)}`, { headers: auth() }),
  categories: () => api('/categories/admin/all', { headers: auth() }),
  orders: (filters) => api(`/orders${query(filters)}`, { headers: auth() }),
  saveProduct: (id, form) =>
    api(`/products${id ? `/${id}` : ''}`, {
      method: id ? 'PATCH' : 'POST',
      headers: auth(),
      body: form,
    }),
  deleteProduct: (id) =>
    api(`/products/${id}`, { method: 'DELETE', headers: auth() }),
  saveCategory: (id, form) =>
    api(`/categories${id ? `/${id}` : ''}`, {
      method: id ? 'PATCH' : 'POST',
      headers: auth(),
      body: form,
    }),
  deleteCategory: (id) =>
    api(`/categories/${id}`, { method: 'DELETE', headers: auth() }),
  updateOrder: (id, status) =>
    api(`/orders/${id}/status`, {
      method: 'PATCH',
      headers: { ...auth(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }),
  deleteOrder: (id) =>
    api(`/orders/${id}`, { method: 'DELETE', headers: auth() }),
  auditLogs: () => api('/system/audit-logs', { headers: auth() }),
  errors: () => api('/system/errors', { headers: auth() }),
  restockRequests: () => api('/restock-requests', { headers: auth() }),
  deleteRestockRequest: (id) =>
    api(`/restock-requests/${id}`, { method: 'DELETE', headers: auth() }),
  backup: async () => {
    const response = await fetch('/api/system/backup', { headers: auth() });
    if (!response.ok) throw new Error('تعذر إنشاء النسخة الاحتياطية.');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ababil-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  },
  image: imageUrl,
};
