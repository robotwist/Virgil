# 🎭 Virgil Coach - Discrete Conversation Assistant PWA

A nimble Progressive Web App that provides real-time, discrete conversation coaching for high-stakes situations.

## Features

### 🎯 **Specialized Coaching Modes**
- **💻 Coding Interview**: Technical guidance & algorithm tips
- **🌍 Iran Situation**: Diplomatic & cultural context advice  
- **👔 HR Interview**: Professional coaching & behavioral tips
- **📚 Teacher Interview**: Educational expertise & pedagogy
- **💕 Cyrano de Bergerac**: Romantic eloquence & social finesse

### ⚡ **Nimble & Discrete**
- **Always listening** mode with voice activity detection
- **Hide interface** for complete discretion
- **Whisper-quiet** TTS output
- **Emergency close** with double-tap
- **Offline capable** with essential advice cached

### 📱 **Progressive Web App**
- **Install as app** on any device
- **Works offline** with cached responses
- **Background operation** continues when screen is off
- **Responsive design** optimized for mobile

## Quick Start

### 1. Open in Browser
```bash
# Simply open index.html in a modern browser
# Chrome or Edge recommended for best speech support
```

### 2. Grant Permissions
- **Microphone access** for speech recognition
- **Notification permission** (optional)

### 3. Install as App
- Browser will prompt to "Install Virgil Coach"
- Accept to add to home screen/desktop

### 4. Choose Your Mode
- Select coaching mode for your situation
- Tap the status circle to start listening
- Hide interface for complete discretion

## How to Use

### Basic Workflow
1. **Select Mode** → Choose your coaching scenario
2. **Start Listening** → Tap the circle, it turns green
3. **Receive Advice** → Get whispered coaching tips
4. **Stay Discrete** → Hide interface as needed
5. **Emergency Exit** → Double-tap anywhere to close

### Discrete Operation
- **Hide Interface**: Tap "Hide Interface" button
- **Show Interface**: Double-tap the black screen
- **Emergency Close**: Double-tap anywhere (flashes red)
- **Volume Control**: Adjust whisper volume level

### Advanced Features
- **Context Memory**: Remembers recent conversation
- **Mode Switching**: Long-press to change modes
- **Offline Mode**: Works without internet connection
- **Quick Shortcuts**: Direct mode launch from app icon

## Technical Details

### Browser Requirements
- **Chrome/Edge**: Full support (recommended)
- **Firefox**: Requires enabling Web Workers in about:config
- **Safari**: Limited speech recognition support

### Speech APIs Used
- **Speech Recognition**: Web Speech API (browser native)
- **Text-to-Speech**: Speech Synthesis API (browser native)
- **No external models** or dependencies required

### Privacy & Security
- **No data sent to servers** (runs entirely in browser)
- **No conversation logging** (only recent context kept)
- **Microphone access** only when actively listening
- **Complete offline operation** available

## Installation

### For Development
```bash
# Clone or download the files
git clone <repository-url>
cd virgil-coach

# Serve with any web server
python -m http.server 8000
# or
npx serve .

# Open in browser
open http://localhost:8000
```

### For Production
- Upload files to any web hosting service
- Ensure HTTPS for PWA features to work
- Icons should be placed in `/icons/` directory

## File Structure
```
virgil-coach/
├── index.html          # Main PWA interface
├── app.js             # Core application logic
├── manifest.json      # PWA manifest
├── sw.js             # Service worker for offline
├── README.md         # This file
└── icons/            # App icons (various sizes)
    ├── icon-72.png
    ├── icon-192.png
    └── icon-512.png
```

## Customization

### Adding New Modes
1. Add mode to the HTML mode selector
2. Update `getModeInfo()` in app.js
3. Add prompts in `getModePrompt()`
4. Include advice in `getMockAdvice()`

### Connecting to AI API
Replace the `generateAdvice()` method in app.js to call your AI backend:

```javascript
async generateAdvice(question) {
    const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            question,
            mode: this.currentMode,
            context: this.getRecentContext()
        })
    });
    return response.json();
}
```

## Use Cases

### 💼 **Job Interviews**
- Technical coding interviews
- HR behavioral interviews  
- Teaching position interviews
- Real-time coaching and tips

### 🌍 **Diplomatic Situations**
- Cross-cultural conversations
- Sensitive political discussions
- International business meetings

### 💕 **Social Situations**
- Dating conversations
- Networking events
- Public speaking
- Social anxiety support

## Security Considerations

- Use only in appropriate, legal situations
- Respect interview policies and guidelines
- Consider ethical implications of assisted conversations
- Be transparent when appropriate

## Browser Compatibility

| Feature | Chrome | Edge | Firefox | Safari |
|---------|--------|------|---------|--------|
| Speech Recognition | ✅ | ✅ | ⚠️¹ | ⚠️² |
| Text-to-Speech | ✅ | ✅ | ✅ | ✅ |
| PWA Install | ✅ | ✅ | ✅ | ✅ |
| Service Worker | ✅ | ✅ | ✅ | ✅ |

¹ Firefox: Enable `dom.workers.modules.enabled` in about:config  
² Safari: Limited speech recognition support

## Support

For issues or feature requests, please check:
- Browser compatibility requirements
- Microphone permissions granted
- HTTPS connection for PWA features

## License

MIT License - Feel free to modify and distribute.

---

*"The right words at the right time can change everything."* 🎭 