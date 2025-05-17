import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/InputBox.css';
import ToneSelector from './ToneSelector';
import VoiceInterface from './VoiceInterface';

// Get API URL from environment variable, fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const InputBox = ({ username }) => {
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tone, setTone] = useState('default');
  const [lastResponse, setLastResponse] = useState('');

  // Load session ID from localStorage if available
  useEffect(() => {
    const savedSessionId = localStorage.getItem('virgilSessionId');
    if (savedSessionId) {
      setSessionId(savedSessionId);
    }
    
    // Load last used tone if available
    const savedTone = localStorage.getItem('virgilTone');
    if (savedTone) {
      setTone(savedTone);
    }
  }, []);

  const handleToneChange = (newTone) => {
    setTone(newTone);
    localStorage.setItem('virgilTone', newTone);
  };

  const sendMessage = async (messageText) => {
    if (!messageText.trim()) return;
    
    setIsLoading(true);
    
    // Add user message to chat
    const userMessage = { type: 'user', content: messageText };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    
    try {
      // Simplified API call without authentication headers
      const res = await axios.post(`${API_URL}/guide`, { 
        message: messageText,
        session_id: sessionId,
        tone: tone,
        username: username || 'guest' // Send username if available
      });
      
      // Save the session ID for future requests
      if (res.data.session_id && res.data.session_id !== sessionId) {
        setSessionId(res.data.session_id);
        localStorage.setItem('virgilSessionId', res.data.session_id);
      }
      
      // Add assistant response to chat
      const assistantMessage = { type: 'assistant', content: res.data.reply };
      setMessages(prevMessages => [...prevMessages, assistantMessage]);
      setLastResponse(res.data.reply);
      
      setInput('');
    } catch (err) {
      console.error(err);
      setMessages(prevMessages => [
        ...prevMessages, 
        { type: 'error', content: 'Sorry, I had trouble processing your request.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleVoiceMessage = (message) => {
    sendMessage(message);
  };

  return (
    <div className="input-box">
      <ToneSelector currentTone={tone} onToneChange={handleToneChange} />
      
      <div className="message-container">
        {messages.length === 0 && (
          <div className="welcome-message">
            <h3>Welcome to Virgil</h3>
            <p>Your AI-powered real-time guide. Ask me anything!</p>
            {username && <p>Hello, {username}! How can I assist you today?</p>}
          </div>
        )}
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.type}`}>
            {msg.content}
          </div>
        ))}
      </div>
      
      <VoiceInterface 
        onSendMessage={handleVoiceMessage} 
        isProcessing={isLoading}
        lastResponse={lastResponse}
      />
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Virgil..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? 'Thinking...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default InputBox;
