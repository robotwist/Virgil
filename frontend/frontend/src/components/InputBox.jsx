import React, { useState, useEffect, useRef } from 'react';
import '../styles/InputBox.css';
import ToneSelector from './ToneSelector';
import VoiceInterface from './VoiceInterface';

const InputBox = ({ sendMessage, isLoading, messages, tone, setTone, lastResponse }) => {
    const [input, setInput] = useState('');
    const [rows, setRows] = useState(1);
    const [sessionId, setSessionId] = useState(null);
    const [responseTime, setResponseTime] = useState(0);
    const messageCount = useRef(0);
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const textareaRef = useRef(null);
    
    // Load session ID from localStorage if available
    useEffect(() => {
        const storedSessionId = localStorage.getItem('virgil_session_id');
        if (storedSessionId) {
            setSessionId(storedSessionId);
        } else {
            // Generate a new session ID if none exists
            const newSessionId = `session_${Date.now()}`;
            localStorage.setItem('virgil_session_id', newSessionId);
            setSessionId(newSessionId);
        }
    }, []);
    
    // Calculate response time for the last message
    useEffect(() => {
        if (messages.length > 0 && messages.length > messageCount.current) {
            const lastMessage = messages[messages.length - 1];
            
            if (lastMessage.role === 'assistant' && lastMessage.responseTime) {
                setResponseTime(lastMessage.responseTime);
                messageCount.current = messages.length;
            }
        }
    }, [messages]);
    
    // Auto-resize textarea as content grows
    useEffect(() => {
        if (textareaRef.current) {
            // Reset height to auto to get the correct scrollHeight
            textareaRef.current.style.height = 'auto';
            
            // Calculate new height based on scrollHeight (clamped between 35px and 150px)
            const newHeight = Math.min(Math.max(textareaRef.current.scrollHeight, 35), 150);
            
            // Apply the new height
            textareaRef.current.style.height = `${newHeight}px`;
            
            // Update rows state based on content
            const lines = (input.match(/\n/g) || []).length + 1;
            setRows(Math.min(lines, 5));
        }
    }, [input]);
    
    const handleToneChange = (newTone) => {
        setTone(newTone);
    };
    
    // Handle submit when Enter key is pressed (unless Shift is held)
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey && input.trim()) {
            e.preventDefault();
            handleSubmit();
        }
    };
    
    // Submit the message
    const handleSubmit = () => {
        if (input.trim() && !isLoading) {
            sendMessage(input);
            setInput('');
            
            // Reset textarea height
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };
    
    // Handler for receiving transcribed text from VoiceInterface
    const handleVoiceInput = (transcript) => {
        if (transcript && transcript.trim()) {
            // Submit the transcribed message
            sendMessage(transcript.trim());
        }
    };
    
    // Toggle voice interface
    const toggleVoiceInterface = () => {
        setVoiceEnabled(!voiceEnabled);
    };
    
    return (
        <div className="input-container">
            {voiceEnabled && (
                <VoiceInterface 
                    onSendMessage={handleVoiceInput}
                    isProcessing={isLoading}
                    lastResponse={lastResponse}
                />
            )}
            
            <div className="input-box">
                <div className="input-box-header">
                    <ToneSelector currentTone={tone} onToneChange={handleToneChange} />
                    {messages.length > 0 && (
                        <div className="response-time">
                            Last response: {responseTime.toFixed(2)}s
                        </div>
                    )}
                </div>
                
                <div className="input-area">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Send a message..."
                        rows={rows}
                        disabled={isLoading}
                    />
                    
                    <div className="input-buttons">
                        <button 
                            className="voice-toggle-button"
                            onClick={toggleVoiceInterface}
                            title={voiceEnabled ? "Disable voice interface" : "Enable voice interface"}
                        >
                            {voiceEnabled ? '🎤' : '🔇'}
                        </button>
                        
                        <button
                            className={`send-button ${isLoading ? 'disabled' : ''} ${!input.trim() ? 'empty' : ''}`}
                            onClick={handleSubmit}
                            disabled={isLoading || !input.trim()}
                        >
                            {isLoading ? (
                                <span className="loading-indicator">●●●</span>
                            ) : (
                                <span className="send-icon">➤</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InputBox;
