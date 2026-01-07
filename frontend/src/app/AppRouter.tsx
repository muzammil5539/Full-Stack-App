import { BrowserRouter, Route, Routes } from 'react-router-dom'
import RootLayout from '../layouts/RootLayout'
import CartPage from '../pages/CartPage'
import CheckoutPage from '../pages/CheckoutPage'
import HomePage from '../pages/HomePage'
import NotificationsPage from '../pages/NotificationsPage'
import NotFoundPage from '../pages/NotFoundPage'
import OrderDetailPage from '../pages/OrderDetailPage'
import OrdersPage from '../pages/OrdersPage'
import PaymentsPage from '../pages/PaymentsPage'
import ProductDetailPage from '../pages/ProductDetailPage'
import ProductsPage from '../pages/ProductsPage'
import WishlistPage from '../pages/WishlistPage'
import AccountPage from '../pages/account/AccountPage'
import LoginPage from '../pages/account/LoginPage'
import RegisterPage from '../pages/account/RegisterPage'
import SettingsPage from '../pages/account/SettingsPage'
import AdminPage from '../pages/admin/AdminPage'
import AdminModelAddPage from '../pages/admin/AdminModelAddPage'
import AdminModelChangeListPage from '../pages/admin/AdminModelChangeListPage'
import AdminModelEditPage from '../pages/admin/AdminModelEditPage'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:slug" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="admin/:app/:model/add/*" element={<AdminModelAddPage />} />
          <Route path="admin/:app/:model/:id/change/*" element={<AdminModelEditPage />} />
          <Route path="admin/:app/:model/*" element={<AdminModelChangeListPage />} />
          <Route path="account" element={<AccountPage />} />
          <Route path="account/settings" element={<SettingsPage />} />
          <Route path="account/login" element={<LoginPage />} />
          <Route path="account/register" element={<RegisterPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
