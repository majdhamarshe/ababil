import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout.jsx';
import {
  AboutPage,
  ContactPage,
  NotFoundPage,
  PrivacyPage,
  TermsPage,
} from './pages/InfoPages.jsx';
import { CartPage } from './pages/CartPage.jsx';
import { CategoryPage } from './pages/CategoryPage.jsx';
import { CheckoutPage } from './pages/CheckoutPage.jsx';
import { FavoritesPage } from './pages/FavoritesPage.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { ProductPage } from './pages/ProductPage.jsx';
import { ProductsPage } from './pages/ProductsPage.jsx';
import { AdminLayout, AdminGuard } from './components/AdminLayout.jsx';
import { AdminLogin } from './pages/AdminLogin.jsx';
import { AdminSystemPage } from './pages/AdminSystemPage.jsx';
import {
  AdminCategoriesPage,
  AdminDashboardPage,
  AdminOrdersPage,
  AdminProductsPage,
} from './pages/AdminPages.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="admin/login" element={<AdminLogin />} />
      <Route
        path="admin"
        element={
          <AdminGuard>
            <AdminLayout />
          </AdminGuard>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="inventory" element={<AdminProductsPage inventoryOnly />} />
        <Route path="system" element={<AdminSystemPage />} />
      </Route>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="category/:slug" element={<CategoryPage />} />
        <Route path="product/:slug" element={<ProductPage />} />
        <Route path="favorites" element={<FavoritesPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
