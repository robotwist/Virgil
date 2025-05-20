import React, { useState, useEffect } from 'react';
import VoiceInterface from './VoiceInterface';
import '../styles/VoiceInterfaceTest.css';

/**
 * Test component for the VoiceInterface
 * This component allows direct testing of the voice interface functionality
 */
const VoiceInterfaceTest = () => {
  const [sessionId, setSessionId] = useState('test-session-' + Math.random().toString(36).substring(2, 10));
  const [messages, setMessages] = useState([]);
  const [visible, setVisible] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [backendStatus, setBackendStatus] = useState({
    healthy: false,
    ml_packages_available: false,
    checked: false
  });
  const [mockMode, setMockMode] = useState(true);

  // Check backend status on component mount
  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        if (mockMode) {
          // Mock backend status for testing
          setBackendStatus({
            healthy: true,
            ml_packages_available: true,
            checked: true
          });
          return;
        }

        const response = await fetch('http://localhost:8000/health');
        if (response.ok) {
          const data = await response.json();
          setBackendStatus({
            healthy: data.status === 'healthy',
            ml_packages_available: data.ml_packages_available,
            checked: true
          });
        } else {
          setBackendStatus({
            healthy: false,
            ml_packages_available: false,
            checked: true
          });
        }
      } catch (error) {
        console.error('Failed to check backend status:', error);
        setBackendStatus({
          healthy: false,
          ml_packages_available: false,
          checked: true
        });
      }
    };

    checkBackendStatus();
  }, [mockMode]);

  const handleSendMessage = (message) => {
    console.log('Message sent:', message);
    
    // Add user message to the list
    const newUserMessage = {
      id: Date.now(),
      text: message,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    
    // Simulate a response
    setTimeout(() => {
      const responses = [
        "I understood your message. How can I help you further?",
        "That's interesting. Tell me more about that.",
        "I'm processing your request. Is there anything else you'd like to add?",
        "Thanks for sharing that information. What would you like to do next?",
        "I'm here to assist you. Let me know what else you need."
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const newBotMessage = {
        id: Date.now() + 1,
        text: randomResponse,
        sender: 'assistant',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prevMessages => [...prevMessages, newBotMessage]);
    }, 1500);
  };

  const handleToggleVisibility = () => {
    setVisible(!visible);
  };

  const handleToggleAudio = () => {
    setAudioEnabled(!audioEnabled);
  };

  const handleToggleMockMode = () => {
    setMockMode(!mockMode);
  };

  const handleResetSession = () => {
    setSessionId('test-session-' + Math.random().toString(36).substring(2, 10));
    setMessages([]);
  };

  return (
    <div className="voice-interface-test">
      <h2>Voice Interface Test</h2>
      
      <div className="test-controls">
        <div className="control-group">
          <h3>Backend Status</h3>
          {backendStatus.checked ? (
            <div className="status-indicators">
              <div className={`status-indicator ${backendStatus.healthy ? 'status-ok' : 'status-error'}`}>
                Server Health: {backendStatus.healthy ? 'OK' : 'Error'}
              </div>
              <div className={`status-indicator ${backendStatus.ml_packages_available ? 'status-ok' : 'status-error'}`}>
                ML Packages: {backendStatus.ml_packages_available ? 'Available' : 'Unavailable'}
              </div>
            </div>
          ) : (
            <div>Checking backend status...</div>
          )}
        </div>

        <div className="control-group">
          <h3>Test Controls</h3>
          <div className="controls">
            <div className="control">
              <button 
                className={`toggle-button ${visible ? 'active' : ''}`} 
                onClick={handleToggleVisibility}
              >
                {visible ? 'Hide Voice Interface' : 'Show Voice Interface'}
              </button>
            </div>
            
            <div className="control">
              <button 
                className={`toggle-button ${audioEnabled ? 'active' : ''}`} 
                onClick={handleToggleAudio}
              >
                {audioEnabled ? 'Disable Audio' : 'Enable Audio'}
              </button>
            </div>
            
            <div className="control">
              <button 
                className={`toggle-button ${mockMode ? 'active' : ''}`} 
                onClick={handleToggleMockMode}
              >
                {mockMode ? 'Use Real Backend' : 'Use Mock Mode'}
              </button>
            </div>
            
            <div className="control">
              <button className="reset-button" onClick={handleResetSession}>
                Reset Session
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="voice-interface-container">
        {visible && (
          <VoiceInterface
            sessionId={sessionId}
            onSendMessage={handleSendMessage}
            visible={visible}
            audioEnabled={audioEnabled}
          />
        )}
      </div>
      
      <div className="messages-log">
        <h3>Messages Log</h3>
        <div className="messages-container">
          {messages.length === 0 ? (
            <p className="no-messages">No messages yet. Try speaking to the voice interface.</p>
          ) : (
            messages.map(message => (
              <div 
                key={message.id} 
                className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
              >
                <div className="message-sender">{message.sender === 'user' ? 'You' : 'Virgil'}</div>
                <div className="message-text">{message.text}</div>
                <div className="message-time">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="session-info">
        <h3>Session Information</h3>
        <p><strong>Session ID:</strong> {sessionId}</p>
        <p><strong>Mock Mode:</strong> {mockMode ? 'Enabled' : 'Disabled'}</p>
        <p><strong>Audio:</strong> {audioEnabled ? 'Enabled' : 'Disabled'}</p>
      </div>
    </div>
  );
};

export default VoiceInterfaceTest; 