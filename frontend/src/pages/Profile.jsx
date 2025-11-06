import React, { useEffect, useState, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Link } from 'react-router-dom';

// --- Sub-components for better structure ---

const InfoRow = ({ label, value, className = '' }) => (
  <div className="profile__field">
    <span className="profile__label">{label}:</span>
    <span className={`profile__value ${className}`}>{value}</span>
  </div>
);

const CreditsDisplay = ({ plan, credits }) => {
  const isPro = ['Weekly', 'Super', 'Pro', 'Pro+'].includes(plan);
  if (isPro) {
    return <span className="status-badge unlimited">∞ Unlimited</span>;
  }
  return <span className={credits <= 0 ? 'credits-zero' : ''}>{credits}</span>;
};

const SubscriptionStatus = ({ plan, isDarkMode }) => (
  <span className={`status-badge ${plan !== 'FREE' ? 'active' : 'free'} ${isDarkMode ? 'dark' : ''}`}>
    {plan !== 'FREE' ? 'ACTIVE' : 'FREE'}
  </span>
);

const PlanBadge = ({ plan, isDarkMode }) => {
  const planClass = plan.toLowerCase().replace('+', 'plus').replace(' ', '-');
  return (
    <span className={`plan-badge ${planClass} ${isDarkMode ? 'dark' : ''}`}>
      {plan}
    </span>
  );
};

const GoProButton = () => (
  <div className="card-footer centered">
    <Link to="/pricing" className="go-pro-btn">
      Upgrade to Pro
    </Link>
  </div>
);

const CancelSubscription = ({ onCancel, loading, isDarkMode }) => {
  const [showWarning, setShowWarning] = useState(false);

  if (!showWarning) {
    return (
      <button className="cancel-btn" onClick={() => setShowWarning(true)} disabled={loading}>
        Cancel Subscription
      </button>
    );
  }

  return (
    <div className={`cancel-warning-box ${isDarkMode ? 'dark' : 'light'}`}>
      <strong>Warning:</strong> Are you sure you want to cancel? You will lose all Pro features immediately.
      <div className="warning-actions">
        <button className="confirm-btn" onClick={onCancel} disabled={loading}>
          {loading ? 'Cancelling...' : 'Confirm Cancel'}
        </button>
        <button className="keep-btn" onClick={() => setShowWarning(false)} disabled={loading}>
          Keep Subscription
        </button>
      </div>
    </div>
  );
};

// --- Main Profile Component ---

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelMsg, setCancelMsg] = useState({ text: '', type: '' });
  const [cancelLoading, setCancelLoading] = useState(false);

  const { isDarkMode } = useTheme();
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      setError('You are not logged in.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch user profile');
      }

      setUser({
        ...data.user,
        subscriptionPlan: data.user.subscriptionPlan || 'FREE',
        isProUser: data.user.isProUser || false,
        subscriptionEndDate: data.user.subscriptionEndDate ? new Date(data.user.subscriptionEndDate) : null
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCancelSubscription = async () => {
    setCancelLoading(true);
    setCancelMsg({ text: '', type: '' });
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_BASE_URL}/api/payment/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      
      if (res.ok) {
        setCancelMsg({ text: 'Subscription cancelled successfully.', type: 'success' });
        await fetchData(); 
      } else {
        throw new Error(data.message || 'Failed to cancel subscription.');
      }
    } catch (err) {
      setCancelMsg({ text: err.message, type: 'error' });
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) return <div className={`loading ${isDarkMode ? 'dark' : 'light'}`}>Loading Profile...</div>;
  
  // Not logged in state - show beautiful auth prompt
  if (error || !user) {
    return (
      <div className={`profile-auth-prompt ${isDarkMode ? 'dark' : ''}`}>
        <div className="profile-auth-prompt__container">
          <div className="profile-auth-prompt__icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="8" r="4"/>
              <path d="M20 21a8 8 0 0 0-16 0"/>
              <path d="M12 13v8"/>
            </svg>
          </div>
          <h2 className="profile-auth-prompt__title">Welcome to Your Profile</h2>
          <p className="profile-auth-prompt__description">
            Sign in to access your personalized dashboard, manage your subscription, track your credits, and unlock all the powerful tools Multi-Tool.io has to offer.
          </p>
          <div className="profile-auth-prompt__features">
            <div className="profile-auth-prompt__feature">
              <span className="feature-icon">✨</span>
              <span>Track your credits and usage</span>
            </div>
            <div className="profile-auth-prompt__feature">
              <span className="feature-icon">🚀</span>
              <span>Access premium features</span>
            </div>
            <div className="profile-auth-prompt__feature">
              <span className="feature-icon">💎</span>
              <span>Manage your subscription</span>
            </div>
            <div className="profile-auth-prompt__feature">
              <span className="feature-icon">🔒</span>
              <span>Secure account settings</span>
            </div>
          </div>
          <div className="profile-auth-prompt__actions">
            <Link to="/login" className="profile-auth-prompt__btn profile-auth-prompt__btn--primary">
              Sign In
            </Link>
            <Link to="/register" className="profile-auth-prompt__btn profile-auth-prompt__btn--secondary">
              Create Account
            </Link>
          </div>
          <p className="profile-auth-prompt__footer">
            New to Multi-Tool.io? <Link to="/pricing" className="profile-auth-prompt__link">View our plans</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile">
      <div className="profile__header">
        <h2 className="profile__title">Profile</h2>
      </div>
      <div className="profile__card">
        <h3 className="profile__section-title">Account Details</h3>
        <div className="profile__info">
          <InfoRow label="Name" value={user.name || 'N/A'} />
          <InfoRow label="Email" value={user.email || 'N/A'} />
          <InfoRow label="Mobile" value={user.mobile || 'N/A'} />
          <InfoRow label="Plan Name" value={<PlanBadge plan={user.subscriptionPlan} isDarkMode={isDarkMode} />} />
          <InfoRow label="Status" value={<SubscriptionStatus plan={user.subscriptionPlan} isDarkMode={isDarkMode} />} />
          <InfoRow label="Credits" value={<CreditsDisplay plan={user.subscriptionPlan} credits={user.credits} />} />
          {user.isProUser && user.subscriptionEndDate && (
            <InfoRow label="Valid Until" value={user.subscriptionEndDate.toLocaleDateString()} />
          )}
        </div>
        
        {user.isProUser ? (
          <div className="card-footer">
            <CancelSubscription onCancel={handleCancelSubscription} loading={cancelLoading} isDarkMode={isDarkMode} />
          </div>
        ) : (
          <GoProButton />
        )}
        
        {cancelMsg.text && (
          <div className={`status-message ${cancelMsg.type}`}>
            {cancelMsg.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
