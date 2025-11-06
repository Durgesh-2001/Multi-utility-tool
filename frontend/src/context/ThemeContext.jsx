import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Save theme preference to localStorage
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    
    // Apply theme to document body
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    
    // Update CSS custom properties
    const root = document.documentElement;
    if (isDarkMode) {
      // Dark theme colors
      root.style.setProperty('--bg-color', '#1a1a1a');
      root.style.setProperty('--text-color', '#ffffff');
      root.style.setProperty('--card-bg', '#2d2d2d');
      root.style.setProperty('--border-color', '#404040');
      root.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.3)');
      root.style.setProperty('--input-bg', '#3d3d3d');
      root.style.setProperty('--input-border', '#555555');
      root.style.setProperty('--button-bg', '#4a90e2');
      root.style.setProperty('--button-hover', '#357abd');
      root.style.setProperty('--accent-color', '#ff6b6b');
      
      // Additional properties for ImageGenerator
      root.style.setProperty('--primary-color', '#4a90e2');
      root.style.setProperty('--primary-hover', '#357abd');
      root.style.setProperty('--primary-shadow', 'rgba(74, 144, 226, 0.3)');
      root.style.setProperty('--secondary-color', '#6c757d');
      root.style.setProperty('--secondary-hover', '#5a6268');
      root.style.setProperty('--secondary-bg', '#6c757d');
      root.style.setProperty('--secondary-text', '#e9ecef');
      root.style.setProperty('--secondary-shadow', 'rgba(108, 117, 125, 0.3)');
      root.style.setProperty('--success-color', '#28a745');
      root.style.setProperty('--success-hover', '#218838');
      root.style.setProperty('--success-bg', 'rgba(40, 167, 69, 0.1)');
      root.style.setProperty('--success-text', '#d4edda');
      root.style.setProperty('--success-shadow', 'rgba(40, 167, 69, 0.3)');
      root.style.setProperty('--success-shadow-hover', 'rgba(40, 167, 69, 0.4)');
      root.style.setProperty('--error-color', '#dc3545');
      root.style.setProperty('--error-bg', 'rgba(220, 53, 69, 0.1)');
      root.style.setProperty('--warning-color', '#ffc107');
      root.style.setProperty('--warning-text', '#fff3cd');
      root.style.setProperty('--tips-bg', 'rgba(255, 193, 7, 0.1)');
      root.style.setProperty('--tools-bg', 'rgba(108, 117, 125, 0.1)');
      root.style.setProperty('--loading-bg', 'rgba(74, 144, 226, 0.1)');
      root.style.setProperty('--hover-bg', 'rgba(74, 144, 226, 0.1)');
      root.style.setProperty('--button-shadow', 'rgba(74, 144, 226, 0.3)');
      root.style.setProperty('--button-shadow-hover', 'rgba(74, 144, 226, 0.4)');
      root.style.setProperty('--accent-shadow', 'rgba(255, 107, 107, 0.1)');
      root.style.setProperty('--text-muted', '#adb5bd');
      root.style.setProperty('--tag-bg', '#495057');
      root.style.setProperty('--tag-text', '#e9ecef');
      root.style.setProperty('--type-bg', 'rgba(74, 144, 226, 0.2)');
      root.style.setProperty('--type-text', '#4a90e2');
      root.style.setProperty('--cost-bg', 'rgba(40, 167, 69, 0.2)');
      root.style.setProperty('--cost-text', '#28a745');
      root.style.setProperty('--setup-bg', 'rgba(255, 193, 7, 0.2)');
      root.style.setProperty('--setup-text', '#ffc107');
    } else {
      // Light theme colors
      root.style.setProperty('--bg-color', '#ffffff');
      root.style.setProperty('--text-color', '#000000');
      root.style.setProperty('--card-bg', '#f8f9fa');
      root.style.setProperty('--border-color', '#e0e0e0');
      root.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.1)');
      root.style.setProperty('--input-bg', '#ffffff');
      root.style.setProperty('--input-border', '#cccccc');
      root.style.setProperty('--button-bg', '#007bff');
      root.style.setProperty('--button-hover', '#0056b3');
      root.style.setProperty('--accent-color', '#ff6b6b');
      
      // Additional properties for ImageGenerator
      root.style.setProperty('--primary-color', '#007bff');
      root.style.setProperty('--primary-hover', '#0056b3');
      root.style.setProperty('--primary-shadow', 'rgba(0, 123, 255, 0.3)');
      root.style.setProperty('--secondary-color', '#6c757d');
      root.style.setProperty('--secondary-hover', '#5a6268');
      root.style.setProperty('--secondary-bg', '#6c757d');
      root.style.setProperty('--secondary-text', '#495057');
      root.style.setProperty('--secondary-shadow', 'rgba(108, 117, 125, 0.3)');
      root.style.setProperty('--success-color', '#28a745');
      root.style.setProperty('--success-hover', '#218838');
      root.style.setProperty('--success-bg', 'rgba(40, 167, 69, 0.1)');
      root.style.setProperty('--success-text', '#155724');
      root.style.setProperty('--success-shadow', 'rgba(40, 167, 69, 0.3)');
      root.style.setProperty('--success-shadow-hover', 'rgba(40, 167, 69, 0.4)');
      root.style.setProperty('--error-color', '#dc3545');
      root.style.setProperty('--error-bg', 'rgba(220, 53, 69, 0.1)');
      root.style.setProperty('--warning-color', '#ffc107');
      root.style.setProperty('--warning-text', '#856404');
      root.style.setProperty('--tips-bg', 'rgba(255, 193, 7, 0.1)');
      root.style.setProperty('--tools-bg', 'rgba(108, 117, 125, 0.1)');
      root.style.setProperty('--loading-bg', 'rgba(0, 123, 255, 0.1)');
      root.style.setProperty('--hover-bg', 'rgba(0, 123, 255, 0.1)');
      root.style.setProperty('--button-shadow', 'rgba(0, 123, 255, 0.3)');
      root.style.setProperty('--button-shadow-hover', 'rgba(0, 123, 255, 0.4)');
      root.style.setProperty('--accent-shadow', 'rgba(255, 107, 107, 0.1)');
      root.style.setProperty('--text-muted', '#6c757d');
      root.style.setProperty('--tag-bg', '#f8f9fa');
      root.style.setProperty('--tag-text', '#495057');
      root.style.setProperty('--type-bg', '#e3f2fd');
      root.style.setProperty('--type-text', '#1976d2');
      root.style.setProperty('--cost-bg', '#e8f5e8');
      root.style.setProperty('--cost-text', '#2e7d32');
      root.style.setProperty('--setup-bg', '#fff3e0');
      root.style.setProperty('--setup-text', '#f57c00');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const value = {
    isDarkMode,
    toggleTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 