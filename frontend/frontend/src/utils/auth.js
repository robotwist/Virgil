/**
 * Authentication utilities for handling JWT tokens and user sessions
 */

// Get the stored token from localStorage
export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Get the stored username from localStorage
export const getUsername = () => {
  return localStorage.getItem('username');
};

// Check if the user is authenticated
export const isAuthenticated = () => {
  const token = getAuthToken();
  return !!token;
};

// Check if the user is an admin
export const isAdmin = () => {
  const username = getUsername();
  return username === 'admin';
};

// Set up auth headers for API requests
export const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    Authorization: `Bearer ${token}`
  };
};

// Login user
export const loginUser = (token, username) => {
  localStorage.setItem('authToken', token);
  localStorage.setItem('username', username);
};

// Logout user
export const logoutUser = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('username');
}; 