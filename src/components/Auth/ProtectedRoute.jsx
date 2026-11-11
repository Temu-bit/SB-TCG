import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import LoadingScreen from '../LoadingScreen/LoadingScreen';

// Schützt Routen – leitet zu /login weiter wenn nicht eingeloggt
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Lade Santa-Blanca..." />;
  }

  return user ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
