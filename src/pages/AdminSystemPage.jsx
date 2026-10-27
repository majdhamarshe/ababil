import { Download, RefreshCw, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { adminService } from '../services/adminService.js';

export function AdminSystemPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const load = () => {
    setError('');
    Promise.all([
      adminService.auditLogs(),
      adminService.errors(),
      adminService.restockRequests(),
    ])
      .then(([audit, errors, restock]) =>
        setData({
          audit: audit.data,
          errors: errors.data,
          restock: restock.data,
        })
      )
      .catch((e) => setError(e.message));
  };
  useEffect(load, []);
  const backup = async () => {
    try {
      await adminService.backup();
      setNotice('تم تنزيل النسخة الاحتياطية.');
    } catch (e) {
      setNotice(e.message);
    }
  };
  const removeRestock = async (item) => {
    if (!window.confirm('حذف طلب التنبيه هذا؟')) return;
    try {
      await adminService.deleteRestockRequest(item._id);
      setNotice('تم حذف طلب التنبيه.');
      load();
    } catch (e) {
      setNotice(e.message);
    }
  };
  if (!data && !error)
    return (
      <section className="adminPage">
        <p>جاري التحميل…</p>
      </section>
    );
  return (
    <section className="adminPage">
      <header className="adminHeading">
        <div>
          <p>حماية ومتابعة المتجر</p>
          <h1>النظام والسجلات</h1>
        </div>
        <div className="systemActions">
          <button className="adminPrimary" onClick={backup}>
            <Download size={17} />
            نسخة احتياطية
          </button>
          <button onClick={load}>
            <RefreshCw size={17} />
            تحديث
          </button>
        </div>
      </header>
      {notice && <p className="adminAlert success">{notice}</p>}
      {error && <p className="adminAlert error">{error}</p>}
      <div className="adminTwoCol">
        <section className="adminCard">
          <h2>طلبات عودة المخزون ({data?.restock.length || 0})</h2>
          {data?.restock.length ? (
            data.restock.map((item) => (
              <div className="systemRow" key={item._id}>
                <b>{item.product?.name || 'منتج محذوف'}</b>
                <span>
                  {item.phone} ·{' '}
                  {[item.color, item.size].filter(Boolean).join(' / ') ||
                    'أي خيار'}
                </span>
                <small>
                  {item.status === 'waiting'
                    ? 'بانتظار عودة المخزون'
                    : item.status}
                </small>
                <button
                  className="systemDelete"
                  onClick={() => removeRestock(item)}
                >
                  حذف
                </button>
              </div>
            ))
          ) : (
            <p>لا توجد طلبات تنبيه.</p>
          )}
        </section>
        <section className="adminCard">
          <h2>أخطاء الخادم الأخيرة ({data?.errors.length || 0})</h2>
          {data?.errors.length ? (
            data.errors.map((item) => (
              <p className="systemRow" key={item._id}>
                <b>{item.message}</b>
                <span>
                  {item.method} {item.path}
                </span>
                <small>
                  {new Date(item.createdAt).toLocaleString('en-GB')}
                </small>
              </p>
            ))
          ) : (
            <p>لا توجد أخطاء مسجلة.</p>
          )}
        </section>
      </div>
      <section className="adminCard">
        <h2>
          <ShieldCheck size={18} /> سجل عمليات الإدارة
        </h2>
        {data?.audit.length ? (
          <div className="adminTableWrap">
            <table className="adminTable">
              <thead>
                <tr>
                  <th>الوقت</th>
                  <th>المستخدم</th>
                  <th>العملية</th>
                  <th>النوع</th>
                </tr>
              </thead>
              <tbody>
                {data.audit.map((item) => (
                  <tr key={item._id}>
                    <td>{new Date(item.createdAt).toLocaleString('en-GB')}</td>
                    <td>{item.actor}</td>
                    <td>{item.action}</td>
                    <td>{item.entityType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>لا توجد عمليات مسجلة بعد.</p>
        )}
      </section>
    </section>
  );
}
