import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Components
import InputBox from './components/InputBox';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import Header from './components/Header';
// Commenting out the voice interface import for now
// import VoiceInterfaceTest from './components/VoiceInterfaceTest';

// Auth utility
import { isAuthenticated, getUsername, isAdmin, logoutUser } from './utils/auth';

// Get API URL from environment variable, fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Axios timeout (ms)
const REQUEST_TIMEOUT = 120000; // 2 minutes

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [username, setUsername] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tone, setTone] = useState('default');
  const [lastResponse, setLastResponse] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [sessionId, setSessionId] = useState('');

  const messagesEndRef = useRef(null);

  // Check authentication on initial load
  useEffect(() => {
    // Check if user is logged in
    if (isAuthenticated()) {
      setIsLoggedIn(true);
      setUsername(getUsername());
      setIsAdminUser(isAdmin());
    }
    
    // Load last used tone if available
    const savedTone = localStorage.getItem('virgilTone');
    if (savedTone) {
      setTone(savedTone);
    }
    
    // Load message history if available
    const savedMessages = localStorage.getItem('virgilMessages');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages);
      } catch (e) {
        console.error('Failed to load saved messages:', e);
      }
    }

    // Load session ID if available
    const savedSessionId = localStorage.getItem('virgilSessionId');
    if (savedSessionId) {
      setSessionId(savedSessionId);
    }
  }, []);
  
  // Save messages to localStorage when they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('virgilMessages', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    // Store the session ID in localStorage when it changes
    localStorage.setItem('virgil_session_id', sessionId);
  }, [sessionId]);

  useEffect(() => {
    // Scroll to the bottom when messages update
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleLoginSuccess = (token, username) => {
    // Authentication is now handled by auth.js utility
    setIsLoggedIn(true);
    setUsername(username);
    setIsAdminUser(isAdmin());
  };

  const handleLogout = () => {
    logoutUser();
    setIsLoggedIn(false);
    setIsAdminUser(false);
    setUsername('');
  };

  const sendMessage = async (messageText) => {
    if (!messageText.trim()) return;
    
    setIsLoading(true);
    setErrorMessage('');
    
    // Add user message to chat
    const userMessage = { type: 'user', content: messageText };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    
    try {
      // For the first message, use quick-guide endpoint for faster response
      const isFirstMessage = messages.length === 0;
      const startTime = performance.now();
      
      // Choose the endpoint based on message count
      const endpoint = isFirstMessage ? 'quick-guide' : 'guide';
      console.log(`Using ${endpoint} endpoint for message #${messages.length + 1}`);
      
      const payload = isFirstMessage 
        ? { message: messageText } // Simplified payload for quick-guide
        : { 
            message: messageText,
            session_id: sessionId,
            tone: tone,
            username: username || 'guest'
          };
      
      // Make API call with timeout
      const res = await axios.post(
        `${API_URL}/${endpoint}`, 
        payload,
        { timeout: REQUEST_TIMEOUT }
      );
      
      // Calculate client-side response time
      const requestDuration = (performance.now() - startTime) / 1000;
      console.log(`Response received in ${requestDuration.toFixed(2)}s (server reported: ${res.data.response_time.toFixed(2)}s)`);
      
      // Save the session ID for future requests
      if (res.data.session_id) {
        setSessionId(res.data.session_id);
        localStorage.setItem('virgilSessionId', res.data.session_id);
      }
      
      // Add assistant response to chat
      const assistantMessage = { 
        type: 'assistant', 
        content: res.data.reply,
        timestamp: new Date().toISOString(),
        responseTime: requestDuration
      };
      setMessages(prevMessages => [...prevMessages, assistantMessage]);
      setLastResponse(res.data.reply);
      
    } catch (err) {
      console.error('API Error:', err);
      
      // Detailed error handling
      let errorText = 'Sorry, I had trouble processing your request.';
      
      if (err.code === 'ECONNABORTED') {
        errorText = 'The request timed out. The AI may be busy or offline.';
      } else if (err.response) {
        // Server responded with error
        const statusCode = err.response.status;
        const serverError = err.response.data?.detail || 'Unknown server error';
        
        if (statusCode === 500) {
          errorText = `Server error: ${serverError}`;
        } else if (statusCode === 503) {
          errorText = 'The service is temporarily unavailable. Please try again later.';
        } else {
          errorText = `Error (${statusCode}): ${serverError}`;
        }
      } else if (err.request) {
        // Request made but no response received
        errorText = 'No response from server. Please check your connection.';
      }
      
      setErrorMessage(errorText);
      setMessages(prevMessages => [
        ...prevMessages, 
        { type: 'error', content: errorText }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    localStorage.removeItem('virgilMessages');
    localStorage.removeItem('virgilSessionId');
    setSessionId('');
  };

  // Main chat interface
  const ChatInterface = () => (
    <div className="App">
      <img src="/virgil_logo.png" alt="Virgil Logo" className="App-logo" />
      <div className="App-main">
        <div className="card message-list">
          {messages.length === 0 ? (
            <div className="welcome-message">
              <h3>Welcome to Virgil</h3>
              <p>Your AI-powered guide for thoughtful conversation.</p>
              <p>How can I assist you today?</p>
            </div>
          ) : (
            <div className="message-container">
              {messages.map((message, index) => (
                <div key={index} className={`message ${message.type}`}>
                  {message.content}
                  {message.timestamp && <div className="message-timestamp">{message.timestamp}</div>}
                </div>
              ))}
              {isLoading && (
                <div className="message assistant loading">
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
          {errorMessage && !isLoading && (
            <div className="error-message">
              {errorMessage}
            </div>
          )}
        </div>
        
        <div className="controls-container">
          {messages.length > 0 && (
            <button 
              className="clear-button" 
              onClick={clearConversation}
              aria-label="Clear conversation"
            >
              Clear Chat
            </button>
          )}
          
          <InputBox 
            sendMessage={sendMessage} 
            isLoading={isLoading}
            messages={messages}
            tone={tone}
            setTone={setTone}
            lastResponse={lastResponse}
          />
        </div>
      </div>
    </div>
  );

  // Protected route for admin dashboard
  const ProtectedAdminRoute = () => {
    return isAdminUser ? <AdminDashboard /> : <Navigate to="/" />;
  };

  return (
    <Router>
      <div className="app">
        <Header 
          isLoggedIn={isLoggedIn} 
          username={username} 
          onLogout={handleLogout} 
          isAdmin={isAdminUser} 
        />
        
        <Routes>
          <Route path="/login" element={
            isLoggedIn ? <Navigate to="/" /> : <Login onLoginSuccess={handleLoginSuccess} />
          } />
          
          <Route path="/admin" element={
            <ProtectedAdminRoute />
          } />
          
          {/* Commenting out the voice test route 
          <Route path="/voice-test" element={
            <VoiceInterfaceTest />
          } /> */}
          
          <Route path="/" element={
            <ChatInterface />
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
