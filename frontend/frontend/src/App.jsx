import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import './styles/App.css';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState('');

  // Check authentication status on initial load
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const storedUsername = localStorage.getItem('username');
      
      if (token && storedUsername) {
        setIsAuthenticated(true);
        setUsername(storedUsername);
        
        // Check if user is admin (simple check - in a real app you'd verify with the server)
        setIsAdmin(storedUsername === 'admin');
      }
    };
    
    checkAuth();
  }, []);

  // Handle login success
  const handleLoginSuccess = (token, user) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('username', user);
    setIsAuthenticated(true);
    setUsername(user);
    setIsAdmin(user === 'admin');
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setUsername('');
    setIsAdmin(false);
  };

  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route 
            path="/" 
            element={
              <Home 
                isAuthenticated={isAuthenticated}
                username={username}
                onLoginSuccess={handleLoginSuccess}
                onLogout={handleLogout}
              />
            } 
          />
          <Route 
            path="/admin" 
            element={
              isAdmin ? 
              <AdminDashboard username={username} onLogout={handleLogout} /> : 
              <Navigate to="/" replace />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
