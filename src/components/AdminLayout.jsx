import {
  Boxes,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Package,
  Tags,
  ShieldCheck,
} from 'lucide-react';
import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom';

const links = [
  ['/', 'لوحة التحكم', LayoutDashboard, true],
  ['/products', 'المنتجات', Package],
  ['/categories', 'التصنيفات', Tags],
  ['/orders', 'الطلبات', ClipboardList],
  ['/inventory', 'المخزون', Boxes],
  ['/system', 'النظام والسجلات', ShieldCheck],
];
export function AdminLayout() {
  const navigate = useNavigate();
  const logout = () => {
    localStorage.removeItem('ababil-admin-token');
    localStorage.removeItem('ababil-admin-user');
    navigate('/admin/login', { replace: true });
  };
  return (
    <div className="adminShell" dir="rtl">
      <aside className="adminSidebar">
        <img src="/logo.jpeg" alt="أبابيل" />
        <p>إدارة المتجر</p>
        <nav>
          {links.map(([to, label, Icon, end]) => (
            <NavLink key={to} to={`/admin${to}`} end={end}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <button className="adminLogout" onClick={logout}>
          <LogOut size={18} />
          تسجيل الخروج
        </button>
      </aside>
      <main className="adminMain">
        <Outlet />
      </main>
    </div>
  );
}
export function AdminGuard({ children }) {
  return localStorage.getItem('ababil-admin-token') ? (
    children
  ) : (
    <Navigate to="/admin/login" replace />
  );
}
