import React from 'react';
import { useNavigate } from 'react-router-dom';

const ToolCard = ({ tool, onClick }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (tool.available) {
      // For available tools, use the existing onClick
      if (onClick) {
        onClick();
      }
    } else {
      // For coming soon tools, navigate to the coming soon page
      navigate(`/coming-soon/${tool.id}`, { 
        state: { tool } 
      });
    }
  };

  const getStatusModifier = () => (tool.available ? 'tool-card--available' : 'tool-card--coming');

  const getStatusText = () => {
    return tool.available ? '✅ Available' : '🚀 Coming Soon';
  };

  return (
    <div className={`tool-card ${getStatusModifier()}`} onClick={handleCardClick}>
      <div className="tool-card__icon">
        <span className="tool-card__icon-inner">
          {typeof tool.icon === 'string' && (/^data:|^blob:|^https?:|\.(gif|png|jpe?g|svg)(\?.*)?$/i.test(tool.icon) || tool.icon.includes('/')) ? (
            <img src={tool.icon} alt={`${tool.title} icon`} />
          ) : (
            tool.icon
          )}
        </span>
      </div>
      {!tool.available && (
        <div className="tool-card__badge" aria-label="Coming soon"><span>Coming Soon</span></div>
      )}
      <div className="tool-card__content">
        <h3 className="tool-card__title">{tool.title}</h3>
        <p className="tool-card__desc">{tool.description}</p>
        {tool.available ? (
          <div className="tool-card__status tool-card__status--available">
            <span>{getStatusText()}</span>
          </div>
        ) : (
          <div className="tool-card__status tool-card__status--coming">
            <span>{getStatusText()}</span>
            <div className="tool-card__progress-info">
              <div className="tool-card__progress-bar">
                <div className="tool-card__progress-fill" style={{ width: tool.progress || '0%' }} />
              </div>
              <span className="tool-card__progress-text">{tool.progress} Complete</span>
            </div>
            <span className="tool-card__eta">ETA: {tool.eta}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolCard; 