import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import LoadingScreen from '../LoadingScreen/LoadingScreen';

const AdminRoute = ({ children }) => {
  const { user, userData, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Prüfe Berechtigungen..." />;
  }

  // Wenn nicht eingeloggt oder kein Admin, zurück zur Startseite
  if (!user || userData?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
