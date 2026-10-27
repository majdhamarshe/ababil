import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Menu, ShoppingCart, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';
import { InstagramIcon, WhatsAppIcon } from './SocialIcons.jsx';
const navigation = [
  { to: '/', label: 'الرئيسية', end: true },
  { to: '/products', label: 'المنتجات' },
  { to: '/about', label: 'من نحن' },
  { to: '/contact', label: 'اتصل بنا' },
];
export function Layout() {
  const { cart, favorites } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const close = () => setMenuOpen(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);
  return (
    <div className="appShell">
      <header className="siteHeader">
        <NavLink
          className="brand"
          to="/"
          onClick={close}
          aria-label="أبابيل - الرئيسية"
        >
          <img src="/logo.jpeg" alt="شعار متجر أبابيل" />
        </NavLink>
        <nav className={menuOpen ? 'open' : ''} aria-label="التنقل الرئيسي">
          {navigation.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={close}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="headerActions">
          <NavLink className="iconButton" to="/favorites" aria-label="المفضلة">
            <Heart size={19} /> <span>{favorites.length}</span>
          </NavLink>
          <NavLink className="iconButton" to="/cart" aria-label="سلة التسوق">
            <ShoppingCart size={19} /> <span>{cartCount}</span>
          </NavLink>
          <button
            className="menuButton"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="فتح القائمة"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>
      <main className="pageViewport">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            className="pageTransition"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="siteFooter">
        <div>
          <img src="/logo.jpeg" alt="شعار أبابيل" />
          <p>متجر أبابيل للمنتجات الإسلامية المختارة بعناية.</p>
        </div>
        <div>
          <h3>روابط سريعة</h3>
          <NavLink to="/products">المنتجات</NavLink>
          <NavLink to="/about">من نحن</NavLink>
          <NavLink to="/contact">اتصل بنا</NavLink>
          <NavLink to="/privacy">سياسة الخصوصية</NavLink>
          <NavLink to="/terms">شروط الاستخدام</NavLink>
        </div>
        <div>
          <h3>خدمة العملاء</h3>
          <p>نسعد بخدمتك والإجابة عن استفساراتك.</p>
          <div
            className="contactSocialLinks footerSocialLinks"
            aria-label="قنوات خدمة العملاء"
          >
            <a
              href="https://wa.me/972569980699"
              target="_blank"
              rel="noreferrer"
              aria-label="التواصل عبر واتساب"
              title="واتساب"
            >
              <WhatsAppIcon aria-hidden="true" />
            </a>
            <a
              href="https://www.instagram.com/alfajer_ps?xtok=YmpiM2d2Nmx2cmgy&utm_source=qr"
              target="_blank"
              rel="noreferrer"
              aria-label="زيارة إنستغرام"
              title="إنستغرام"
            >
              <InstagramIcon aria-hidden="true" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
