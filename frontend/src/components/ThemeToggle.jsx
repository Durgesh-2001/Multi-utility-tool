import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { assets } from '../assets/assets';

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button 
      className="theme-toggle" 
      onClick={toggleTheme}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <img 
        src={isDarkMode ? assets.sun_icon : assets.moon_icon} 
        alt={isDarkMode ? 'Sun' : 'Moon'}
        className="theme-toggle__icon"
      />
    </button>
  );
};

export default ThemeToggle; 