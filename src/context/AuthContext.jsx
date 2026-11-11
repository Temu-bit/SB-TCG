import { createContext, useContext, useEffect, useState } from 'react';
import { observeAuth, logoutUser } from '../firebase/auth';
import { getUserData } from '../firebase/firestore';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = observeAuth(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const data = await getUserData(firebaseUser.uid);
          if (data?.status === 'banned') {
            alert('Dein Account wurde gesperrt.');
            await logoutUser();
            setUserData(null);
            setUser(null);
          } else {
            setUserData(data);
          }
        } catch (error) {
          console.error('Fehler beim Laden der Benutzerdaten (ggf. Firestore Rules checken):', error);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const refreshUserData = async () => {
    if (user) {
      const data = await getUserData(user.uid);
      setUserData(data);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
};
