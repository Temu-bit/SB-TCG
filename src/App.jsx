import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import Home from './pages/Home';
import Gallery from './pages/Gallery';
import MyCards from './pages/MyCards';
import Booster from './pages/Booster';
import Trade from './pages/Trade';
import DustShop from './pages/DustShop';
import Admin from './pages/Admin';
import CardUpload from './pages/CardUpload';
import AdminRoute from './components/Auth/AdminRoute';
import HelperRoute from './components/Auth/HelperRoute';
import './styles/index.css';

function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          {/* Öffentliche Routen */}
          <Route path="/login" element={<AuthPage />} />

          {/* Geschützte Routen */}
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/gallery" element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
          <Route path="/my-cards" element={<ProtectedRoute><MyCards /></ProtectedRoute>} />
          <Route path="/booster" element={<ProtectedRoute><Booster /></ProtectedRoute>} />
          <Route path="/trade" element={<ProtectedRoute><Trade /></ProtectedRoute>} />
          <Route path="/dust-shop" element={<ProtectedRoute><DustShop /></ProtectedRoute>} />
          {/* Admin Route */}
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          {/* Karten Workshop - Admin & Helper */}
          <Route path="/card-upload" element={<HelperRoute><CardUpload /></HelperRoute>} />
        </Routes>
      </main>
    </>
  );
}

export default App;
