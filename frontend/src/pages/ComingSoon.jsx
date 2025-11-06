import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ComingSoon = () => {
  const { toolId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [tool, setTool] = useState(location.state?.tool ?? null);
  const [loading, setLoading] = useState(!location.state?.tool);
  const [error, setError] = useState(null);
  const [emailNotified, setEmailNotified] = useState(false);
  const [browserNotified, setBrowserNotified] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL
    ? `${import.meta.env.VITE_BACKEND_URL}/api`
    : '/api';

  const fetchToolDetails = useCallback(async () => {
    if (!toolId) return;
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE_URL}/tools/${toolId}`);
      if (data?.success && data.tool) {
        setTool(data.tool);
        setError(null);
      } else {
        setError('Tool not found');
      }
    } catch (err) {
      console.error('Error fetching tool details:', err);
      setError('Failed to load tool details');
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, toolId]);

  useEffect(() => {
    if (!tool) fetchToolDetails();
  }, [tool, fetchToolDetails]);

  const handleEmailNotification = () => setEmailNotified(true);
  const handleBrowserNotification = () => setBrowserNotified(true);

  if (loading) {
    return (
      <div className="coming-soon-page">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading tool details...</p>
        </div>
      </div>
    );
  }

  if (error || !tool) {
    return (
      <div className="coming-soon-page">
        <div className="error-container">
          <h2>❌ {error || 'Tool not found'}</h2>
          <p>The tool you’re looking for doesn’t exist or couldn’t be loaded.</p>
          <div className="action-buttons">
            <button onClick={() => navigate('/tools')} className="tools-button">
              View All Tools
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progress = tool.progress ?? 30;

  return (
    <main
      className="coming-soon coming-soon--mono"
      aria-labelledby="comingSoonTitle"
    >
      <div className="coming-soon__container">
        {/* Left-corner Back link */}
        <a
          href="/tools"
          className="coming-soon__cta coming-soon__cta--left"
          aria-label="Back to tools list"
        >
          ← Back to Tools
        </a>

        <header className="coming-soon__header">
          <h1 id="comingSoonTitle" className="coming-soon__title">
            {tool.title}
          </h1>
          <p className="coming-soon__desc">{tool.description}</p>
        </header>

        <section className="coming-soon__status" aria-label="Development status">
          <div className="coming-soon__progress-wrap">
            <div
              className="coming-soon__progress-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <span
                style={{ width: `${progress}%` }}
                className="coming-soon__progress-fill"
              />
            </div>
            <div className="coming-soon__progress-meta">
              <span>{progress} Complete</span>
              <span className="coming-soon__eta">ETA: {tool.eta || 'TBA'}</span>
            </div>
          </div>
        </section>

        <section className="coming-soon__notify" aria-label="Notification preferences">
          <h2 className="coming-soon__subheading">Stay in the Loop</h2>
          <div className="coming-soon__notify-actions">
            <button
              className={`notify-btn notify-btn--primary ${emailNotified ? 'is-success' : ''}`}
              onClick={handleEmailNotification}
              disabled={emailNotified}
            >
              {emailNotified ? '✅ Email Subscribed' : '📧 Notify Me by Email'}
            </button>
            <button
              className={`notify-btn notify-btn--secondary ${browserNotified ? 'is-success' : ''}`}
              onClick={handleBrowserNotification}
              disabled={browserNotified}
            >
              {browserNotified ? '✅ Browser Enabled' : '🔔 Enable Browser Alerts'}
            </button>
          </div>
        </section>

        <section className="coming-soon__roadmap" aria-label="Planned features">
          <h2 className="coming-soon__subheading">Planned Highlights</h2>
          <ul className="coming-soon__feature-list">
            <li>⚡ High-performance core engine</li>
            <li>🧠 Smart AI-assisted workflow</li>
            <li>🗂️ Seamless multi-format support</li>
            <li>🔐 Privacy-first processing</li>
            <li>🚀 Progressive rollout & beta access</li>
          </ul>
        </section>
      </div>
    </main>
  );
};

export default ComingSoon;
