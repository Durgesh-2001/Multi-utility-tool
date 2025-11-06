import React, { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [currState, setCurrState] = useState({
    name: '',
    email: '',
    password: '',
    mobile: ''
  });
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setFormVisible(true), 50);
  }, []);

  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setCurrState(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  // Registration handler
  const onSubmit = async (e) => {
    e.preventDefault();
    if (!currState.name || !currState.email || !currState.password) {
      setError('Please fill all required fields');
      return;
    }
    // Validate Indian mobile number
    if (currState.mobile) {
      const indianMobileRegex = /^[6-9]\d{9}$/;
      if (!indianMobileRegex.test(currState.mobile)) {
        setError('Please enter a valid 10-digit Indian mobile number (starts with 6-9)');
        return;
      }
    }
    try {
      const BASE_URL = import.meta.env.VITE_BACKEND_URL;
      const response = await axios.post(`${BASE_URL}/api/auth/register`, currState);
      if (response.data.success) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          navigate('/login');
        }, 1500);
      } else {
        setError(response.data.message || 'An error occurred');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during registration');
    }
  };

  // Google login handler
  const handleGoogleLogin = async (credentialResponse) => {
    try {
      // Validate credential exists
      if (!credentialResponse?.credential) {
        console.error('Missing credential in response:', credentialResponse);
        setError('No Google credentials received. Please try again.');
        return;
      }
      
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/google`, {
        credential: credentialResponse.credential
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success && response.data.token) {
        // Store auth data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Update UI and navigate
        window.dispatchEvent(new Event('authChange'));
        setCurrState({ name: '', email: '', password: '', mobile: '' });
        navigate('/');
      } else {
        console.warn('Successful response but missing token:', response.data);
        setError(response.data.message || 'Google authentication failed. Please try again.');
      }
    } catch (err) {
      console.error('Full error object:', err);

      // Detailed error handling
      if (err.response) {
        // Server responded with error
        const errorMessage = err.response.data.message || err.response.data.error;
        console.error('Server error response:', {
          status: err.response.status,
          headers: err.response.headers,
          data: err.response.data
        });
        setError(errorMessage || 'Google authentication failed. Please try again.');
      } else if (err.request) {
        // Request made but no response
        console.error('Network error - no response received');
        setError('Unable to reach authentication server. Please check your connection.');
      } else {
        // Error in request setup
        console.error('Request setup error:', err.message);
        setError('Authentication error. Please try again.');
      }
    }
  };

  const sectionClasses = `auth${isDarkMode ? ' auth--dark' : ''}`;

  return (
    <section className={sectionClasses}>
      <div className="auth__wrapper">
        <aside className="auth__promo" aria-hidden="true">
          <div className="auth__promo-content">
            <h1 className="auth__promo-title">Join Multi-Tool.io and unlock your productivity</h1>
            <p className="auth__promo-text">
              Sign up now to access all tools and sync your work across devices.
            </p>
            <ul className="auth__promo-list">
              <li>Access to all productivity tools</li>
              <li>Secure authentication with Google OAuth</li>
              <li>Personalized experience with saved preferences</li>
            </ul>
          </div>
        </aside>
        <div className="auth__content">
          <div className={`auth__form${formVisible ? ' auth__form--show' : ''}`}>

            {error && (
              <div className="auth__alert auth__alert--error" role="alert">
                {error}
              </div>
            )}
            {showSuccess && (
              <div className="auth__alert auth__alert--success" role="status">
                Account created successfully! Redirecting to login...
              </div>
            )}

            <form onSubmit={onSubmit}>
              <div className="auth__group">
                <label className="auth__label" htmlFor="register-name">Name</label>
                <input
                  className="auth__input"
                  id="register-name"
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  value={currState.name}
                  onChange={onChangeHandler}
                  required
                />
              </div>
              <div className="auth__group">
                <label className="auth__label" htmlFor="register-email">Email</label>
                <input
                  className="auth__input"
                  id="register-email"
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={currState.email}
                  onChange={onChangeHandler}
                  required
                />
              </div>
              <div className="auth__group">
                <label className="auth__label" htmlFor="register-password">Password</label>
                <div className="auth__input-wrapper">
                  <input
                    className="auth__input auth__input--with-icon"
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Create a password"
                    value={currState.password}
                    onChange={onChangeHandler}
                    required
                  />
                  <button
                    type="button"
                    className="auth__password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <div className="auth__group">
                <label className="auth__label" htmlFor="register-mobile">Mobile (Optional)</label>
                <input
                  className="auth__input"
                  id="register-mobile"
                  type="tel"
                  name="mobile"
                  placeholder="Enter 10-digit mobile number"
                  value={currState.mobile}
                  onChange={onChangeHandler}
                  maxLength="10"
                  pattern="[6-9]{1}[0-9]{9}"
                  title="Please enter a valid 10-digit Indian mobile number (starts with 6-9)"
                />
              </div>
              <button type="submit" className="auth__btn">
                Create Account
              </button>
              <div className="auth__divider">OR</div>
              <div className="auth__social">
                <GoogleLogin
                  onSuccess={handleGoogleLogin}
                  onError={(error) => {
                    console.error('Google Sign In Error:', error);
                    setError('Google registration failed. Please try again.');
                  }}
                  useOneTap={false}
                  width={300}
                  theme="filled_blue"
                  shape="rectangular"
                  type="standard"
                  size="large"
                  text="signup_with"
                  context="signup"
                  locale="en"
                  auto_select={false}
                  itp_support={true}
                />
              </div>
              <p className="auth__muted">
                Already have an account?{' '}
                <Link to="/login" className="auth__link">
                  Login
                </Link>
              </p>
            </form>

          </div>
        </div>
      </div>
    </section>
  );
};

export default Register;
