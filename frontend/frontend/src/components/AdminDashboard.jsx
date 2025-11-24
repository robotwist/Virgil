import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/AdminDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    userCount: 0,
    messageCount: 0,
    averageResponseTime: 0,
    activeUsers: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await axios.get(`${API_URL}/admin/stats`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        
        setStats(response.data);
      } catch (err) {
        console.error('Error fetching admin data:', err);
        setError('Failed to load admin dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAdminData();
  }, []);

  return (
    <div className="admin-dashboard">
      <h2>Admin Dashboard</h2>
      
      {isLoading ? (
        <div className="loading-indicator">Loading dashboard data...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="dashboard-content">
          <div className="stats-container">
            <div className="stat-card">
              <h3>Total Users</h3>
              <div className="stat-value">{stats.userCount}</div>
            </div>
            
            <div className="stat-card">
              <h3>Total Messages</h3>
              <div className="stat-value">{stats.messageCount}</div>
            </div>
            
            <div className="stat-card">
              <h3>Avg Response Time</h3>
              <div className="stat-value">{stats.averageResponseTime.toFixed(2)}s</div>
            </div>
            
            <div className="stat-card">
              <h3>Active Users</h3>
              <div className="stat-value">{stats.activeUsers}</div>
            </div>
          </div>
          
          <div className="admin-actions">
            <h3>Administrative Actions</h3>
            <button className="admin-button">Manage Users</button>
            <button className="admin-button">View Logs</button>
            <button className="admin-button">System Settings</button>
          </div>
          
          <div className="voice-stats">
            <h3>Voice Interface Statistics</h3>
            <p>This section will display voice interaction statistics.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 