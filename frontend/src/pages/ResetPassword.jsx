import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';

const ResetPassword = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [step, setStep] = useState('request');
  const [token, setToken] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // This effect runs when the component loads to check for a reset token in the URL.
  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      setStep('reset');
    }
  }, [searchParams]);

  // Trigger form animation on mount
  useEffect(() => {
    setTimeout(() => setFormVisible(true), 50);
  }, []);

  // --- Step 1: Request a password reset link ---
  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setPreviewUrl(''); // Reset on new request

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/forgot`,
        { email: email }
      );

      setSuccess(response.data.message);
      if (response.data.previewUrl) {
        setPreviewUrl(response.data.previewUrl);
      }
      setStep('confirm'); // Move to confirmation view
    } catch (err) {
      setError(
        err.response?.data?.error || 'Failed to send reset link. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // --- Step 2: Set the new password using the token ---
  const handleSetNewPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/reset`,
        {
          token: token,
          password: password,
        }
      );

      if (response.data.success) {
        setSuccess('Password has been reset successfully! Redirecting...');
        // Redirect to login page after 3 seconds for a better user experience.
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Invalid or expired token. Please request a new link.'
      );
    } finally {
      setLoading(false);
    }
  };

  // --- Render Functions for Forms ---

  const renderRequestForm = () => (
    <form onSubmit={handleRequestReset}>
      <div className="auth__group">
        <label className="auth__label" htmlFor="reset-email">Email Address</label>
        <input
          className="auth__input"
          id="reset-email"
          type="email"
          name="email"
          placeholder="Enter your registered email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <button type="submit" className="auth__btn" disabled={loading}>
        {loading ? 'Sending...' : 'Send Reset Link'}
      </button>
      <div className="auth__divider">OR</div>
      <p className="auth__muted">
        Remember your password?{' '}
        <Link to="/login" className="auth__link">
          Back to Login
        </Link>
      </p>
    </form>
  );

  const renderResetForm = () => (
    <form onSubmit={handleSetNewPassword}>
      <div className="auth__group">
        <label className="auth__label" htmlFor="reset-new-password">New Password</label>
        <div className="auth__input-wrapper">
          <input
            className="auth__input auth__input--with-icon"
            id="reset-new-password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength="6"
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
        <p className="auth__hint">Minimum 6 characters required</p>
      </div>
      <div className="auth__group">
        <label className="auth__label" htmlFor="reset-confirm-password">Confirm Password</label>
        <div className="auth__input-wrapper">
          <input
            className="auth__input auth__input--with-icon"
            id="reset-confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="auth__password-toggle"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            {showConfirmPassword ? '🙈' : '👁️'}
          </button>
        </div>
      </div>
      <button type="submit" className="auth__btn" disabled={loading}>
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  );

  const sectionClasses = `auth${isDarkMode ? ' auth--dark' : ''}`;

  return (
    <section className={sectionClasses}>
      <div className="auth__wrapper">
        <aside className="auth__promo" aria-hidden="true">
          <div className="auth__promo-content">
            <h1 className="auth__promo-title">
              {step === 'request' 
                ? 'Secure Account Recovery'
                : step === 'confirm'
                ? 'Check Your Inbox'
                : 'Create Your New Password'}
            </h1>
            <p className="auth__promo-text">
              {step === 'request'
                ? "Don't worry! It happens. We'll send you a secure reset link to get you back on track."
                : step === 'confirm'
                ? 'We\'ve sent a password reset link to your email. Click the link to create a new password.'
                : 'Choose a strong password to keep your account safe and secure.'}
            </p>
            <ul className="auth__promo-list">
              <li>🔒 Secure encrypted password reset process</li>
              <li>📧 Instant email delivery with reset link</li>
              <li>⚡ Quick and hassle-free recovery</li>
              <li>🛡️ Your data remains protected throughout</li>
            </ul>
          </div>
        </aside>
        <div className="auth__content">
          <div className={`auth__form${formVisible ? ' auth__form--show' : ''}`}>
            <header className="auth__header">
              <h2 className="auth__subtitle">
                {step === 'request' 
                  ? 'Enter your email to receive a password reset link.'
                  : step === 'confirm'
                  ? 'Check your email for the reset link.'
                  : 'Create a new secure password for your account.'}
              </h2>
            </header>

            {error && (
              <div className="auth__alert auth__alert--error" role="alert">
                {error}
              </div>
            )}

            {success && (
              <div className="auth__alert auth__alert--success" role="status">
                {success}
              </div>
            )}

            {step === 'confirm' && (
              <div className="reset__email-sent">
                <div className="reset__email-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <h3 className="reset__email-title">Email Sent Successfully!</h3>
                <p className="reset__email-text">
                  We've sent a password reset link to <strong>{email}</strong>.
                  Please check your inbox and click the link to reset your password.
                </p>
                <div className="reset__email-tips">
                  <p><strong>💡 Tips:</strong></p>
                  <ul>
                    <li>Check your spam/junk folder if you don't see it</li>
                    <li>The link will expire in 1 hour for security</li>
                    <li>You can close this window after checking your email</li>
                  </ul>
                </div>
                {previewUrl && (
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="reset__preview-link"
                  >
                    Preview Test Email (Dev Only)
                  </a>
                )}
                <button
                  type="button"
                  className="auth__btn"
                  onClick={() => setStep('request')}
                  style={{ marginTop: '1rem' }}
                >
                  Send Another Link
                </button>
              </div>
            )}

            {step === 'request' && renderRequestForm()}
            {step === 'reset' && renderResetForm()}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResetPassword;