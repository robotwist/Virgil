import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { FiSend, FiSettings, FiRefreshCw, FiClock, FiHelpCircle } from 'react-icons/fi';
import { IoMdPerson } from 'react-icons/io';
import { RiRobot2Fill } from 'react-icons/ri';
import { BsThreeDotsVertical } from 'react-icons/bs';

// Styled Components
const MessageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 1000px;
  margin: 0 auto;
  background: linear-gradient(135deg, #0a1f44 0%, #0f2e5c 100%);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  color: #f0f4f8;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: rgba(13, 40, 95, 0.7);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
`;

const Logo = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background-color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-weight: bold;
  font-size: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
`;

const HeaderInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  background: linear-gradient(90deg, #f0f4f8 0%, #93c5fd 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Subtitle = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 16px;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 18px;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.9);
  }
`;

const MessageList = styled.div`
  display: flex;
  flex-direction: column;
  padding: 24px;
  overflow-y: auto;
  flex-grow: 1;
  gap: 16px;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
  }
`;

const MessageBubble = styled(motion.div)`
  display: flex;
  align-items: flex-start;
  max-width: 80%;
  align-self: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  gap: 12px;
`;

const MessageAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: ${props => props.isUser ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.isUser ? '#93c5fd' : '#f0f4f8'};
  flex-shrink: 0;
`;

const MessageContent = styled.div`
  background-color: ${props => props.isUser ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
  padding: 12px 16px;
  border-radius: 12px;
  border-top-left-radius: ${props => !props.isUser ? '4px' : '12px'};
  border-top-right-radius: ${props => props.isUser ? '4px' : '12px'};
  font-size: 15px;
  line-height: 1.5;
  color: ${props => props.isUser ? '#e0f2fe' : '#f0f4f8'};
  position: relative;
  
  /* Code block styling */
  pre {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    padding: 12px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    overflow-x: auto;
    margin: 8px 0;
  }
  
  code {
    font-family: 'JetBrains Mono', monospace;
    background-color: rgba(0, 0, 0, 0.2);
    padding: 2px 4px;
    border-radius: 4px;
    font-size: 13px;
  }
`;

const MessageOptions = styled.div`
  position: absolute;
  top: 0;
  right: -28px;
  opacity: 0;
  transition: opacity 0.2s ease;
  
  ${MessageContent}:hover & {
    opacity: 1;
  }
`;

const OptionsButton = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const MessageTime = styled.div`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ThinkingIndicator = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.6);
  background-color: rgba(255, 255, 255, 0.1);
  padding: 12px 16px;
  border-radius: 12px;
  max-width: fit-content;
  font-size: 14px;
`;

const ThinkingDot = styled(motion.div)`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.7);
`;

const InputContainer = styled.div`
  padding: 16px 24px;
  background-color: rgba(13, 40, 95, 0.7);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 8px 16px;
  transition: all 0.2s ease;
  
  &:focus-within {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
  }
`;

const TextInput = styled.textarea`
  flex-grow: 1;
  background: none;
  border: none;
  color: #f0f4f8;
  font-size: 15px;
  outline: none;
  resize: none;
  min-height: 24px;
  max-height: 120px;
  padding: 4px 0;
  font-family: inherit;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`;

const SendButton = styled(motion.button)`
  background-color: #3b82f6;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  margin-left: 8px;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  
  &:disabled {
    background-color: rgba(59, 130, 246, 0.5);
    cursor: not-allowed;
  }
`;

const ToneSelector = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
  overflow-x: auto;
  padding-bottom: 4px;
  
  /* Hide scrollbar */
  -ms-overflow-style: none;
  scrollbar-width: none;
  
  &::-webkit-scrollbar {
    display: none;
  }
