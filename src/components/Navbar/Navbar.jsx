import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { logoutUser } from '../../firebase/auth';
import logo from '../../assets/logo.png';
import './Navbar.css';

const NAV_LINKS = [
  { to: '/',           label: '🏠 Home'        },
  { to: '/gallery',    label: '📖 Galerie'     },
  { to: '/my-cards',   label: '🃏 Meine Karten' },
  { to: '/booster',    label: '✨ Booster'     },
  { to: '/trade',      label: '🔄 Tauschen'   },
  { to: '/dust-shop',  label: '🌟 Staub-Shop'  },
];

const Navbar = () => {
  const { user, userData } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    await logoutUser();
  };

  return (
    <nav className="navbar">
      <div className="navbar__inner">
        {/* Logo */}
        <Link to="/" className="navbar__logo">
          <img src={logo} alt="Santa-Blanca Logo" className="navbar__logo-icon" />
          <span className="navbar__logo-text">
            <span className="text-gradient">Santa-Blanca</span>
            <span className="navbar__logo-sub">TCG</span>
          </span>
        </Link>

        {/* Navigation Links */}
        {user && (
          <ul className="navbar__links">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={`navbar__link ${location.pathname === link.to ? 'active' : ''}`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* User Area */}
        <div className="navbar__user">
          {user ? (
            <>
              {userData?.role === 'admin' && (
                <Link to="/admin" className="btn btn-gold btn-sm" style={{ padding: '4px 10px', fontSize: '0.75rem', marginRight: 'var(--space-sm)' }}>
                  👑 Admin
                </Link>
              )}
              {(userData?.role === 'admin' || userData?.role === 'helper') && (
                <Link to="/card-upload" className="btn btn-accent btn-sm" style={{ padding: '4px 10px', fontSize: '0.75rem', marginRight: 'var(--space-sm)' }}>
                  🛠️ Workshop
                </Link>
              )}
              {userData && (
                <div className="navbar__credits">
                  <span title="Booster Credits">✨ {userData.boosterCredits ?? 0}</span>
                </div>
              )}
              <div className="navbar__avatar">
                {user.displayName?.[0]?.toUpperCase() || '?'}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
