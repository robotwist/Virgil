import React, { useState } from 'react';
import axios from 'axios';
import '../styles/Login.css';
import virgilLogo from '../assets/images/Virgil-Logo-2.png';

// Get API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Login = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login request
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        
        const response = await axios.post(
          `${API_URL}/auth/token`, 
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        
        // Store the token in localStorage
        localStorage.setItem('authToken', response.data.access_token);
        localStorage.setItem('username', username);
        
        // Call the success handler
        onLoginSuccess(response.data.access_token, username);
      } else {
        // Registration request
        const userData = {
          username,
          email,
          password
        };
        
        console.log('Sending registration data:', userData);
        
        const response = await axios.post(
          `${API_URL}/auth/register`, 
          userData,
          { headers: { 'Content-Type': 'application/json' } }
        );
        
        // Switch to login form after successful registration
        setIsLogin(true);
        setError('Registration successful! Please log in.');
      }
    } catch (err) {
      console.error('Authentication error:', err);
      
      if (err.response?.status === 422) {
        // Handle validation errors (422 Unprocessable Entity)
        const validationErrors = err.response.data.detail;
        if (Array.isArray(validationErrors)) {
          // Format the validation errors in a readable way
          const errorMessages = validationErrors.map(err => 
            `${err.loc[1]}: ${err.msg}`
          ).join(', ');
          setError(`Validation error: ${errorMessages}`);
        } else {
          setError('Invalid form data. Please check your inputs.');
        }
      } else {
        setError(err.response?.data?.detail || 'An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo-container">
          <img src={virgilLogo} alt="Virgil Logo" className="login-logo" />
        </div>
        <h2>{isLogin ? 'Log In' : 'Create Account'}</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            {!isLogin && <small>Password must be at least 6 characters</small>}
          </div>
          
          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading 
              ? 'Processing...' 
              : isLogin 
                ? 'Log In' 
                : 'Create Account'}
          </button>
        </form>
        
        <div className="toggle-form">
          {isLogin ? (
            <p>
              Don't have an account?{' '}
              <button onClick={() => setIsLogin(false)}>Sign Up</button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button onClick={() => setIsLogin(true)}>Log In</button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login; 