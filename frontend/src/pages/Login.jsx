import React, { useState, useEffect, useCallback } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [currState, setCurrState] = useState({
    email: '',
    password: '',
    mobile: ''
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPhoneLogin, setIsPhoneLogin] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [formVisible, setFormVisible] = useState(false);

  const handleLoginMethodChange = useCallback((usePhoneLogin) => {
    setIsPhoneLogin(usePhoneLogin);
    setError('');
    setOtpSent(false);
    setOtp('');
  }, []);

  useEffect(() => {
    setTimeout(() => setFormVisible(true), 50);
  }, []);

  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setCurrState(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  // Email/Password Login
  const onSubmit = async (e) => {
    e.preventDefault();
    if (!currState.email || !currState.password) {
      setError('Please fill all required fields');
      return;
    }
    try {
      const BASE_URL = import.meta.env.VITE_BACKEND_URL;
      const response = await axios.post(`${BASE_URL}/api/auth/login`, currState);
      if (response.data.success) {
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          window.dispatchEvent(new Event('authChange'));
          setCurrState({ email: '', password: '', mobile: '' });
          navigate('/');
        } else {
          setError('Authentication failed - No token received');
        }
      } else {
        setError(response.data.message || 'An error occurred');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during authentication');
    }
  };

  // Send OTP for mobile login
  const sendOTPHandler = async () => {
    if (!currState.mobile || currState.mobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    try {
  setError('');
  const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/otp/send`, { mobile: currState.mobile });
      if (res.data.success) {
        setOtpSent(true);
      } else {
        setError(res.data.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    }
  };

  // Verify OTP for mobile login
  const verifyOTPHandler = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    try {
      setError('');
  const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/otp/verify`, { mobile: currState.mobile, otp });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user || { name: 'User' }));
        window.dispatchEvent(new Event('authChange'));
        navigate('/');
      } else {
        setError(res.data.message || 'OTP verification failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed');
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
        setCurrState({ email: '', password: '', mobile: '' });
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

  const subtitle = isPhoneLogin
    ? otpSent
      ? 'Enter the OTP sent to your mobile number to sign in securely.'
      : 'Login with your mobile number and receive a secure OTP.'
    : 'Access your personalized toolkit with your email and password.';

  const sectionClasses = `auth${isDarkMode ? ' auth--dark' : ''}`;

  return (
    <section className={sectionClasses}>
      <div className="auth__wrapper">
        <aside className="auth__promo" aria-hidden="true">
          <div className="auth__promo-content">
            <h1 className="auth__promo-title">Welcome back to Multi-Tool.io</h1>
            <p className="auth__promo-text">
              Power through file conversions, AI workflows, audio cleanups and more with a single login.
            </p>
            <ul className="auth__promo-list">
              <li>Single sign-on across all productivity tools</li>
              <li>Multi-channel security with OTP + Google OAuth</li>
              <li>Persistent preferences with light &amp; dark themes</li>
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

            <div className="login-method-toggle" role="radiogroup" aria-label="Login method">
              <button
                type="button"
                className={!isPhoneLogin ? 'active' : ''}
                onClick={() => handleLoginMethodChange(false)}
                aria-pressed={!isPhoneLogin}
              >
                Email Login
              </button>
              <button
                type="button"
                className={isPhoneLogin ? 'active' : ''}
                onClick={() => handleLoginMethodChange(true)}
                aria-pressed={isPhoneLogin}
              >
                Phone Login
              </button>
            </div>

            {isPhoneLogin ? (
              <form onSubmit={verifyOTPHandler}>
                <div className="auth__group">
                  <label className="auth__label" htmlFor="login-mobile">Mobile Number</label>
                  <input
                    className="auth__input"
                    id="login-mobile"
                    type="tel"
                    name="mobile"
                    placeholder="Enter your mobile number"
                    value={currState.mobile}
                    onChange={onChangeHandler}
                    maxLength="10"
                    disabled={otpSent}
                    pattern="[0-9]{10}"
                    title="Please enter a valid 10-digit mobile number"
                    required
                  />
                  {!otpSent && (
                    <button type="button" className="send-otp-button" onClick={sendOTPHandler}>
                      Send OTP
                    </button>
                  )}
                </div>
                {otpSent && (
                  <>
                    <div className="auth__group">
                      <label className="auth__label" htmlFor="login-otp">OTP</label>
                      <input
                        className="auth__input"
                        id="login-otp"
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={e => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          if (value.length <= 6) setOtp(value);
                        }}
                        pattern="[0-9]{6}"
                        maxLength="6"
                        required
                      />
                      <button type="button" className="resend-otp-button" onClick={sendOTPHandler}>
                        Resend
                      </button>
                    </div>
                    <p className="auth__hint">We will never share your number. The OTP expires in 2 minutes.</p>
                    <button type="submit" className="auth__btn">
                      Verify &amp; Login
                    </button>
                  </>
                )}
              </form>
            ) : (
              <form onSubmit={onSubmit}>
                <div className="auth__group">
                  <label className="auth__label" htmlFor="login-email">Email</label>
                  <input
                    className="auth__input"
                    id="login-email"
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={currState.email}
                    onChange={onChangeHandler}
                    required
                  />
                </div>
                <div className="auth__group">
                  <label className="auth__label" htmlFor="login-password">Password</label>
                  <div className="auth__input-wrapper">
                    <input
                      className="auth__input auth__input--with-icon"
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Enter your password"
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
                  <Link to="/reset" className="auth__link" style={{ display: 'block', marginTop: '10px' }}>
                    Forgot Password?
                  </Link>
                </div>
                <button type="submit" className="auth__btn">
                  Login
                </button>
                <div className="auth__divider">OR</div>
                <div className="auth__social">
                  <GoogleLogin
                    onSuccess={handleGoogleLogin}
                    onError={(error) => {
                      console.error('Google Sign In Error:', error);
                      setError('Google login failed. Please try again.');
                    }}
                    useOneTap={false}
                    width={300}
                    theme="filled_blue"
                    shape="rectangular"
                    type="standard"
                    size="large"
                    text="continue_with"
                    context="signin"
                    locale="en"
                    auto_select={false}
                    itp_support={true}
                  />
                </div>
                <p className="auth__muted">
                  Don't have an account?{' '}
                  <Link to="/register" className="auth__link">
                    Register
                  </Link>
                </p>
              </form>
            )}

          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;
