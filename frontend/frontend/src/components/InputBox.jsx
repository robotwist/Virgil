import React, { useState, useEffect, useRef } from 'react';
import '../styles/InputBox.css';
import ToneSelector from './ToneSelector';

const InputBox = ({ sendMessage, isLoading, messages, tone, setTone, lastResponse }) => {
        const [reminderText, setReminderText] = useState('');
        const [reminderTime, setReminderTime] = useState('');
        const [reminderStatus, setReminderStatus] = useState('');
        // Schedule a reminder
        const handleScheduleReminder = async () => {
            if (!reminderText.trim() || !reminderTime) return;
            setReminderStatus('Scheduling...');
            try {
                const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/reminder', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: reminderText, remind_at: reminderTime })
                });
                if (res.ok) {
                    setReminderStatus('Reminder scheduled!');
                    setReminderText('');
                    setReminderTime('');
                } else {
                    setReminderStatus('Failed to schedule reminder.');
                }
            } catch (e) {
                setReminderStatus('Error scheduling reminder.');
            }
            setTimeout(() => setReminderStatus(''), 3000);
        };
    const [input, setInput] = useState('');
    const [rows, setRows] = useState(1);
    const [sessionId, setSessionId] = useState(null);
    const [responseTime, setResponseTime] = useState(0);
    const messageCount = useRef(0);
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
            
            if (lastMessage.type === 'assistant' && lastMessage.responseTime) {
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
    
    const handleChangeTone = (newTone) => {
        setTone(newTone);
    };
    
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };
    
    const handleSendMessage = () => {
        if (input.trim() === '') return;
        sendMessage(input);
        setInput('');
        
        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };
    
    return (
        <div className="input-container">
            <div className="input-box">
                <div className="input-box-header">
                    <ToneSelector currentTone={tone} onToneChange={handleChangeTone} />
                    {messages.length > 0 && (
                        <button className="clear-button" onClick={() => window.location.reload()}>
                            New Chat
                        </button>
                    )}
                </div>
                {responseTime > 0 && <div className="response-time">Response time: {responseTime.toFixed(2)}s</div>}
                <div className="input-area">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message..."
                        rows={rows}
                        disabled={isLoading}
                    />
                    <div className="input-buttons">
                        <button
                            className={`send-button ${isLoading ? 'disabled' : ''} ${!input.trim() ? 'empty' : ''}`}
                            onClick={handleSendMessage}
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
                {/* Reminder scheduling UI */}
                <div className="reminder-scheduler">
                    <input
                        type="text"
                        placeholder="Reminder message..."
                        value={reminderText}
                        onChange={e => setReminderText(e.target.value)}
                        disabled={isLoading}
                    />
                    <input
                        type="datetime-local"
                        value={reminderTime}
                        onChange={e => setReminderTime(e.target.value)}
                        disabled={isLoading}
                    />
                    <button
                        className="reminder-button"
                        onClick={handleScheduleReminder}
                        disabled={isLoading || !reminderText.trim() || !reminderTime}
                    >
                        Set Reminder
                    </button>
                    {reminderStatus && <span className="reminder-status">{reminderStatus}</span>}
                </div>
            </div>
        </div>
    );
};

export default InputBox;
