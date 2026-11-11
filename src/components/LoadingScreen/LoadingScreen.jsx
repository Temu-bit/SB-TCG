import logo from '../../assets/logo.png';
import './LoadingScreen.css';

const LoadingScreen = ({ message = "Lade Santa-Blanca..." }) => {
  return (
    <div className="loading-screen">
      <div className="loading-screen__content">
        <div className="loading-screen__logo-container">
          <div className="loading-screen__glow"></div>
          <img src={logo} alt="Santa-Blanca Logo" className="loading-screen__logo" />
        </div>
        <h2 className="loading-screen__title text-gradient">Santa-Blanca TCG</h2>
        
        <div className="loading-screen__bar-container">
          <div className="loading-screen__bar"></div>
        </div>
        
        <p className="loading-screen__message">{message}</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
