import React, { useState, useEffect, useRef } from 'react';
import '../styles/VoiceInterface.css';

const VoiceInterface = ({ onSendMessage, isProcessing, lastResponse }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const recognitionRef = useRef(null);
  const speechSynthesisRef = useRef(window.speechSynthesis);
  
  // Check if browser supports speech recognition and synthesis
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const speechSynthesis = window.speechSynthesis;
    
    if (SpeechRecognition && speechSynthesis) {
      setVoiceEnabled(true);
      
      // Initialize speech recognition
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        const current = event.resultIndex;
        const result = event.results[current];
        const transcriptText = result[0].transcript;
        setTranscript(transcriptText);
      };
      
      recognitionRef.current.onend = () => {
        if (isListening) {
          // If we're still in listening mode but recognition ended, restart it
          recognitionRef.current.start();
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel();
      }
    };
  }, []);
  
  // Handle toggling speech recognition
  const toggleListening = () => {
    if (!voiceEnabled) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      // If there's a transcript, send it as a message
      if (transcript.trim()) {
        onSendMessage(transcript.trim());
        setTranscript('');
      }
    } else {
      recognitionRef.current.start();
      setTranscript('');
    }
    
    setIsListening(!isListening);
  };

  // Speak text using speech synthesis
  const speak = (text) => {
    if (!voiceEnabled || !text) return;
    
    // Cancel any ongoing speech
    speechSynthesisRef.current.cancel();
    
    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Select a voice (optional)
    const voices = speechSynthesisRef.current.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.lang.includes('en') && voice.name.includes('Female')
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (err) => {
      console.error('Speech synthesis error', err);
      setIsSpeaking(false);
    };
    
    speechSynthesisRef.current.speak(utterance);
  };
  
  // Speak response when it changes
  useEffect(() => {
    if (lastResponse && !isProcessing) {
      speak(lastResponse);
    }
  }, [lastResponse, isProcessing]);
  
  // Stop speech synthesis
  const stopSpeaking = () => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  };
  
  if (!voiceEnabled) {
    return (
      <div className="voice-unsupported">
        <p>Voice interface is not supported in your browser.</p>
      </div>
    );
  }
  
  return (
    <div className="voice-interface">
      <div className="voice-controls">
        <button 
          className={`mic-button ${isListening ? 'listening' : ''}`} 
          onClick={toggleListening}
          disabled={isProcessing}
        >
          <span className="mic-icon">
            {isListening ? '🔴' : '🎤'}
          </span>
          {isListening ? 'Listening...' : 'Speak'}
        </button>
        
        {isSpeaking && (
          <button className="stop-button" onClick={stopSpeaking}>
            Stop Voice
          </button>
        )}
      </div>
      
      {isListening && (
        <div className="transcript-container">
          <p className="transcript">{transcript || 'Listening...'}</p>
          {transcript && (
            <button 
              className="send-transcript" 
              onClick={() => {
                onSendMessage(transcript.trim());
                setTranscript('');
                setIsListening(false);
                recognitionRef.current.stop();
              }}
            >
              Send
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceInterface; 