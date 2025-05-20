import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/AdminDashboard.css';
import virgilLogo from '../assets/images/Virgil-Logo-1.png';
import { getAuthHeaders, isAuthenticated, isAdmin } from '../utils/auth';

// Get API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const AdminDashboard = ({ username, onLogout }) => {
  const [metrics, setMetrics] = useState(null);
  const [activeUsers, setActiveUsers] = useState(0);
  const [topTones, setTopTones] = useState([]);
  const [daysFilter, setDaysFilter] = useState(7);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Check if user is authorized to view admin dashboard
  useEffect(() => {
    if (!isAuthenticated() || !isAdmin()) {
      navigate('/');
    }
  }, [navigate]);

  // Fetch admin dashboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Use the auth utility to get headers
        const headers = getAuthHeaders();
        
        // Fetch metrics - this will include all the data we need
        const metricsRes = await axios.get(`${API_URL}/admin/metrics`, { headers });
        
        setMetrics(metricsRes.data);
        
        // Set active users based on the metrics response and current filter
        if (daysFilter === 1) {
          setActiveUsers(metricsRes.data.active_users_24h || 0);
        } else if (daysFilter === 7) {
          setActiveUsers(metricsRes.data.active_users_7d || 0);
        } else {
          setActiveUsers(metricsRes.data.active_users_30d || 0);
        }
        
        // Transform top tones data from the metrics response
        if (metricsRes.data.top_tones) {
          const tonesArray = Object.entries(metricsRes.data.top_tones).map(([name, count]) => ({
            name,
            count
          }));
          setTopTones(tonesArray);
        }
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        
        // Handle specific error cases
        if (err.response?.status === 401) {
          setError('Authentication error. Please login again.');
          // Auto logout after 2 seconds
          setTimeout(() => {
            onLogout();
            navigate('/');
          }, 2000);
        } else if (err.response?.status === 403) {
          setError('You do not have permission to access the admin dashboard.');
          // Redirect after 2 seconds
          setTimeout(() => {
            navigate('/');
          }, 2000);
        } else {
          setError('Failed to load dashboard data. Please try again later.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isAuthenticated() && isAdmin()) {
      fetchData();
    }
  }, [daysFilter, navigate, onLogout]);

  const handleDaysFilterChange = (days) => {
    setDaysFilter(days);
    // Update active users count based on already fetched metrics
    if (metrics) {
      if (days === 1) {
        setActiveUsers(metrics.active_users_24h || 0);
      } else if (days === 7) {
        setActiveUsers(metrics.active_users_7d || 0);
      } else {
        setActiveUsers(metrics.active_users_30d || 0);
      }
    }
  };

  // If not authenticated or not admin, don't render anything (will redirect in useEffect)
  if (!isAuthenticated() || !isAdmin()) {
    return (
      <div className="admin-dashboard">
        <div className="error-message">You are not authorized to view this page. Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-title">
          <img src={virgilLogo} alt="Virgil Logo" className="admin-logo" />
          <h1>Virgil Admin Dashboard</h1>
          <span className="admin-badge">Admin Panel</span>
        </div>
        
        <div className="admin-controls">
          <div className="admin-welcome">
            Welcome, {username}
          </div>
          <Link to="/" className="admin-home-link">Go to App</Link>
          <button onClick={onLogout} className="admin-logout-button">Logout</button>
        </div>
      </header>
      
      <main className="admin-content">
        {error && (
          <div className="error-message">{error}</div>
        )}
        
        {isLoading ? (
          <div className="loading-indicator">Loading dashboard data...</div>
        ) : (
          <>
            <section className="metrics-summary">
              <div className="metric-card">
                <h3>Total Requests</h3>
                <div className="metric-value">{metrics?.total_requests || 0}</div>
              </div>
              
              <div className="metric-card">
                <h3>Average Response Time</h3>
                <div className="metric-value">
                  {metrics?.avg_response_time_ms ? `${metrics.avg_response_time_ms} ms` : 'N/A'}
                </div>
              </div>
              
              <div className="metric-card">
                <h3>Active Users ({daysFilter}d)</h3>
                <div className="metric-value">{activeUsers}</div>
                <div className="filter-buttons">
                  <button 
                    className={daysFilter === 1 ? 'active' : ''} 
                    onClick={() => handleDaysFilterChange(1)}
                  >
                    1d
                  </button>
                  <button 
                    className={daysFilter === 7 ? 'active' : ''} 
                    onClick={() => handleDaysFilterChange(7)}
                  >
                    7d
                  </button>
                  <button 
                    className={daysFilter === 30 ? 'active' : ''} 
                    onClick={() => handleDaysFilterChange(30)}
                  >
                    30d
                  </button>
                </div>
              </div>
            </section>
            
            <section className="data-section">
              <div className="section-card tones-section">
                <h3>Top Tones</h3>
                <div className="tone-list">
                  {topTones.length > 0 ? (
                    <ul>
                      {topTones.map((tone, index) => (
                        <li key={index} className="tone-item">
                          <div className="tone-name">{tone.name}</div>
                          <div className="tone-count">{tone.count} uses</div>
                          <div className="tone-bar">
                            <div 
                              className="tone-bar-fill" 
                              style={{ 
                                width: `${(tone.count / topTones[0].count) * 100}%` 
                              }} 
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="no-data">No tone data available yet</p>
                  )}
                </div>
              </div>
              
              <div className="section-card requests-section">
                <h3>Requests by Day</h3>
                {metrics?.requests_by_day && Object.keys(metrics.requests_by_day).length > 0 ? (
                  <div className="requests-chart">
                    <ul>
                      {Object.entries(metrics.requests_by_day)
                        .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
                        .map(([date, count]) => (
                          <li key={date} className="day-stat">
                            <div className="day-date">{new Date(date).toLocaleDateString()}</div>
                            <div className="day-count">{count} requests</div>
                            <div className="day-bar">
                              <div 
                                className="day-bar-fill" 
                                style={{ 
                                  width: `${(count / Math.max(...Object.values(metrics.requests_by_day))) * 100}%` 
                                }} 
                              />
                            </div>
                          </li>
                        ))
                      }
                    </ul>
                  </div>
                ) : (
                  <p className="no-data">No request data available yet</p>
                )}
              </div>
            </section>
          </>
        )}
      </main>
      
      <footer className="admin-footer">
        <p>Virgil Admin Dashboard &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default AdminDashboard; 