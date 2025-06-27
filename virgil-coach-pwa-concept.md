# Virgil Coach - Nimble Multi-Mode Conversation Assistant PWA

## Overview
A discrete, real-time conversation coaching PWA that whispers helpful advice during high-stakes conversations.

## Core Modes

### 💻 Coding Interview Mode
- **Prompt Style**: Senior engineer providing technical guidance
- **Response Types**: Algorithm hints, system design tips, complexity analysis
- **Tone**: Confident, technical, concise

### 🌍 Iran Situation Mode  
- **Prompt Style**: Diplomatic advisor with cultural sensitivity
- **Response Types**: Geopolitical context, cultural nuances, diplomatic language
- **Tone**: Respectful, informed, cautious

### 👔 HR Interview Mode
- **Prompt Style**: Professional career coach
- **Response Types**: Behavioral frameworks, company insights, negotiation tips
- **Tone**: Professional, strategic, confident

### 📚 Teacher Interview Mode
- **Prompt Style**: Education expert and pedagogy advisor
- **Response Types**: Teaching methodologies, classroom management, curriculum insights
- **Tone**: Educational, thoughtful, passionate

### 💕 Cyrano de Bergerac Mode
- **Prompt Style**: Eloquent romantic poet and social maestro
- **Response Types**: Charming responses, witty comebacks, romantic advice
- **Tone**: Eloquent, charming, sophisticated

## Technical Architecture

### Frontend (PWA)
- **Framework**: Vanilla JS or lightweight React
- **STT**: Web Speech API (browser native)
- **TTS**: Speech Synthesis API (whisper volume)
- **UI**: Minimal, hideable interface
- **Offline**: Service worker with cached responses

### Backend (Nimble)
- **API**: FastAPI with mode-specific endpoints
- **AI**: Optimized prompts for quick responses
- **Processing**: <2 second response time target
- **Caching**: Common scenarios pre-computed

### PWA Features
- **Install prompt**: "Add Virgil Coach to Home Screen"
- **Offline mode**: Core functionality without internet
- **Background**: Continues listening when screen is off
- **Discrete**: Minimal visual footprint

## User Experience Flow

### Setup Phase
1. User selects mode (Coding, Iran, HR, Teacher, Cyrano)
2. PWA enters listening mode
3. Interface minimizes/hides

### Coaching Phase
1. **Listen**: Continuous speech recognition
2. **Process**: Quick AI response generation
3. **Whisper**: Discrete audio advice
4. **Repeat**: Seamless loop

### Key Interactions
- **Mode Switch**: Long press to change modes
- **Mute/Unmute**: Quick tap to pause listening
- **Hide UI**: Swipe to make interface invisible
- **Emergency**: Double tap to instantly close

## Technical Specifications

### Performance Targets
- **Response Time**: <2 seconds from question to advice
- **Battery Life**: >4 hours continuous use
- **Size**: <5MB total app size
- **Offline**: 80% functionality without internet

### Browser Support
- **Primary**: Chrome, Edge (Web Speech API)
- **Secondary**: Firefox, Safari (with polyfills)
- **Mobile**: iOS Safari, Android Chrome

### Voice Processing
- **STT**: Browser Speech Recognition API
- **TTS**: Speech Synthesis API with volume control
- **Audio**: Optimized for discrete, private listening

## Specialized Prompt Examples

### Coding Interview
```
Input: "How would you implement a rate limiter?"
Output: "Token bucket algorithm - track tokens per user, refill rate, max capacity. Mention Redis for distributed systems."
```

### Cyrano de Bergerac
```  
Input: "What should I say about her smile?"
Output: "Tell her: 'Your smile could make the stars jealous of its radiance.' Then pause, let the poetry breathe."
```

### HR Interview
```
Input: "Tell me about a time you failed."
Output: "Use STAR method. Pick real failure, focus on learning. Frame as growth opportunity, not weakness."
```

## Development Phases

### Phase 1: Core PWA (Week 1-2)
- Basic PWA setup with service worker
- Single mode implementation (HR Interview)
- Speech Recognition + Synthesis integration
- Minimal UI with hide functionality

### Phase 2: Multi-Mode System (Week 3)
- Mode selection interface
- All 5 coaching modes implemented
- Mode-specific prompt optimization
- Quick mode switching

### Phase 3: Enhancement (Week 4)
- Offline capabilities
- Performance optimization
- Battery usage optimization
- User testing and refinement

### Phase 4: Polish (Week 5)
- Visual design polish
- Advanced features (context memory)
- App store submission preparation
- Documentation and marketing

## Success Metrics
- **Response Speed**: 95% of responses <2 seconds
- **User Discretion**: Interface hideable in <1 second
- **Battery Efficiency**: >4 hours continuous use
- **Offline Capability**: Core features work without internet
- **User Adoption**: Easy one-tap installation and setup 