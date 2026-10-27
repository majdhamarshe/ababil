import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/adminService.js';
export function AdminLogin() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(e.currentTarget);
    try {
      const result = await adminService.login(
        form.get('email'),
        form.get('password')
      );
      localStorage.setItem('ababil-admin-token', result.token);
      localStorage.setItem('ababil-admin-user', JSON.stringify(result.user));
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="adminLogin" dir="rtl">
      <form onSubmit={submit}>
        <img src="/logo.jpeg" alt="أبابيل" />
        <p>دخول صاحب المتجر</p>
        <h1>لوحة تحكم أبابيل</h1>
        {error && <div className="adminAlert error">{error}</div>}
        <label>
          البريد الإلكتروني
          <input required type="email" name="email" autoComplete="username" />
        </label>
        <label>
          كلمة المرور
          <input
            required
            type="password"
            name="password"
            minLength="8"
            autoComplete="current-password"
          />
        </label>
        <button className="adminPrimary" disabled={busy}>
          {busy ? 'جاري الدخول…' : 'تسجيل الدخول'}
        </button>
      </form>
    </main>
  );
}
