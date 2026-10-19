import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import RequireAuth from './auth/RequireAuth'
import { ThemeProvider, ToastProvider } from './context'
import AppLayout from './layouts/AppLayout'
import PublicLayout from './layouts/PublicLayout'
import AuthPage from './pages/AuthPage'
import PasswordResetPage from './pages/PasswordResetPage'
import AdminUsersPage from './pages/AdminUsersPage'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import DashboardPage from './pages/DashboardPage'
import ActivityPage from './pages/ActivityPage'
import ProfilePage from './pages/ProfilePage'
import NotFoundPage from './pages/NotFoundPage'
import { CategoriesPage, ClothingDetailPage, OutfitsPage, WardrobePage } from './pages/WorkspacePages'

function LegacyClothingDetailRedirect() {
  const { id } = useParams()
  return <Navigate to={`/app/wardrobe/${id}`} replace />
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<PublicLayout />}>
                <Route index element={<HomePage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="login" element={<AuthPage mode="login" />} />
                <Route path="register" element={<AuthPage mode="register" />} />
                <Route path="forgot-password" element={<PasswordResetPage mode="request" />} />
                <Route path="reset-password" element={<PasswordResetPage mode="reset" />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
              <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
              <Route path="/wardrobe" element={<Navigate to="/app/wardrobe" replace />} />
              <Route path="/wardrobe/:id" element={<LegacyClothingDetailRedirect />} />
              <Route path="/categories" element={<Navigate to="/app/categories" replace />} />
              <Route path="/outfits" element={<Navigate to="/app/outfits" replace />} />
              <Route element={<RequireAuth />}>
                <Route path="/app" element={<AppLayout />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="wardrobe" element={<WardrobePage />} />
                  <Route path="wardrobe/:id" element={<ClothingDetailPage />} />
                  <Route path="categories" element={<CategoriesPage />} />
                  <Route path="outfits" element={<OutfitsPage />} />
                  <Route path="planner" element={<Navigate to="/app/planner/wear" replace />} />
                  <Route path="planner/wear" element={<ActivityPage view="wear" />} />
                  <Route path="planner/plan" element={<ActivityPage view="plan" />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="admin/users" element={<AdminUsersPage />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
