import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import './Home.css';

const QUICK_ACTIONS = [
  {
    to: '/booster',
    icon: '✨',
    title: 'Booster öffnen',
    desc: 'Ziehe 5 zufällige Karten',
    color: 'gold',
  },
  {
    to: '/gallery',
    icon: '📖',
    title: 'Galerie',
    desc: 'Alle Karten entdecken',
    color: 'blue',
  },
  {
    to: '/trade',
    icon: '🔄',
    title: 'Tauschen',
    desc: 'Karten handeln',
    color: 'purple',
  },
  {
    to: '/my-cards',
    icon: '🃏',
    title: 'Meine Karten',
    desc: 'Deine Sammlung',
    color: 'orange',
  },
];

const CARD_COLOR = {
  gold:   'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,170,0,0.1))',
  blue:   'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(96,165,250,0.1))',
  purple: 'linear-gradient(135deg, rgba(180,79,255,0.15), rgba(180,79,255,0.05))',
  orange: 'linear-gradient(135deg, rgba(255,107,53,0.15), rgba(255,107,53,0.05))',
};

const CARD_BORDER = {
  gold:   'rgba(255,215,0,0.3)',
  blue:   'rgba(0,212,255,0.3)',
  purple: 'rgba(180,79,255,0.3)',
  orange: 'rgba(255,107,53,0.3)',
};

const Home = () => {
  const { user, userData } = useAuth();
  const collectionCount = userData?.collection?.length ?? 0;
  const boosterCredits = userData?.boosterCredits ?? 0;

  return (
    <div className="page">
      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero__badge">🃏 Santa-Blanca Trading Card Game</div>
        <h1 className="home-hero__title">
          Willkommen zurück,{' '}
          <span className="text-gradient">
            {user?.displayName || 'Trainer'}
          </span>
          !
        </h1>
        <p className="home-hero__subtitle">
          Sammle, tausche und entdecke seltene Santa-Blanca-Karten.
        </p>

        {/* Stats */}
        <div className="home-stats">
          <div className="home-stat glass">
            <span className="home-stat__value">{collectionCount}</span>
            <span className="home-stat__label">Karten gesammelt</span>
          </div>
          <div className="home-stat glass">
            <span className="home-stat__value" style={{ color: 'var(--color-secondary)' }}>
              {boosterCredits}
            </span>
            <span className="home-stat__label">Booster-Packs</span>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="home-actions">
        <h2 className="home-section-title">Was möchtest du tun?</h2>
        <div className="home-actions__grid">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="home-action-card"
              style={{
                background: CARD_COLOR[action.color],
                borderColor: CARD_BORDER[action.color],
              }}
            >
              <div className="home-action-card__icon">{action.icon}</div>
              <div className="home-action-card__title">{action.title}</div>
              <div className="home-action-card__desc">{action.desc}</div>
              <div className="home-action-card__arrow">→</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Call to Action wenn keine Credits */}
      {boosterCredits === 0 && (
        <section className="home-cta glass">
          <div className="home-cta__icon">😢</div>
          <div>
            <h3>Keine Booster-Packs mehr</h3>
            <p>Tausche Karten mit anderen Spielern um neue zu bekommen!</p>
          </div>
          <Link to="/trade" className="btn btn-accent btn-lg">
            Zum Tauschmarkt →
          </Link>
        </section>
      )}

      {boosterCredits > 0 && (
        <section className="home-cta home-cta--gold glass">
          <div className="home-cta__icon animate-float">🎁</div>
          <div>
            <h3>Du hast {boosterCredits} Booster-Pack{boosterCredits > 1 ? 's' : ''}!</h3>
            <p>Öffne sie jetzt und entdecke seltene Karten.</p>
          </div>
          <Link to="/booster" className="btn btn-gold btn-lg">
            ✨ Pack öffnen!
          </Link>
        </section>
      )}
    </div>
  );
};

export default Home;