`;

const ToneButton = styled.button`
  background-color: ${props => props.selected ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
  border: 1px solid ${props => props.selected ? 'rgba(59, 130, 246, 0.5)' : 'transparent'};
  border-radius: 16px;
  padding: 6px 12px;
  font-size: 12px;
  color: ${props => props.selected ? '#93c5fd' : 'rgba(255, 255, 255, 0.7)'};
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(59, 130, 246, 0.2);
  }
`;

const MessageInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [selectedTone, setSelectedTone] = useState('default');
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const tones = [
    { id: 'default', name: 'Default' },
    { id: 'friendly', name: 'Friendly' },
    { id: 'professional', name: 'Professional' },
    { id: 'concise', name: 'Concise' },
    { id: 'academic', name: 'Academic' },
    { id: 'creative', name: 'Creative' }
  ];
  
  useEffect(() => {
    // Generate a session ID on component mount
    setSessionId(generateSessionId());
    
    // Add a welcome message
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Hello! I\'m Virgil, your AI-powered guide. How can I assist you today?',
        timestamp: new Date()
      }
    ]);
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const generateSessionId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };
  
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsThinking(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock response - in a real app, you'd call your backend API
      const response = {
        reply: `This is a simulated response to your message: "${inputText.trim()}"`,
        session_id: sessionId,
        response_time: 2.0
      };
      
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.reply,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: 'Sorry, there was an error processing your request. Please try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const formatTimestamp = (timestamp) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(timestamp);
  };
  
  const autoGrowTextArea = (e) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };
  
  return (
    <MessageContainer>
      <Header>
        <HeaderTitle>
          <Logo>V</Logo>
          <HeaderInfo>
            <Title>Virgil AI</Title>
            <Subtitle>Your intelligent assistant</Subtitle>
          </HeaderInfo>
        </HeaderTitle>
        <HeaderActions>
          <IconButton>
            <FiRefreshCw />
          </IconButton>
          <IconButton>
            <FiSettings />
          </IconButton>
          <IconButton>
            <FiHelpCircle />
          </IconButton>
        </HeaderActions>
      </Header>
      
      <MessageList>
        <AnimatePresence>
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              isUser={message.role === 'user'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <MessageAvatar isUser={message.role === 'user'}>
                {message.role === 'user' ? (
                  <IoMdPerson size={18} />
                ) : message.role === 'assistant' ? (
                  <RiRobot2Fill size={18} />
                ) : (
                  <FiHelpCircle size={18} />
                )}
              </MessageAvatar>
              
              <div>
                <MessageContent isUser={message.role === 'user'}>
                  {message.content}
                  
                  <MessageOptions>
                    <OptionsButton>
                      <BsThreeDotsVertical size={14} />
                    </OptionsButton>
                  </MessageOptions>
                </MessageContent>
                
                <MessageTime>
                  <FiClock size={10} />
                  {formatTimestamp(message.timestamp)}
                </MessageTime>
              </div>
            </MessageBubble>
          ))}
          
          {isThinking && (
            <MessageBubble
              isUser={false}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <MessageAvatar isUser={false}>
                <RiRobot2Fill size={18} />
              </MessageAvatar>
              
              <ThinkingIndicator>
                <span>Virgil is thinking</span>
                {[0, 1, 2].map((i) => (
                  <ThinkingDot
                    key={i}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.3,
                    }}
                  />
                ))}
              </ThinkingIndicator>
            </MessageBubble>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </MessageList>
      
      <InputContainer>
        <InputWrapper>
          <TextInput
            ref={inputRef}
            placeholder="Type your message here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={autoGrowTextArea}
            rows={1}
          />
          <SendButton
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isThinking}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiSend size={16} />
          </SendButton>
        </InputWrapper>
        
        <ToneSelector>
          {tones.map((tone) => (
            <ToneButton
              key={tone.id}
              selected={selectedTone === tone.id}
              onClick={() => setSelectedTone(tone.id)}
            >
              {tone.name}
            </ToneButton>
          ))}
        </ToneSelector>
      </InputContainer>
    </MessageContainer>
  );
};

export default MessageInterface; 