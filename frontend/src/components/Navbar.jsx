import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import { assets } from '../assets/assets';
import PaymentModal from './PaymentModal';

const COST_PER_GENERATION = 50; // Sync with backend


const Navbar = () => {
  const [user, setUser] = useState(null);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isProUser, setIsProUser] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  
  const [notification, setNotification] = useState({ message: '', type: '' });

  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const fetchUserStatus = async (token) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/payment/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCredits(data.credits);
        setIsProUser(data.isPro);
        setSubscriptionEnd(data.subscriptionEnd);
      }
    } catch (error) {
      console.error('Failed to fetch user status', error);
    }
  };

  useEffect(() => {
    const checkUserAuth = () => {
      const token = localStorage.getItem('token');
      const userInfo = localStorage.getItem('user');
      
      if (token && userInfo) {
        setUser(JSON.parse(userInfo));
        fetchUserStatus(token);
      } else {
        setUser(null);
        setCredits(0);
        setIsProUser(false);
      }
      setLoading(false);
    };

    checkUserAuth();

    const handleAuthChange = () => checkUserAuth();
    window.addEventListener('authChange', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification({ message: '', type: '' });
    }, 3000);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.dispatchEvent(new Event('authChange'));
    navigate('/');
  };

  const handlePaymentSuccess = (data) => {
    if (data) {
      setIsProUser(data.isPro);
      setCredits(data.credits);
      setSubscriptionEnd(data.subscriptionEnd);
    } else {
      const token = localStorage.getItem('token');
      if (token) {
        fetchUserStatus(token);
      }
    }
  };
  
  const handleConversionSuccess = () => {
    if (user && !isProUser) {
      setCredits(prev => Math.max(0, prev - COST_PER_GENERATION));
    }
  };

  // The loading state is simplified as the main nav now renders immediately
  return (
    <>
      <nav className="nav">
        <div className="nav__brand" onClick={scrollToTop}>
          <img 
            src={isDarkMode ? assets.logo_dark : assets.logo} 
            alt="Logo" 
            className="nav__logo"
          />
          <div className="nav__brand-text">
            <span>mulitool.io</span>
          </div>
        </div>

        <div className="nav__center">
          <ul className="nav__links">
            <li className="nav__link"><Link to="/" onClick={scrollToTop}>Home</Link></li>
            {user && (
              <li className="nav__wallet">
                <img src={assets.wallet} alt="Wallet" className="nav__wallet-icon" />
                {isProUser ? (
                  <div className="nav__pro">
                    <span>PRO</span>
                    <span className="nav__pro-infinity">∞</span>
                  </div>
                ) : (
                  <span>{credits} Points</span>
                )}
              </li>
            )}
            {user && (
              <li className="nav__user">
                <span>Hi, {user.name}</span>
              </li>
            )}
            <li><ThemeToggle /></li>
          </ul>
        </div>
        <div className="nav__actions">
          <button
            className={`nav__hamburger-btn${menuOpen ? ' nav__hamburger-btn--open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span className="nav__hamburger-line"></span>
            <span className="nav__hamburger-line"></span>
            <span className="nav__hamburger-line"></span>
          </button>
        </div>
        <div className={`nav__dropdown-overlay ${menuOpen ? 'nav__dropdown-overlay--open' : ''}`}>
          <div className="nav__dropdown">
            <Link to="/profile" onClick={() => setMenuOpen(false)}>Profile</Link>
            <Link to="/pricing" onClick={() => setMenuOpen(false)}>Pricing</Link>
            {user ? (
              <button className="nav__logout" onClick={() => { handleLogout(); setMenuOpen(false); }}>Logout</button>
            ) : (
              <>
                <Link to="/login" className="nav__login" onClick={() => setMenuOpen(false)}>Login / Register</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  );
};

export default Navbar;
