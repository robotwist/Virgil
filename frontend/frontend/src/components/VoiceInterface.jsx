import React, { useState, useRef, useEffect } from 'react';
import '../styles/VoiceInterface.css';

// The API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';
// Convert http(s) to ws(s) for WebSocket connection
const WS_URL = API_URL.replace(/^http/, 'ws');

const VoiceInterface = ({ onSendMessage, isProcessing, lastResponse }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechRecognition, setIsSpeechRecognition] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const speechRecognitionRef = useRef(null);
  const [transcript, setTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [capabilitiesChecked, setCapabilitiesChecked] = useState(false);
  const [browserSupported, setBrowserSupported] = useState(true);
  
  const audioContext = useRef(null);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const websocket = useRef(null);
  const animationFrame = useRef(null);
  const audioAnalyser = useRef(null);
  const audioDataArray = useRef(null);
  const audioStreamRef = useRef(null);
  const audioElRef = useRef(null);
  const ttsUtteranceRef = useRef(null);
    // Speak text using browser TTS
    const speakText = (text) => {
      if (!window.speechSynthesis) {
        setErrorMessage('Text-to-speech not supported in this browser.');
        return;
      }
      if (ttsUtteranceRef.current) {
        window.speechSynthesis.cancel();
        ttsUtteranceRef.current = null;
      }
      const utterance = new window.SpeechSynthesisUtterance(text);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        ttsUtteranceRef.current = null;
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setErrorMessage('Error with text-to-speech.');
        ttsUtteranceRef.current = null;
      };
      ttsUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };

    // Stop browser TTS
    const stopTTS = () => {
      if (window.speechSynthesis && ttsUtteranceRef.current) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        ttsUtteranceRef.current = null;
      }
    };
  
  // Check if browser supports required APIs
  useEffect(() => {
    const isSupported = !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.MediaRecorder &&
      window.AudioContext
    );
    // Check for Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);
    setBrowserSupported(isSupported || !!SpeechRecognition);
    setCapabilitiesChecked(true);
    if (!isSupported && !SpeechRecognition) {
      setErrorMessage('Your browser does not support the required audio features.');
      return;
    }
    // Initialize audio context
    try {
      if (isSupported) {
        audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      // Create an audio element for playback
      if (!audioElRef.current) {
        audioElRef.current = new Audio();
        audioElRef.current.onplay = () => setIsSpeaking(true);
        audioElRef.current.onended = () => setIsSpeaking(false);
        audioElRef.current.onpause = () => setIsSpeaking(false);
        audioElRef.current.onerror = () => {
          setIsSpeaking(false);
          setErrorMessage('Error playing audio response');
        };
      }
      // Check if WebSocket is supported
      if (isSupported && window.WebSocket) {
        connectWebSocket();
      }
    } catch (e) {
      console.error('Error initializing audio systems:', e);
      setErrorMessage('Could not initialize audio systems: ' + e.message);
    }
    return () => {
      // Cleanup on unmount
      disconnectWebSocket();
      cleanupAudio();
      if (audioContext.current && audioContext.current.state !== 'closed') {
        audioContext.current.close();
      }
    };
  }, []);
  
  // Function to connect WebSocket
  const connectWebSocket = () => {
    if (isConnecting || isConnected) return;
    
    try {
      setIsConnecting(true);
      setErrorMessage('');
      
      // Get session ID from localStorage or generate a new one
      const sessionId = localStorage.getItem('virgilSessionId') || 'new-session';
      const wsUrl = `${WS_URL}/ws/audio/${sessionId}`;
      
      console.log('Connecting to WebSocket:', wsUrl);
      
      websocket.current = new WebSocket(wsUrl);
      
      websocket.current.onopen = () => {
        console.log('WebSocket connection established');
        setIsConnected(true);
        setIsConnecting(false);
        setErrorMessage('');
      };
      
      websocket.current.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        
        if (event.code !== 1000) {
          // Not a normal closure
          setErrorMessage('Voice connection lost. Please try again.');
          
          // Try to reconnect after a delay
          setTimeout(() => {
            if (!isConnected && !isConnecting) {
              connectWebSocket();
            }
          }, 3000);
        }
      };
      
      websocket.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
        setIsConnecting(false);
        setErrorMessage('Error connecting to voice service.');
      };
      
      websocket.current.onmessage = handleWebSocketMessage;
      
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      setIsConnecting(false);
      setErrorMessage('Failed to connect to voice service: ' + error.message);
    }
  };
  
  // Handle incoming WebSocket messages
  const handleWebSocketMessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('Received WebSocket message:', data.type);
      
      switch (data.type) {
        case 'status':
          // Status updates
          if (data.status === 'processing') {
            // Server is processing audio
            console.log('Server processing audio...');
          }
          break;
          
        case 'response':
          // Complete response with transcription, text response, and audio
          console.log(`Transcription: ${data.transcription}`);
          console.log(`Response: ${data.response}`);
          console.log(`Processing times: ${JSON.stringify(data.processing_time)}`);
          
          // Update transcript
          setTranscript(data.transcription);
          
          // Send message to parent component
          if (onSendMessage) {
            onSendMessage(data.transcription);
          }
          
          // Play audio response if available
          if (data.audio && data.sample_rate) {
            playAudioResponse(data.audio, data.sample_rate);
          }
          break;
          
        case 'error':
          // Error message
          console.error('WebSocket error from server:', data.error);
          setErrorMessage(data.error || 'Error processing voice command');
          break;
          
        case 'command':
          // Command response
          console.log('Command response:', data);
          break;
          
        default:
          console.warn('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  };
  
  // Disconnect WebSocket
  const disconnectWebSocket = () => {
    if (websocket.current) {
      websocket.current.close();
      websocket.current = null;
    }
  };
  
  // Clean up audio resources
  const cleanupAudio = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    }
  };
  
  // Start recording audio or speech recognition
  const startRecording = async () => {
    setErrorMessage('');
    // Prefer WebSocket/MediaRecorder if available and connected
    if (isConnected && browserSupported) {
      if (isRecording) return;
      try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;
        // Set up audio analyzer for visualization
        const source = audioContext.current.createMediaStreamSource(stream);
        audioAnalyser.current = audioContext.current.createAnalyser();
        audioAnalyser.current.fftSize = 256;
        source.connect(audioAnalyser.current);
        audioDataArray.current = new Uint8Array(audioAnalyser.current.frequencyBinCount);
        updateAudioVisualization();
        // Create media recorder
        mediaRecorder.current = new MediaRecorder(stream);
        audioChunks.current = [];
        mediaRecorder.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.current.push(event.data);
          }
        };
        mediaRecorder.current.onstop = async () => {
          // Create audio blob from chunks
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
          // Send audio data to WebSocket if connected
          if (websocket.current && websocket.current.readyState === WebSocket.OPEN) {
            try {
              const arrayBuffer = await audioBlob.arrayBuffer();
              websocket.current.send(arrayBuffer);
            } catch (error) {
              console.error('Error sending audio data:', error);
              setErrorMessage('Error sending voice data.');
            }
          } else {
            setErrorMessage('Voice service connection lost. Please try again.');
            connectWebSocket();
          }
          // Clean up audio resources
          cleanupAudio();
        };
        // Start recording
        mediaRecorder.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error starting recording:', error);
        if (error.name === 'NotAllowedError') {
          setErrorMessage('Microphone access denied. Please allow microphone access and try again.');
        } else {
          setErrorMessage('Could not start recording: ' + error.message);
        }
        cleanupAudio();
      }
    } else if (speechSupported) {
      // Use browser speech recognition as fallback
      if (isSpeechRecognition) return;
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
          setErrorMessage('Speech recognition not supported in this browser.');
          return;
        }
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.onstart = () => {
          setIsSpeechRecognition(true);
        };
        recognition.onerror = (event) => {
          setErrorMessage('Speech recognition error: ' + event.error);
          setIsSpeechRecognition(false);
        };
        recognition.onend = () => {
          setIsSpeechRecognition(false);
        };
        recognition.onresult = (event) => {
          const result = event.results[0][0].transcript;
          setTranscript(result);
          if (onSendMessage) {
            onSendMessage(result);
          }
          setIsSpeechRecognition(false);
        };
        speechRecognitionRef.current = recognition;
        recognition.start();
      } catch (error) {
        setErrorMessage('Could not start speech recognition: ' + error.message);
      }
    } else {
      setErrorMessage('No supported voice input method available.');
    }
  };
  
  // Stop recording or speech recognition
  const stopRecording = () => {
    if (isRecording) {
      if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
        mediaRecorder.current.stop();
      }
      setIsRecording(false);
    }
    if (isSpeechRecognition && speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      setIsSpeechRecognition(false);
    }
  };
  
  // Update audio visualization
  const updateAudioVisualization = () => {
    if (audioAnalyser.current && audioDataArray.current && isRecording) {
      audioAnalyser.current.getByteFrequencyData(audioDataArray.current);
      
      // Calculate average level
      const average = audioDataArray.current.reduce((acc, val) => acc + val, 0) / 
                     audioDataArray.current.length;
      
      // Update audio level (0-100)
      setAudioLevel(Math.min(100, average * 100 / 256));
      
      // Continue animation
      animationFrame.current = requestAnimationFrame(updateAudioVisualization);
    }
  };
  
  // Play audio response from base64 string
  const playAudioResponse = (audioBase64, sampleRate) => {
    try {
      // Decode base64 to array buffer
      const binaryString = atob(audioBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // If we have a valid audio element, use it for playback
      if (audioElRef.current) {
        // Create blob URL
        const blob = new Blob([bytes.buffer], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        
        // Set audio source and play
        audioElRef.current.src = url;
        audioElRef.current.play().catch(error => {
          console.error('Error playing audio:', error);
          setErrorMessage('Could not play audio response.');
        });
        
        // Clean up blob URL when done
        audioElRef.current.onended = () => {
          URL.revokeObjectURL(url);
          setIsSpeaking(false);
        };
      } else {
        // Fallback to AudioContext API if audio element not available
        audioContext.current.decodeAudioData(bytes.buffer, (buffer) => {
          const source = audioContext.current.createBufferSource();
          source.buffer = buffer;
          source.connect(audioContext.current.destination);
          source.start(0);
          
          setIsSpeaking(true);
          source.onended = () => setIsSpeaking(false);
        }, (error) => {
          console.error('Error decoding audio data:', error);
          setErrorMessage('Error playing audio response.');
        });
      }
    } catch (error) {
      console.error('Error playing audio response:', error);
      setErrorMessage('Error playing voice response.');
    }
  };
  
  // Stop audio playback
  const stopSpeaking = () => {
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
  };
  
  // If capabilities check is still pending, show loading state
  if (!capabilitiesChecked) {
    return <div className="voice-interface loading">Initializing voice capabilities...</div>;
  }
  
  // If browser doesn't support required APIs, show error
  if (!browserSupported) {
    return (
      <div className="voice-interface unsupported">
        <p>Your browser doesn't support voice features.</p>
      </div>
    );
  }
  
  return (
    <div className="voice-interface">
      <div className="voice-visualizer">
        {Array.from({ length: 10 }).map((_, index) => (
          <div 
            key={index} 
            className="visualizer-bar"
            style={{ 
              height: isRecording ? `${Math.max(2, audioLevel * (index + 1) / 10)}px` : '2px'
            }}
          />
        ))}
      </div>
      
      <div className="voice-controls">
        <button 
          className={`voice-button ${(isRecording || isSpeechRecognition) ? 'recording' : ''} ${isSpeaking ? 'disabled' : ''}`}
          onClick={(isRecording || isSpeechRecognition) ? stopRecording : startRecording}
          disabled={isProcessing || isSpeaking}
        >
          {(isRecording || isSpeechRecognition) ? 'Stop' : 'Speak'}
          <span className="voice-icon">🎤</span>
        </button>
        
        {isSpeaking && (
          <button className="stop-button" onClick={() => { stopSpeaking(); stopTTS(); }}>
            Stop Audio
          </button>
        )}
        {!isSpeaking && lastResponse && (
          <button className="tts-button" onClick={() => speakText(lastResponse)}>
            Read Aloud
          </button>
        )}
      </div>
      
      {errorMessage && (
        <div className="voice-error">{errorMessage}</div>
      )}
      
      {!isConnected && !errorMessage && (
        <div className="connection-status">
          {isConnecting ? 'Connecting to voice service...' : 'Not connected to voice service.'}
        </div>
      )}
      
      {transcript && !isRecording && (
        <div className="transcript">"{transcript}"</div>
      )}
    </div>
  );
};

export default VoiceInterface; 