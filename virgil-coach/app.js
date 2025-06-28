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
            
            this.recognition.continuous = false; // Don't interrupt - wait for complete phrases
            this.recognition.interimResults = true; // Show what user is saying
            this.recognition.lang = 'en-US';
            this.recognition.maxAlternatives = 1;
            
            this.recognition.onstart = () => {
                this.updateStatus('listening', 'LISTENING...');
            };
            
            this.recognition.onresult = (event) => {
                const result = event.results[event.results.length - 1];
                if (result.isFinal) {
                    const transcript = result[0].transcript.trim();
                    if (transcript.length > 3) { // Only process meaningful input
                        this.processQuestion(transcript);
                    }
                } else {
                    // Show interim results so user knows they're being heard
                    const interim = result[0].transcript;
                    this.updateStatus('listening', `Hearing: "${interim}"`);
                }
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.isListening = false;
                this.updateStatus('error', 'CLICK TO RETRY');
                // Don't auto-restart on error to prevent infinite loops
            };
            
            this.recognition.onend = () => {
                this.isListening = false;
                this.updateStatus('ready', 'TAP TO START');
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
            political: { name: 'Political Discussion', icon: '🏛️' },
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
        if (!this.recognition || this.isMuted || this.isListening) return;
        
        try {
            this.isListening = true;
            this.recognition.start();
            this.updateStatus('listening', 'LISTENING...');
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            this.isListening = false;
            this.updateStatus('error', 'CLICK TO RETRY');
        }
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
        
        this.updateStatus('ready', 'TAP TO START');
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
        const q = question.toLowerCase();
        
        // Smart coaching based on what they're actually being asked
        if (mode === 'coding') {
            if (q.includes('yourself') || q.includes('introduce')) {
                return "Say: 'I'm a software engineer with X years of experience. My passion is solving complex problems efficiently. Recently I built [specific project] using [technologies].'";
            }
            if (q.includes('algorithm') || q.includes('data structure')) {
                return "Start with: 'Let me think through this step by step.' Then explain your approach before coding. Ask about input constraints.";
            }
            if (q.includes('experience') || q.includes('project')) {
                return "Use the STAR method: Situation, Task, Action, Result. Pick a project where you solved a real technical challenge with measurable impact.";
            }
            if (q.includes('weakness') || q.includes('improve')) {
                return "Pick a real technical skill you're improving. Say: 'I'm strengthening my [specific skill] by [specific action]. For example...'";
            }
            if (q.includes('question') || q.includes('ask')) {
                return "Ask: 'What's the biggest technical challenge the team is facing?' or 'How do you measure engineering success here?'";
            }
            // Fallback for coding
            const codingAdvice = [
                "Break the problem down into smaller steps",
                "Ask about performance requirements and scale",
                "Mention time complexity: O(n), O(log n), etc.",
                "Test with edge cases: empty input, single element",
                "Think out loud so they follow your reasoning",
                "Ask clarifying questions about the requirements"
            ];
            return codingAdvice[Math.floor(Math.random() * codingAdvice.length)];
        }
        if (mode === 'political') {
            if (q.includes('israel') || q.includes('palestine') || q.includes('gaza')) {
                return "Acknowledge both sides' legitimate concerns. Say: 'This is a complex situation with valid perspectives. I believe in peaceful coexistence and dialogue.'";
            }
            if (q.includes('trump') || q.includes('biden') || q.includes('election')) {
                return "Stay measured: 'I focus on policies rather than personalities. What matters most to me is [specific policy area] and evidence-based solutions.'";
            }
            if (q.includes('climate') || q.includes('environment')) {
                return "Find common ground: 'I think we all want clean air and water for our kids. Let's focus on practical solutions that work economically too.'";
            }
            if (q.includes('immigration') || q.includes('border')) {
                return "Be balanced: 'Immigration is complex. I support both border security and humane treatment. We need comprehensive reform that addresses root causes.'";
            }
            if (q.includes('healthcare') || q.includes('medical')) {
                return "Focus on outcomes: 'Healthcare should be accessible and affordable. I'm interested in what actually works - looking at successful models worldwide.'";
            }
            // Fallback political advice
            const politicalAdvice = [
                "Ask: 'What specific outcomes are you hoping for?'",
                "Find shared values: 'I think we both want what's best for families'",
                "Redirect to policy: 'What policies do you think would help most?'",
                "Acknowledge complexity: 'These issues have many layers to consider'",
                "Suggest common ground: 'Where do you think we might agree?'",
                "Stay curious: 'Help me understand your perspective better'"
            ];
            return politicalAdvice[Math.floor(Math.random() * politicalAdvice.length)];
        }
        if (mode === 'hr') {
            if (q.includes('yourself') || q.includes('introduce')) {
                return "Structure it: 'I'm [role] with [X years] experience in [industry]. I excel at [key skill]. I'm excited about this role because [specific reason].'";
            }
            if (q.includes('weakness')) {
                return "Say: 'I used to struggle with [real weakness], but I've improved by [specific action]. For example, [brief story with result].'";
            }
            if (q.includes('strength')) {
                return "Pick one strength with proof: 'My biggest strength is [skill]. For example, at [company] I [specific achievement with numbers].'";
            }
            if (q.includes('why') && (q.includes('company') || q.includes('role'))) {
                return "Be specific: 'I'm excited about [specific product/mission]. Your focus on [company value] aligns with my experience in [relevant area].'";
            }
            if (q.includes('conflict') || q.includes('difficult')) {
                return "Use STAR: 'I had a situation where [context]. I addressed it by [specific actions]. The result was [positive outcome].'";
            }
            // Fallback HR advice
            const hrAdvice = [
                "Back up every claim with a specific example",
                "Show enthusiasm: 'I'm really excited about...'",
                "Ask about growth: 'What does success look like in this role?'",
                "Mention specific company achievements you admire",
                "Use numbers: percentages, dollar amounts, timeframes"
            ];
            return hrAdvice[Math.floor(Math.random() * hrAdvice.length)];
        }
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