# Virgil Voice Components Guide

This documentation provides details about the voice interface components in the Virgil frontend application, including usage patterns, props, and integration examples.

## Table of Contents

1. [Component Overview](#component-overview)
2. [VoiceInterface Component](#voiceinterface-component)
3. [AudioRecorder Component](#audiorecorder-component)
4. [AudioPlayer Component](#audioplayer-component)
5. [Integration with InputBox](#integration-with-inputbox)
6. [Styling Voice Components](#styling-voice-components)
7. [Advanced Usage](#advanced-usage)
8. [Troubleshooting](#troubleshooting)

## Component Overview

The voice interface in Virgil consists of several React components:

- **VoiceInterface**: The main component that coordinates voice input/output
- **AudioRecorder**: Handles microphone recording and audio compression
- **AudioPlayer**: Manages playback of audio responses
- **VoiceToggle**: Controls visibility of voice interface elements

These components work together to provide a seamless voice interaction experience.

## VoiceInterface Component

### Props

| Prop | Type | Description |
|------|------|-------------|
| `sessionId` | `string` | Required. The unique session identifier |
| `onSendMessage` | `function` | Required. Callback when transcript is ready to send |
| `onStatusChange` | `function` | Optional. Callback for status updates |
| `visible` | `boolean` | Optional. Controls component visibility |
| `audioEnabled` | `boolean` | Optional. Enables/disables audio playback |

### Basic Usage

```jsx
import { VoiceInterface } from '../components/VoiceInterface';

function ChatComponent() {
  const [sessionId, setSessionId] = useState('user-123');
  
  const handleSendMessage = (message) => {
    console.log('Sending message:', message);
    // Process the transcribed message
  };
  
  return (
    <div className="chat-container">
      <VoiceInterface 
        sessionId={sessionId}
        onSendMessage={handleSendMessage}
        visible={true}
        audioEnabled={true}
      />
    </div>
  );
}
```

### States and Events

The VoiceInterface component has several internal states:

- `idle`: Ready for user interaction
- `listening`: Actively recording audio
- `processing`: Processing recorded audio
- `speaking`: Playing back the response
- `error`: An error has occurred

You can listen to these state changes using the `onStatusChange` prop.

## AudioRecorder Component

### Props

| Prop | Type | Description |
|------|------|-------------|
| `onAudioReady` | `function` | Required. Callback with audio blob |
| `onRecordingStateChange` | `function` | Optional. Tracks recording state |
| `maxRecordingTime` | `number` | Optional. Maximum recording duration in ms |

### Basic Usage

```jsx
import { AudioRecorder } from '../components/AudioRecorder';

function RecordingComponent() {
  const handleAudioReady = (audioBlob) => {
    // Process the recorded audio
  };
  
  return (
    <AudioRecorder 
      onAudioReady={handleAudioReady}
      maxRecordingTime={30000} // 30 seconds
    />
  );
}
```

## AudioPlayer Component

### Props

| Prop | Type | Description |
|------|------|-------------|
| `audioSrc` | `string` | Required. URL or base64 audio data |
| `autoPlay` | `boolean` | Optional. Auto-play when src changes |
| `onPlaybackComplete` | `function` | Optional. Callback on playback end |

### Basic Usage

```jsx
import { AudioPlayer } from '../components/AudioPlayer';

function PlayerComponent() {
  const [audioSrc, setAudioSrc] = useState(null);
  
  return (
    <AudioPlayer 
      audioSrc={audioSrc}
      autoPlay={true}
      onPlaybackComplete={() => console.log('Playback finished')}
    />
  );
}
```

## Integration with InputBox

The `InputBox` component integrates the voice interface to allow for both text and voice input:

```jsx
// Inside InputBox.jsx
import { VoiceInterface } from './VoiceInterface';

function InputBox({ onSendMessage, sessionId }) {
  const [showVoiceInterface, setShowVoiceInterface] = useState(false);
  
  const handleVoiceToggle = () => {
    setShowVoiceInterface(!showVoiceInterface);
  };
  
  const handleVoiceInput = (text) => {
    if (text && text.trim()) {
      onSendMessage(text.trim());
      setShowVoiceInterface(false);
    }
  };
  
  return (
    <div className="input-container">
      {/* Text input elements */}
      
      <button 
        className="voice-toggle-button"
        onClick={handleVoiceToggle}
      >
        <MicIcon />
      </button>
      
      {showVoiceInterface && (
        <VoiceInterface
          sessionId={sessionId}
          onSendMessage={handleVoiceInput}
          visible={showVoiceInterface}
        />
      )}
    </div>
  );
}
```

## Styling Voice Components

The voice components use CSS modules for styling. You can customize their appearance by overriding these classes:

```css
/* YourCustomStyles.css */
.voice-interface-container {
  background-color: var(--primary-bg-color);
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.voice-button {
  background-color: var(--accent-color);
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.voice-button:hover {
  transform: scale(1.05);
  background-color: var(--accent-hover-color);
}

/* Additional styles for status indicators, animations, etc. */
```

## Advanced Usage

### Custom Audio Processing

You can intercept and process audio before sending it to the server:

```jsx
import { AudioRecorder } from '../components/AudioRecorder';

function CustomAudioProcessor() {
  const processAudio = async (audioBlob) => {
    // Convert to ArrayBuffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    
    // Process with Web Audio API
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Apply custom processing...
    
    // Convert back to blob
    const processedBlob = /* your processing logic */
    
    // Now send to server
    sendAudioToServer(processedBlob);
  };
  
  return <AudioRecorder onAudioReady={processAudio} />;
}
```

### Voice Command Recognition

You can implement voice commands by processing the transcript:

```jsx
function VoiceCommands({ onSendMessage }) {
  const handleVoiceInput = (text) => {
    // Check for command patterns
    if (text.toLowerCase().startsWith('navigate to ')) {
      const destination = text.substring(12).trim();
      // Handle navigation command
      navigateTo(destination);
    } else if (text.toLowerCase().includes('search for ')) {
      // Handle search command
      const searchTerm = text.split('search for ')[1].trim();
      performSearch(searchTerm);
    } else {
      // No command detected, send as regular message
      onSendMessage(text);
    }
  };
  
  return (
    <VoiceInterface
      onSendMessage={handleVoiceInput}
      // other props
    />
  );
}
```

## Troubleshooting

### Common Issues

1. **Microphone Access Denied**
   
   Ensure the user has granted microphone permissions. You can check the permission status:
   
   ```javascript
   navigator.permissions.query({ name: 'microphone' })
     .then(permissionStatus => {
       console.log('Microphone permission:', permissionStatus.state);
     });
   ```

2. **WebSocket Connection Failures**
   
   Check that:
   - The backend server is running
   - The WebSocket URL is correct (including protocol: ws:// vs wss://)
   - There are no network restrictions blocking WebSocket connections

3. **Audio Quality Issues**
   
   Configure the audio recorder with appropriate settings:
   
   ```jsx
   <AudioRecorder
     sampleRate={16000}
     audioChannels={1}
     bitDepth={16}
     onAudioReady={handleAudio}
   />
   ```

4. **Browser Compatibility**
   
   The voice interface uses the MediaRecorder API, which has different support across browsers. Consider using a polyfill for unsupported browsers.

### Debugging Tools

1. **Voice Interface Inspector**
   
   Enable debug mode to see detailed logs:
   
   ```jsx
   <VoiceInterface debug={true} />
   ```

2. **WebSocket Monitor**
   
   Monitor WebSocket traffic in the browser console:
   
   ```javascript
   // In your browser console
   // Replace with your actual WebSocket URL
   const ws = new WebSocket('ws://localhost:8000/ws/audio/test-session');
   ws.onmessage = (event) => console.log('Received:', event.data);
   ws.onerror = (error) => console.error('WebSocket error:', error);
   ```

3. **Audio Visualization**
   
   Add a visualizer to debug audio recording:
   
   ```jsx
   <AudioRecorder
     onAudioReady={handleAudio}
     visualizer={true}
     visualizerSettings={{
       width: 300,
       height: 50,
       barWidth: 2,
       barGap: 1,
       barColor: '#4285f4'
     }}
   />
   ```

### Performance Optimization

For better performance, especially on mobile devices:

1. Use a smaller Whisper model on the backend
2. Set appropriate recording quality
3. Implement progressive loading for audio responses
4. Consider adding a server-side caching mechanism for common voice commands 