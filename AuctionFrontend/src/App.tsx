import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import AdminPage from './pages/AdminPage'
import AuctionDetailsPage from './pages/AuctionDetailsPage'
import AuctionSearchPage from './pages/AuctionSearchPage'
import CreateAuctionPage from './pages/CreateAuctionPage'
import HomePage from './pages/HomePage'
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
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auctions" element={<AuctionSearchPage />} />
          <Route path="/auctions/:id" element={<AuctionDetailsPage />} />
          <Route path="/auctions/create" element={<CreateAuctionPage />} />
          <Route path="/my-auctions" element={<MyAuctionsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
