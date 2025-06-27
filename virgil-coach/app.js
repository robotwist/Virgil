class VirgìlCoach {
    constructor() {
        this.currentMode = null;
        this.isListening = false;
        this.isMuted = false;
        this.isHidden = false;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.volume = 0.3;
        this.conversationContext = [];
        
        this.initializeElements();
        this.initializeSpeech();
        this.bindEvents();
        this.loadSettings();
    }

    initializeElements() {
        this.elements = {
            appContainer: document.getElementById('appContainer'),
            modeSelector: document.getElementById('modeSelector'),
            coachInterface: document.getElementById('coachInterface'),
            modeDisplay: document.getElementById('modeDisplay'),
            statusIndicator: document.getElementById('statusIndicator'),
            statusText: document.getElementById('statusText'),
            lastAdvice: document.getElementById('lastAdvice'),
            backBtn: document.getElementById('backBtn'),
            hideBtn: document.getElementById('hideBtn'),
            muteBtn: document.getElementById('muteBtn'),
            volumeSlider: document.getElementById('volumeSlider'),
            hiddenOverlay: document.getElementById('hiddenOverlay')
        };
    }

    initializeSpeech() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = true;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
            
            this.recognition.onstart = () => {
                this.updateStatus('listening', 'LISTENING...');
            };
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[event.results.length - 1][0].transcript.trim();
                this.processQuestion(transcript);
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.updateStatus('error', 'ERROR');
                setTimeout(() => this.startListening(), 2000);
            };
            
            this.recognition.onend = () => {
                if (this.isListening) {
                    this.recognition.start(); // Restart if still supposed to be listening
                }
            };
        } else {
            this.showError('Speech recognition not supported in this browser');
        }
    }

    bindEvents() {
        // Mode selection
        this.elements.modeSelector.addEventListener('click', (e) => {
            const modeCard = e.target.closest('.mode-card');
            if (modeCard) {
                const mode = modeCard.dataset.mode;
                this.selectMode(mode);
            }
        });

        // Status indicator (start/stop listening)
        this.elements.statusIndicator.addEventListener('click', () => {
            this.toggleListening();
        });

        // Control buttons
        this.elements.backBtn.addEventListener('click', () => {
            this.goBackToModes();
        });

        this.elements.hideBtn.addEventListener('click', () => {
            this.hideInterface();
        });

        this.elements.muteBtn.addEventListener('click', () => {
            this.toggleMute();
        });

        // Volume control
        this.elements.volumeSlider.addEventListener('input', (e) => {
            this.volume = e.target.value / 100;
            this.saveSettings();
        });

        // Emergency double-tap
        let lastTap = 0;
        document.addEventListener('touchstart', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 500 && tapLength > 0) {
                this.emergencyClose();
            }
            lastTap = currentTime;
        });

        // Show interface when hidden
        this.elements.hiddenOverlay.addEventListener('dblclick', () => {
            this.showInterface();
        });

        // Prevent context menu
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    selectMode(mode) {
        this.currentMode = mode;
        
        // Update UI
        document.querySelectorAll('.mode-card').forEach(card => {
            card.classList.remove('active');
        });
        document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
        
        // Show coaching interface
        this.elements.modeSelector.style.display = 'none';
        this.elements.coachInterface.classList.add('active');
        
        // Update mode display
        const modeInfo = this.getModeInfo(mode);
        this.elements.modeDisplay.textContent = `${modeInfo.icon} ${modeInfo.name}`;
        
        this.updateAdvice(`${modeInfo.name} mode activated. Ready to provide discrete coaching.`);
        this.updateStatus('ready', 'TAP TO START');
        
        this.saveSettings();
    }

    getModeInfo(mode) {
        const modes = {
            coding: { name: 'Coding Interview', icon: '💻' },
            iran: { name: 'Iran Situation', icon: '🌍' },
            hr: { name: 'HR Interview', icon: '👔' },
            teacher: { name: 'Teacher Interview', icon: '📚' },
            cyrano: { name: 'Cyrano de Bergerac', icon: '💕' }
        };
        return modes[mode];
    }

    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    startListening() {
        if (!this.recognition || this.isMuted) return;
        
        this.isListening = true;
        this.recognition.start();
        this.updateStatus('listening', 'LISTENING...');
    }

    stopListening() {
        this.isListening = false;
        if (this.recognition) {
            this.recognition.stop();
        }
        this.updateStatus('ready', 'TAP TO START');
    }

    async processQuestion(question) {
        this.updateStatus('processing', 'THINKING...');
        
        // Add to conversation context
        this.conversationContext.push({
            type: 'question',
            content: question,
            timestamp: Date.now()
        });

        try {
            const advice = await this.generateAdvice(question);
            this.updateAdvice(advice);
            this.speakAdvice(advice);
            
            // Add advice to context
            this.conversationContext.push({
                type: 'advice',
                content: advice,
                timestamp: Date.now()
            });
            
            // Keep context manageable
            if (this.conversationContext.length > 10) {
                this.conversationContext = this.conversationContext.slice(-10);
            }
            
        } catch (error) {
            console.error('Error generating advice:', error);
            this.updateAdvice('Sorry, I couldn\'t process that question.');
        }
        
        this.updateStatus('listening', 'LISTENING...');
    }

    async generateAdvice(question) {
        const prompt = this.getModePrompt(this.currentMode);
        const context = this.getRecentContext();
        
        // In a real implementation, this would call your AI API
        // For now, we'll use mode-specific responses
        return this.getMockAdvice(question, this.currentMode);
    }

    getModePrompt(mode) {
        const prompts = {
            coding: "You're a senior engineer coaching someone in a technical interview. Give brief, confident technical advice:",
            iran: "You're advising on navigating complex geopolitical situations with cultural sensitivity. Provide diplomatic guidance:",
            hr: "You're an HR expert coaching someone in a job interview. Give concise, professional advice:",
            teacher: "You're an education expert helping in a teaching interview. Provide pedagogical insights:",
            cyrano: "You're Cyrano de Bergerac, master of eloquent romance. Whisper charming, witty responses:"
        };
        return prompts[mode];
    }

    getMockAdvice(question, mode) {
        const advice = {
            coding: [
                "Think out loud about your approach first",
                "Start with a brute force solution, then optimize",
                "Ask about edge cases and constraints",
                "Mention time and space complexity",
                "Draw diagrams if it helps explain",
                "Test with simple examples first"
            ],
            iran: [
                "Acknowledge the complexity of the situation",
                "Show respect for all perspectives involved",
                "Focus on diplomatic solutions",
                "Mention humanitarian concerns",
                "Suggest dialogue and understanding",
                "Emphasize peaceful resolution"
            ],
            hr: [
                "Use the STAR method for behavioral questions",
                "Show enthusiasm for the company mission",
                "Ask thoughtful questions about growth",
                "Highlight specific achievements with numbers",
                "Demonstrate cultural fit",
                "Express genuine interest in the role"
            ],
            teacher: [
                "Focus on student-centered learning approaches",
                "Mention differentiated instruction strategies",
                "Show passion for student growth",
                "Discuss classroom management techniques",
                "Highlight collaboration with parents",
                "Emphasize continuous professional development"
            ],
            cyrano: [
                "Compliment something specific and genuine",
                "Use poetic language but stay authentic",
                "Ask thoughtful questions about their interests",
                "Share a meaningful personal story",
                "Listen more than you speak",
                "Let your sincerity shine through"
            ]
        };

        const responses = advice[mode] || advice.hr;
        return responses[Math.floor(Math.random() * responses.length)];
    }

    getRecentContext() {
        return this.conversationContext
            .slice(-4)
            .map(item => `${item.type}: ${item.content}`)
            .join('\n');
    }

    speakAdvice(text) {
        if (this.isMuted || !this.synthesis) return;

        // Cancel any ongoing speech
        this.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = this.volume;
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        
        // Try to use a more natural voice
        const voices = this.synthesis.getVoices();
        const preferredVoice = voices.find(voice => 
            voice.name.includes('Natural') || 
            voice.name.includes('Enhanced') ||
            voice.lang.startsWith('en')
        );
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        this.synthesis.speak(utterance);
    }

    updateStatus(status, text) {
        this.elements.statusIndicator.className = `status-indicator ${status}`;
        this.elements.statusText.textContent = text;
    }

    updateAdvice(advice) {
        this.elements.lastAdvice.textContent = advice;
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.elements.muteBtn.textContent = this.isMuted ? '🔇 Unmute' : '🔊 Mute';
        
        if (this.isMuted) {
            this.synthesis.cancel();
            this.stopListening();
        }
        
        this.saveSettings();
    }

    hideInterface() {
        this.isHidden = true;
        this.elements.appContainer.classList.add('hidden');
        this.elements.hiddenOverlay.classList.add('active');
    }

    showInterface() {
        this.isHidden = false;
        this.elements.appContainer.classList.remove('hidden');
        this.elements.hiddenOverlay.classList.remove('active');
    }

    goBackToModes() {
        this.stopListening();
        this.elements.coachInterface.classList.remove('active');
        this.elements.modeSelector.style.display = 'grid';
        this.currentMode = null;
        this.conversationContext = [];
    }

    emergencyClose() {
        this.stopListening();
        this.synthesis.cancel();
        
        // Flash red briefly to indicate emergency close
        document.body.style.background = '#ff0000';
        setTimeout(() => {
            window.close();
            // If window.close() doesn't work (in PWA), redirect to blank page
            setTimeout(() => {
                window.location.href = 'about:blank';
            }, 100);
        }, 300);
    }

    saveSettings() {
        const settings = {
            volume: this.volume,
            currentMode: this.currentMode,
            isMuted: this.isMuted
        };
        localStorage.setItem('virgilCoachSettings', JSON.stringify(settings));
    }

    loadSettings() {
        const saved = localStorage.getItem('virgilCoachSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            this.volume = settings.volume || 0.3;
            this.isMuted = settings.isMuted || false;
            
            this.elements.volumeSlider.value = this.volume * 100;
            this.elements.muteBtn.textContent = this.isMuted ? '🔇 Unmute' : '🔊 Mute';
        }
    }

    showError(message) {
        this.updateAdvice(`Error: ${message}`);
        this.updateStatus('error', 'ERROR');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.virgilCoach = new VirgìlCoach();
});

// Handle app install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show custom install button after a delay
    setTimeout(() => {
        if (confirm('Install Virgil Coach as an app for discrete access?')) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                deferredPrompt = null;
            });
        }
    }, 3000);
});

// Handle app launch
window.addEventListener('appinstalled', () => {
    console.log('Virgil Coach installed successfully');
});

// Prevent zoom on mobile
document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
});

document.addEventListener('gesturechange', (e) => {
    e.preventDefault();
});

document.addEventListener('gestureend', (e) => {
    e.preventDefault();
}); 