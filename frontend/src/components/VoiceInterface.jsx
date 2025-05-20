import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMicrophone, FaMicrophoneSlash, FaPlay, FaStop, FaVolumeUp } from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import styled from 'styled-components';

// Styled components for the voice interface
const VoiceContainer = styled.div`
  background: linear-gradient(135deg, #0a1f44 0%, #0f2e5c 100%);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  max-width: 800px;
  margin: 0 auto;
  color: #f0f4f8;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  background: linear-gradient(90deg, #f0f4f8 0%, #6FADE9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Status = styled.div`
  display: flex;
  align-items: center;
  font-size: 14px;
  color: ${props => props.isConnected ? '#4ade80' : '#f87171'};
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.isConnected ? '#4ade80' : '#f87171'};
  margin-right: 8px;
`;

const ControlsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 16px;
`;

const IconButton = styled(motion.button)`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.primary ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)'};
  border: none;
  cursor: pointer;
  color: #f0f4f8;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const WaveformContainer = styled.div`
  height: 100px;
  width: 100%;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  margin: 24px 0;
  overflow: hidden;
  position: relative;
`;

const Waveform = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
`;

const WaveBar = styled(motion.div)`
  width: 4px;
  background-color: #60a5fa;
  border-radius: 4px;
  margin: 0 2px;
`;

