import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import AuthForm from '../components/Auth/AuthForm';

const AuthPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);

  // Wenn bereits eingeloggt (und nicht gerade mitten in der Registrierung), direkt zur Startseite
  if (!loading && user && !isRegistering) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="auth-page-container">
      {/* Animierter Hintergrund für den Epic Look */}
      <div className="auth-bg-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>
      
      <div className="auth-content-wrapper">
        <AuthForm 
          onSuccess={() => navigate('/')} 
          onRegisterStart={() => setIsRegistering(true)}
        />
      </div>
    </div>
  );
};

export default AuthPage;
