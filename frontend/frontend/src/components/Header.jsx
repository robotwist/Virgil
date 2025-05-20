import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Header.css';
import { VirgilLogo1, VirgilLogo2 } from '../assets/images';

const Header = ({ isLoggedIn, username, onLogout, isAdmin }) => {
  const [logoHovered, setLogoHovered] = useState(false);
  
  const handleLogout = (e) => {
    e.preventDefault();
    if (onLogout) {
      onLogout();
    }
  };

  const handleImageError = (e) => {
    e.target.src = 'https://placehold.co/40x40/1e293b/38bdf8?text=V'; // Fallback image
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo-container">
          <Link to="/" className="logo-link">
            <img
              src={logoHovered ? VirgilLogo2 : VirgilLogo1}
              alt="Virgil Logo"
              className="app-logo"
              onMouseEnter={() => setLogoHovered(true)}
              onMouseLeave={() => setLogoHovered(false)}
              onError={handleImageError}
            />
            <h1 className="app-title">Virgil</h1>
          </Link>
        </div>
        
        <nav className="main-nav">
          <ul className="nav-links">
            <li>
              <Link to="/" className="nav-link">Home</Link>
            </li>
            {isLoggedIn && (
              <>
                <li>
                  <Link to="/chat" className="nav-link">Chat</Link>
                </li>
                <li>
                  <Link to="/voice-test" className="nav-link">Voice Test</Link>
                </li>
                {isAdmin && (
                  <li>
                    <Link to="/admin" className="nav-link admin-link">Admin Dashboard</Link>
                  </li>
                )}
              </>
            )}
            <li>
              <Link to="/about" className="nav-link">About</Link>
            </li>
          </ul>
        </nav>
        
        <div className="user-controls">
          {isLoggedIn ? (
            <>
              <span className="username">Welcome, {username}</span>
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="login-link">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 