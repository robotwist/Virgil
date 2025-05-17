import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/ToneSelector.css';

// Get API URL from environment variable, fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ToneSelector = ({ onToneChange, currentTone = 'default' }) => {
  const [tones, setTones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    const fetchTones = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${API_URL}/tones`);
        setTones(response.data.tones);
        setError(null);
      } catch (err) {
        console.error('Error fetching tones:', err);
        setError('Could not load tone options');
        // Set default tones as fallback
        setTones(['default', 'interview', 'presentation', 'writing', 'negotiation']);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTones();
  }, []);
  
  const handleToneSelect = (tone) => {
    onToneChange(tone);
    setIsOpen(false);
  };
  
  return (
    <div className="tone-selector">
      <div className="tone-label">Virgil Mode:</div>
      <div className="dropdown">
        <button 
          className="dropdown-toggle" 
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : currentTone}
          <span className="arrow">▼</span>
        </button>
        
        {isOpen && (
          <ul className="dropdown-menu">
            {tones.map(tone => (
              <li 
                key={tone} 
                className={tone === currentTone ? 'active' : ''}
                onClick={() => handleToneSelect(tone)}
              >
                {tone}
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <div className="tone-error">{error}</div>}
    </div>
  );
};

export default ToneSelector; 