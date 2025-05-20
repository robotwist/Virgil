import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import InputBox from '../components/InputBox';
import Login from '../components/Login';
import Subscription from '../components/Subscription';
import '../styles/Home.css';
import { VirgilLogo1, VirgilLogo2 } from '../assets/images';

const Home = ({ isAuthenticated, username, onLoginSuccess, onLogout }) => {
  const [showSubscription, setShowSubscription] = useState(false);
  const [activeLogoIndex, setActiveLogoIndex] = useState(0);
  const logos = [VirgilLogo1, VirgilLogo2];
  
  // Automatically switch between logos every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLogoIndex((prevIndex) => (prevIndex === 0 ? 1 : 0));
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Check if user needs to see subscription page
  useEffect(() => {
    if (isAuthenticated) {
      // In a real app, you would check if the user has an active subscription
      // For now, we'll just use local storage to simulate this
      const hasCompletedSubscription = localStorage.getItem('subscription_completed');
      if (!hasCompletedSubscription) {
        setShowSubscription(true);
      }
    }
  }, [isAuthenticated]);
  
  const handleLoginSuccess = (token, user) => {
    onLoginSuccess(token, user);
  };
  
  const handleLogout = () => {
    onLogout();
  };
  
  const handleSubscriptionComplete = () => {
    localStorage.setItem('subscription_completed', 'true');
    setShowSubscription(false);
  };

  const handleLogoClick = () => {
    setActiveLogoIndex((prevIndex) => (prevIndex === 0 ? 1 : 0));
  };

  const handleImageError = (e) => {
    e.target.src = 'https://placehold.co/200x200/1e293b/38bdf8?text=VIRGIL';
  };

  return (
    <div className="home">
      <header>
        <div className="hero-logo-container">
          <img 
            src={logos[activeLogoIndex]} 
            alt="Virgil Logo" 
            className="hero-logo"
            onClick={handleLogoClick}
            onError={handleImageError}
          />
        </div>
        <h1>Virgil</h1>
        <p className="tagline">Your AI-powered real-time guide</p>
        
        {isAuthenticated && (
          <div className="user-info">
            <span>Hello, {username}</span>
            {username === 'admin' && (
              <Link to="/admin" className="admin-link">Admin Dashboard</Link>
            )}
            <button className="logout-button" onClick={handleLogout}>Logout</button>
          </div>
        )}
      </header>
      
      <main>
        {!isAuthenticated ? (
          <Login onLoginSuccess={handleLoginSuccess} />
        ) : showSubscription ? (
          <Subscription 
            onComplete={handleSubscriptionComplete} 
            userEmail={username}
          />
        ) : (
          <InputBox username={username} />
        )}
      </main>
      
      <footer>
        <div className="mode-info">
          <h3>Available Modes</h3>
          <div className="modes">
            <div className="mode">
              <strong>Default</strong>
              <p>Balanced guidance for everyday situations</p>
            </div>
            <div className="mode">
              <strong>Interview</strong>
              <p>Strategic advice for job interviews</p>
            </div>
            <div className="mode">
              <strong>Presentation</strong>
              <p>Support for public speaking</p>
            </div>
            <div className="mode">
              <strong>Writing</strong>
              <p>Help with writing and creative expression</p>
            </div>
            <div className="mode">
              <strong>Negotiation</strong>
              <p>Tactical guidance for difficult conversations</p>
            </div>
          </div>
        </div>
        <p className="copyright">© {new Date().getFullYear()} Virgil Guide</p>
      </footer>
    </div>
  );
};

export default Home;