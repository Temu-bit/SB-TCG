import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import LoadingScreen from '../LoadingScreen/LoadingScreen';

// Erlaubt Zugriff für Admin UND Helper
const HelperRoute = ({ children }) => {
  const { user, userData, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Prüfe Berechtigungen..." />;
  }

  const allowed = user && (userData?.role === 'admin' || userData?.role === 'helper');
  return allowed ? children : <Navigate to="/" replace />;
};

export default HelperRoute;
