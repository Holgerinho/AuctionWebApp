import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import AdminPage from './pages/AdminPage'
import AuctionDetailsPage from './pages/AuctionDetailsPage'
import AuctionSearchPage from './pages/AuctionSearchPage'
import CreateAuctionPage from './pages/CreateAuctionPage'
import EditAuctionPage from './pages/EditAuctionPage'
import LoginPage from './pages/LoginPage'
import MyAuctionsPage from './pages/MyAuctionsPage'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/RegisterPage'
import './App.css'

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/auctions" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auctions" element={<AuctionSearchPage />} />
          <Route path="/auctions/:id" element={<AuctionDetailsPage />} />
          <Route
            path="/auctions/:id/edit"
            element={
              <ProtectedRoute>
                <EditAuctionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/auctions/create"
            element={
              <ProtectedRoute>
                <CreateAuctionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-auctions"
            element={
              <ProtectedRoute>
                <MyAuctionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  )
}

export default App
