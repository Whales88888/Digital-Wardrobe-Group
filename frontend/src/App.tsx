import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import PublicLayout from './layouts/PublicLayout'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import DashboardPage from './pages/DashboardPage'
import { CategoriesPage, ClothingDetailPage, OutfitsPage, WardrobePage } from './pages/WorkspacePages'

function LegacyClothingDetailRedirect() {
  const { id } = useParams()
  return <Navigate to={`/app/wardrobe/${id}`} replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
        </Route>
        <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/wardrobe" element={<Navigate to="/app/wardrobe" replace />} />
        <Route path="/wardrobe/:id" element={<LegacyClothingDetailRedirect />} />
        <Route path="/categories" element={<Navigate to="/app/categories" replace />} />
        <Route path="/outfits" element={<Navigate to="/app/outfits" replace />} />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="wardrobe" element={<WardrobePage />} />
          <Route path="wardrobe/:id" element={<ClothingDetailPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="outfits" element={<OutfitsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
