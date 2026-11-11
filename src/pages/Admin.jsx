import { useState, useEffect } from 'react';
import { getAllUsers, updateUserRole, updateUserStatus } from '../firebase/firestore';
import './Admin.css';

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await getAllUsers();
      // Admins (timo410@icloud.com) immer oben
      allUsers.sort((a, b) => {
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (b.role === 'admin' && a.role !== 'admin') return 1;
        return a.displayName.localeCompare(b.displayName);
      });
      setUsers(allUsers);
    } catch (err) {
      console.error(err);
      alert('Fehler beim Laden der Benutzer.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleRole = async (user) => {
    if (user.role === 'admin') {
      alert('Haupt-Admins können nicht degradiert werden.');
      return;
    }

    const newRole = user.role === 'helper' ? 'user' : 'helper';
    const action = newRole === 'helper' ? 'befördern' : 'degradieren';

    if (!window.confirm(`Möchtest du ${user.displayName} wirklich zum ${newRole} ${action}?`)) {
      return;
    }

    setProcessingId(user.id);
    try {
      await updateUserRole(user.id, newRole);
      setUsers((prev) => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error(err);
      alert('Fehler beim Ändern der Rolle.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleStatus = async (user) => {
    if (user.role === 'admin') {
      alert('Haupt-Admins können nicht gebannt werden.');
      return;
    }

    const newStatus = user.status === 'banned' ? 'active' : 'banned';
    const action = newStatus === 'banned' ? 'bannen' : 'entbannen';

    if (!window.confirm(`Möchtest du ${user.displayName} wirklich ${action}?`)) {
      return;
    }

    setProcessingId(user.id);
    try {
      await updateUserStatus(user.id, newStatus);
      setUsers((prev) => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
    } catch (err) {
      console.error(err);
      alert('Fehler beim Ändern des Status.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        <span>Lade Admin-Panel...</span>
      </div>
    );
  }

  return (
    <div className="page admin-page">
      <div className="admin-header">
        <h1 className="page-title text-gradient-gold">👑 Admin Dashboard</h1>
        <p className="page-subtitle">Verwalte alle Benutzer und Helfer des Kartenspiels.</p>
      </div>

      <div className="admin-stats glass">
        <div className="admin-stat">
          <div className="admin-stat-val">{users.length}</div>
          <div className="admin-stat-label">Spieler</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-val">{users.filter(u => u.role === 'helper').length}</div>
          <div className="admin-stat-label">Helfer</div>
        </div>
        <div className="admin-stat" style={{ color: '#f87171' }}>
          <div className="admin-stat-val">{users.filter(u => u.status === 'banned').length}</div>
          <div className="admin-stat-label">Gebannt</div>
        </div>
      </div>

      <div className="admin-table-container glass-elevated">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Benutzer</th>
              <th>E-Mail</th>
              <th>Karten</th>
              <th>Rolle</th>
              <th>Status</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className={user.status === 'banned' ? 'banned-row' : ''}>
                <td className="user-info">
                  <div className="user-avatar">{user.displayName[0]?.toUpperCase()}</div>
                  <strong>{user.displayName}</strong>
                </td>
                <td className="text-muted">{user.email}</td>
                <td>{user.collection?.length || 0}</td>
                <td>
                  <span className={`role-badge role-${user.role}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className={`status-badge status-${user.status || 'active'}`}>
                    {user.status === 'banned' ? 'Gebannt' : 'Aktiv'}
                  </span>
                </td>
                <td>
                  {user.role !== 'admin' ? (
                    <div className="admin-actions">
                      <button 
                        className="btn btn-sm btn-ghost"
                        onClick={() => handleToggleRole(user)}
                        disabled={processingId === user.id}
                      >
                        {user.role === 'helper' ? 'Zu User machen' : 'Zu Helfer machen'}
                      </button>
                      
                      <button 
                        className={`btn btn-sm ${user.status === 'banned' ? 'btn-ghost' : 'btn-danger'}`}
                        onClick={() => handleToggleStatus(user)}
                        disabled={processingId === user.id}
                      >
                        {user.status === 'banned' ? 'Entbannen' : 'Bannen'}
                      </button>
                    </div>
                  ) : (
                    <span className="text-muted text-sm">Keine Aktionen möglich</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Admin;