const ConversationContainer = styled.div`
  background-color: rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  padding: 16px;
  max-height: 300px;
  overflow-y: auto;
  margin-top: 24px;

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

const MessageBubble = styled.div`
  padding: 12px 16px;
  border-radius: 12px;
  margin-bottom: 12px;
  max-width: 80%;
  
  background-color: ${props => props.isUser ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
  align-self: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  margin-left: ${props => props.isUser ? 'auto' : '0'};
  border-bottom-right-radius: ${props => props.isUser ? '4px' : '12px'};
  border-bottom-left-radius: ${props => !props.isUser ? '4px' : '12px'};
`;

const MessageText = styled.p`
  margin: 0;
  font-size: 15px;
  line-height: 1.5;
`;

const ConversationWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const TextInputContainer = styled.div`
  display: flex;
  margin-top: 24px;
  gap: 12px;
`;

const TextInput = styled.input`
  flex-grow: 1;
  background-color: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px 16px;
  color: #f0f4f8;
  font-size: 15px;
  outline: none;
  transition: all 0.2s ease;
  
  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`;

const SendButton = styled(motion.button)`
  background-color: #3b82f6;
  border: none;
  border-radius: 8px;
  padding: 0 20px;
  color: white;
  font-weight: 500;
  cursor: pointer;
`;

// Audio visualization constants
const NUM_BARS = 30;
const MAX_BAR_HEIGHT = 60;

const VoiceInterface = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [audioVisualization, setAudioVisualization] = useState(
    Array(NUM_BARS).fill(0).map(() => Math.random() * 0.2)
  );
  
  const websocket = useRef(null);
  const mediaRecorder = useRef(null);
  const audioContext = useRef(null);
  const analyser = useRef(null);
  const audioChunks = useRef([]);
  const audioPlayer = useRef(new Audio());
  const conversationRef = useRef(null);
  
  // Generate a new session ID on component mount
  useEffect(() => {
    setSessionId(generateSessionId());
  }, []);

  // Auto-scroll to the most recent message
  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [conversation]);

  // WebSocket connection
  const connectWebSocket = () => {
    try {
      console.log(`Connecting to WebSocket: ws://localhost:8000/ws/audio/${sessionId}`);
      websocket.current = new WebSocket(`ws://localhost:8000/ws/audio/${sessionId}`);
      
      websocket.current.onopen = () => {
        setIsConnected(true);
        console.log('WebSocket connection established');
        addMessage('system', 'Connected to Virgil voice service. You can start speaking now.');
      };
      
      websocket.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        
        if (data.type === 'response') {
          setIsProcessing(false);
          
          // Add the transcription and response to the conversation
          if (data.transcription) {
            addMessage('user', data.transcription);
          }
          addMessage('assistant', data.response);
          
          // Play audio response if available
          if (data.audio) {
            playAudioResponse(data.audio);
          }
        } else if (data.type === 'status') {
          console.log(`Status: ${data.status} - ${data.message}`);
          
          if (data.status === 'processing') {
            setIsProcessing(true);
          }
        } else if (data.type === 'error') {
          console.error('WebSocket error:', data.error);
          addMessage('system', `Error: ${data.error}`);
          setIsProcessing(false);
        }
      };
      
      websocket.current.onclose = (event) => {
        console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
        setIsConnected(false);
        
        // Try to reconnect after 2 seconds
        setTimeout(() => {
          if (sessionId) {
            connectWebSocket();
          }
        }, 2000);
      };
      
      websocket.current.onerror = (event) => {
        console.log('WebSocket error:', event);
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
    }
  };
  
  // Connect to WebSocket when sessionId is available
  useEffect(() => {
    if (sessionId && !websocket.current) {
      connectWebSocket();
    }
    
    return () => {
      if (websocket.current) {
        websocket.current.close();
      }
    };
  }, [sessionId]);
  
  // Start recording
  const startRecording = async () => {
    try {
      if (!isConnected) {
        console.log('Not connected to server. Trying to connect...');
        connectWebSocket();
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio context and analyser for visualization
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
      analyser.current = audioContext.current.createAnalyser();
      const source = audioContext.current.createMediaStreamSource(stream);
      source.connect(analyser.current);
      
      analyser.current.fftSize = 256;
      const bufferLength = analyser.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      // Update audio visualization
      const updateVisualization = () => {
        if (!isRecording) return;
        
        analyser.current.getByteFrequencyData(dataArray);
        
        // Create normalized bars for visualization
        const bars = Array(NUM_BARS).fill(0).map((_, i) => {
          const index = Math.floor(i * (bufferLength / NUM_BARS));
          const value = dataArray[index] / 255.0; // Normalize to 0-1
          return value;
        });
        
        setAudioVisualization(bars);
        requestAnimationFrame(updateVisualization);
      };
      
      // Set up MediaRecorder
      mediaRecorder.current = new MediaRecorder(stream);
      
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };
      
      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        audioChunks.current = [];
        
        if (websocket.current && websocket.current.readyState === WebSocket.OPEN) {
          setIsProcessing(true);
          websocket.current.send(audioBlob);
        } else {
          console.error('WebSocket not connected');
          addMessage('system', 'Error: WebSocket connection lost. Trying to reconnect...');
          connectWebSocket();
        }
      };
      
      // Start recording
      mediaRecorder.current.start(100);
      setIsRecording(true);
      updateVisualization();
      
    } catch (error) {
      console.error('Error starting recording:', error);
      addMessage('system', `Error starting recording: ${error.message}`);
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      
      // Reset visualization
      setAudioVisualization(Array(NUM_BARS).fill(0).map(() => Math.random() * 0.2));
      
      // Close audio tracks
      if (mediaRecorder.current.stream) {
        mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      }
    }
  };
  
  // Play audio response
  const playAudioResponse = (audioBase64) => {
    const audioData = base64ToBlob(audioBase64, 'audio/wav');
    const audioUrl = URL.createObjectURL(audioData);
    
    audioPlayer.current.src = audioUrl;
    audioPlayer.current.onplay = () => setIsPlaying(true);
    audioPlayer.current.onended = () => setIsPlaying(false);
    audioPlayer.current.play().catch(error => {
      console.error('Error playing audio:', error);
    });
  };
  
  // Stop audio playback
  const stopAudio = () => {
    if (audioPlayer.current) {
      audioPlayer.current.pause();
      audioPlayer.current.currentTime = 0;
      setIsPlaying(false);
    }
  };
  
  // Send text message
  const sendTextMessage = () => {
    if (!textInput.trim() || !isConnected) return;
    
    addMessage('user', textInput);
    
    if (websocket.current && websocket.current.readyState === WebSocket.OPEN) {
      setIsProcessing(true);
      websocket.current.send(JSON.stringify({
        type: 'text',
        text: textInput
      }));
      setTextInput('');
    } else {
      console.error('WebSocket not connected');
      addMessage('system', 'Error: WebSocket connection lost. Trying to reconnect...');
      connectWebSocket();
    }
  };
  
  // Add message to conversation
  const addMessage = (role, content) => {
    setConversation(prev => [...prev, { role, content, timestamp: new Date() }]);
  };
  
  // Generate a random session ID
  const generateSessionId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };
  
  // Convert base64 to Blob
  const base64ToBlob = (base64, mimeType) => {
    const byteCharacters = atob(base64);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    return new Blob(byteArrays, { type: mimeType });
  };
  
  // Handle key press for text input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendTextMessage();
    }
  };
  
  return (
    <VoiceContainer>
      <Header>
        <Title>Virgil Voice Assistant</Title>
        <Status isConnected={isConnected}>
          <StatusDot isConnected={isConnected} />
          {isConnected ? 'Connected' : 'Disconnected'}
        </Status>
      </Header>
      
      <ControlsContainer>
        <WaveformContainer>
          <Waveform>
            {audioVisualization.map((height, index) => (
              <WaveBar
                key={index}
                initial={{ height: 4 }}
                animate={{ 
                  height: isRecording 
                    ? Math.max(4, height * MAX_BAR_HEIGHT) 
                    : Math.max(4, height * 15)
                }}
                transition={{ 
                  duration: 0.1,
                  ease: "easeOut"
                }}
              />
            ))}
          </Waveform>
        </WaveformContainer>
        
        <ButtonRow>
          <IconButton
            primary
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {isRecording ? <FaMicrophoneSlash size={20} /> : <FaMicrophone size={20} />}
          </IconButton>
          
          {isPlaying ? (
            <IconButton
              onClick={stopAudio}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaStop size={18} />
            </IconButton>
          ) : (
            <IconButton
              onClick={() => audioPlayer.current.play()}
              disabled={!audioPlayer.current.src}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaPlay size={18} />
            </IconButton>
          )}
        </ButtonRow>
        
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ marginTop: 16, display: 'flex', alignItems: 'center' }}
          >
            <AiOutlineLoading3Quarters 
              size={18} 
              style={{ marginRight: 8, animation: 'spin 1s linear infinite' }} 
            />
            Processing your request...
          </motion.div>
        )}
      </ControlsContainer>
      
      <ConversationContainer ref={conversationRef}>
        <ConversationWrapper>
          {conversation.map((message, index) => (
            <MessageBubble 
              key={index} 
              isUser={message.role === 'user'}
            >
              {message.role === 'system' && (
                <div style={{ 
                  color: '#94a3b8', 
                  fontSize: '12px', 
                  marginBottom: '4px',
                  fontStyle: 'italic'
                }}>
                  System Message
                </div>
              )}
              {message.role === 'assistant' && (
                <div style={{ 
                  color: '#94a3b8', 
                  fontSize: '12px', 
                  marginBottom: '4px' 
                }}>
                  Virgil
                </div>
              )}
              <MessageText>{message.content}</MessageText>
            </MessageBubble>
          ))}
        </ConversationWrapper>
      </ConversationContainer>
      
      <TextInputContainer>
        <TextInput
          type="text"
          placeholder="Type your message here..."
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={!isConnected || isProcessing}
        />
        <SendButton
          onClick={sendTextMessage}
          disabled={!isConnected || isProcessing || !textInput.trim()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Send
        </SendButton>
      </TextInputContainer>
      
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </VoiceContainer>
  );
};

export default VoiceInterface; 