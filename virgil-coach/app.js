class VirgilCoach {
    constructor() {
        this.currentMode = null;
        this.isListening = false;
        this.isMuted = false;
        this.isHidden = false;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.volume = 0.3;
        this.conversationContext = [];
        this.debugMode = false;
        this.aiEnabled = false;
        this.backendUrl = null;
        this.curatedResponses = this.loadCuratedResponses();
        this.lastResponse = null;
        this.lastQuestion = null;
        
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
            debugBtn: document.getElementById('debugBtn'),
            aiBtn: document.getElementById('aiBtn'),
            saveBtn: document.getElementById('saveBtn'),
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

        // Debug button
        this.elements.debugBtn.addEventListener('click', () => {
            this.toggleDebugMode();
        });

        // AI Mode button
        this.elements.aiBtn.addEventListener('click', () => {
            this.toggleAIMode();
        });

        // Save Response button
        this.elements.saveBtn.addEventListener('click', () => {
            this.saveCurrentResponse();
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
        
        // Try AI-enhanced response if backend is available and user opts in
        if (this.aiEnabled && this.backendUrl) {
            try {
                return await this.getAIAdvice(question, this.currentMode);
            } catch (error) {
                console.warn('AI API failed, falling back to smart responses:', error);
                // Graceful fallback to smart responses
            }
        }
        
        // Store question for potential curation
        this.lastQuestion = question;
        
        // Try curated responses first (best of both worlds)
        const curatedResponse = this.findCuratedResponse(question, this.currentMode);
        if (curatedResponse) {
            this.lastResponse = curatedResponse;
            return this.formatSmartResponse(curatedResponse, 'curated', ['saved-ai']);
        }
        
        // Use smart keyword-based responses (current system)
        const response = this.getMockAdvice(question, this.currentMode);
        this.lastResponse = response;
        return response;
    }

    async getAIAdvice(question, mode) {
        const prompt = this.getModePrompt(mode);
        const context = this.getRecentContext();
        
        // Use your existing FastAPI backend with Mistral Mixtral-8x7B
        const backendUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:8000'  // Local development
            : 'https://your-fastapi-backend.herokuapp.com'; // Production
        
        const response = await fetch(`${backendUrl}/guide`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `[${mode.toUpperCase()} COACHING] ${question}`,
                tone: 'professional',
                session_id: `virgil-coach-${this.currentMode}-${Date.now()}`
            })
        });

        const data = await response.json();
        
        // Format the response to fit coaching context
        let advice = data.reply;
        
        // Keep responses concise for real-time coaching
        if (advice.length > 200) {
            advice = advice.substring(0, 200) + '...';
        }
        
        // Store for potential curation
        this.lastResponse = advice;
        this.lastQuestion = question;
        
        return this.formatSmartResponse(advice, 'ai-mistral', ['mixtral-8x7b']);
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
        
        // Extract key topics and analyze question structure
        const analysis = this.analyzeQuestion(q, mode);
        
        // Generate contextually aware response based on actual question content  
        return this.generateContextualResponse(question, analysis, mode);
    }

    analyzeQuestion(question, mode) {
        const analysis = {
            topics: [],
            questionType: 'general',
            intent: 'unknown',
            specificity: 'low'
        };

        // Extract specific topics mentioned
        const topicPatterns = {
            // Technical topics
            tech: ['algorithm', 'database', 'api', 'microservices', 'security', 'testing', 'performance', 'scalability', 'architecture', 'deployment', 'react', 'python', 'javascript', 'sql', 'cloud', 'docker', 'kubernetes', 'machine learning', 'ai', 'devops', 'agile'],
            
            // Business/HR topics
            business: ['leadership', 'management', 'strategy', 'teamwork', 'communication', 'problem solving', 'decision making', 'project management', 'client relations', 'negotiation', 'time management', 'prioritization'],
            
            // Personal development
            personal: ['strength', 'weakness', 'achievement', 'challenge', 'failure', 'learning', 'growth', 'motivation', 'goal', 'experience', 'skill', 'improvement'],
            
            // Situation-specific
            situations: ['conflict', 'deadline', 'pressure', 'difficult customer', 'team disagreement', 'tight budget', 'technical debt', 'scope creep', 'changing requirements']
        };

        // Find mentioned topics
        Object.entries(topicPatterns).forEach(([category, terms]) => {
            terms.forEach(term => {
                if (question.includes(term)) {
                    analysis.topics.push({ term, category });
                }
            });
        });

        // Determine question type
        if (question.includes('tell me about') || question.includes('describe') || question.includes('explain')) {
            analysis.questionType = 'descriptive';
        } else if (question.includes('how would you') || question.includes('what would you do')) {
            analysis.questionType = 'scenario';
        } else if (question.includes('why') || question.includes('what makes you')) {
            analysis.questionType = 'reasoning';
        } else if (question.includes('example') || question.includes('time when')) {
            analysis.questionType = 'behavioral';
        }

        // Assess specificity
        if (analysis.topics.length > 2) {
            analysis.specificity = 'high';
        } else if (analysis.topics.length > 0) {
            analysis.specificity = 'medium';
        }

        return analysis;
    }

    generateContextualResponse(originalQuestion, analysis, mode) {
        const q = originalQuestion.toLowerCase();
        let responseType = 'smart';
        let triggeredKeywords = analysis.topics.map(t => t.term);

        // Generate highly specific responses based on actual question content
        if (analysis.topics.length > 0) {
            const primaryTopic = analysis.topics[0].term;
            
            if (mode === 'coding') {
                return this.generateCodingResponse(q, primaryTopic, analysis, responseType, triggeredKeywords);
            } else if (mode === 'hr') {
                return this.generateHRResponse(q, primaryTopic, analysis, responseType, triggeredKeywords);
            } else if (mode === 'political') {
                return this.generatePoliticalResponse(q, primaryTopic, analysis, responseType, triggeredKeywords);
            } else if (mode === 'teacher') {
                return this.generateTeacherResponse(q, primaryTopic, analysis, responseType, triggeredKeywords);
            } else if (mode === 'cyrano') {
                return this.generateCyranoResponse(q, primaryTopic, analysis, responseType, triggeredKeywords);
            }
        }

        // Fallback to mode-specific general advice only if no topics detected
        return this.generateGeneralResponse(q, mode, 'fallback', ['general']);
    }

    generateCodingResponse(question, topic, analysis, responseType, keywords) {
        if (question.includes('algorithm') || question.includes('data structure')) {
            return this.formatSmartResponse(`For ${topic} problems: "Let me break this down systematically. I'll start with the simplest approach, then optimize. The key insight here is understanding the ${topic} characteristics and choosing the right data structure for efficiency."`, responseType, keywords);
        }
        if (question.includes('system design') || question.includes('architecture')) {
            return this.formatSmartResponse(`For ${topic} design: "I'd start by clarifying the requirements and scale. Then design the high-level architecture, discuss data flow, identify bottlenecks, and plan for scalability. Key considerations for ${topic} include performance, reliability, and maintainability."`, responseType, keywords);
        }
        if (question.includes('debugging') || question.includes('troubleshoot')) {
            return this.formatSmartResponse(`For ${topic} issues: "I'd approach this systematically - reproduce the issue, analyze logs, use debugging tools, and check recent changes. For ${topic} specifically, I'd focus on [common patterns] and verify [key assumptions]."`, responseType, keywords);
        }
        
        return this.formatSmartResponse(`For this ${topic} question: "I'd approach this by understanding the core requirements, breaking down the problem, implementing a clean solution, and ensuring proper testing. With ${topic}, the key is [relevant technical principle]."`, responseType, keywords);
    }

    generateHRResponse(question, topic, analysis, responseType, keywords) {
        if (analysis.questionType === 'behavioral') {
            return this.formatSmartResponse(`For ${topic} situations: "I had a specific experience where ${topic} was crucial. The situation was [context], I took action by [specific steps], and the result was [measurable outcome]. This taught me the importance of [key learning]."`, responseType, keywords);
        }
        if (question.includes('strength') || question.includes('skill')) {
            return this.formatSmartResponse(`Regarding ${topic}: "My strength in ${topic} comes from [specific experience]. For example, I successfully [concrete achievement] which resulted in [quantified impact]. I'm particularly effective at [specific aspect of topic]."`, responseType, keywords);
        }
        if (question.includes('challenge') || question.includes('difficult')) {
            return this.formatSmartResponse(`With ${topic} challenges: "I faced a situation involving ${topic} where [specific context]. I addressed it by [detailed approach], collaborated with [stakeholders], and achieved [specific result]. The key was [strategic insight]."`, responseType, keywords);
        }
        
        return this.formatSmartResponse(`About ${topic}: "I have solid experience with ${topic} from [relevant context]. What excites me is how ${topic} directly impacts [business value]. I'm particularly skilled at [specific application] and eager to apply this expertise here."`, responseType, keywords);
    }

    generatePoliticalResponse(question, topic, analysis, responseType, keywords) {
        return this.formatSmartResponse(`On ${topic}: "This is a nuanced issue that affects many people. I believe we need thoughtful policy on ${topic} that considers [stakeholder perspective], balances [competing interests], and focuses on [practical outcomes]. What's your experience with this issue?"`, responseType, keywords);
    }

    generateTeacherResponse(question, topic, analysis, responseType, keywords) {
        return this.formatSmartResponse(`For ${topic} in education: "I use evidence-based approaches to ${topic}, focusing on student engagement and measurable outcomes. My strategy involves [pedagogical method], differentiated instruction, and regular assessment. With ${topic}, I've seen great success when [specific technique]."`, responseType, keywords);
    }

    generateCyranoResponse(question, topic, analysis, responseType, keywords) {
        return this.formatSmartResponse(`About ${topic}: "I find ${topic} fascinating because [genuine insight]. There's something beautiful about how ${topic} [thoughtful observation]. I'd love to know what draws you to ${topic} - your perspective would enrich my understanding."`, responseType, keywords);
    }

    generateGeneralResponse(question, mode, responseType, keywords) {
        const generalAdvice = {
            coding: "Think through the problem step by step, ask clarifying questions, and explain your reasoning as you go.",
            hr: "Use specific examples with measurable results, show enthusiasm for the role, and ask thoughtful questions.",
            political: "Listen actively, find common ground, and focus on shared values and practical solutions.",
            teacher: "Emphasize student-centered learning, show passion for education, and discuss measurable outcomes.",
            cyrano: "Be genuine and thoughtful, ask meaningful questions, and show sincere interest in their perspective."
        };
        
        return this.formatSmartResponse(generalAdvice[mode] || generalAdvice.hr, responseType, keywords);
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
            isMuted: this.isMuted,
            debugMode: this.debugMode,
            aiEnabled: this.aiEnabled,
            backendUrl: this.backendUrl
        };
        localStorage.setItem('virgilCoachSettings', JSON.stringify(settings));
    }

    loadSettings() {
        const saved = localStorage.getItem('virgilCoachSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            this.volume = settings.volume || 0.3;
            this.isMuted = settings.isMuted || false;
            this.debugMode = settings.debugMode || false;
            this.aiEnabled = settings.aiEnabled || false;
            this.backendUrl = settings.backendUrl || null;
            
            this.elements.volumeSlider.value = this.volume * 100;
            this.elements.muteBtn.textContent = this.isMuted ? '🔇 Unmute' : '🔊 Mute';
        }
    }

    showError(message) {
        this.updateAdvice(`Error: ${message}`);
        this.updateStatus('error', 'ERROR');
    }

    formatSmartResponse(advice, responseType, keywords) {
        // Store response metadata for debugging
        this.lastResponseType = responseType;
        this.lastKeywords = keywords;
        
        // Add visual indicator if debug mode is enabled
        if (this.debugMode) {
            let indicator;
            switch(responseType) {
                case 'smart': indicator = '🎯 Smart'; break;
                case 'curated': indicator = '⭐ Curated'; break;
                case 'ai-mistral': indicator = '🧠 AI'; break;
                case 'fallback': indicator = '🔄 General'; break;
                default: indicator = '❓ Unknown';
            }
            const keywordText = keywords.length > 0 ? ` (${keywords.join(', ')})` : '';
            return `${indicator}${keywordText}: ${advice}`;
        }
        
        return advice;
    }

    toggleDebugMode() {
        this.debugMode = !this.debugMode;
        this.updateAdvice(`Debug mode ${this.debugMode ? 'ON' : 'OFF'} - ${this.debugMode ? 'Response types will be shown' : 'Clean responses only'}`);
        this.saveSettings();
    }

    showResponseStats() {
        const type = this.lastResponseType || 'none';
        const keywords = this.lastKeywords || [];
        const typeEmoji = type === 'smart' ? '🎯' : type === 'fallback' ? '🔄' : '❓';
        
        return `${typeEmoji} Last response: ${type.toUpperCase()}${keywords.length > 0 ? ` (triggered by: ${keywords.join(', ')})` : ''}`;
    }

    toggleAIMode() {
        this.aiEnabled = !this.aiEnabled;
        
        if (this.aiEnabled && !this.backendUrl) {
            // Auto-detect backend URL
            this.backendUrl = window.location.hostname === 'localhost' 
                ? 'http://localhost:8000'
                : 'https://your-fastapi-backend.herokuapp.com';
        }
        
        this.updateAdvice(`AI mode ${this.aiEnabled ? 'ON' : 'OFF'} - ${this.aiEnabled ? 'Using Mistral Mixtral-8x7B backend' : 'Using local smart responses'}`);
        this.saveSettings();
    }
    
    async testBackendConnection() {
        if (!this.backendUrl) return false;
        
        try {
            const response = await fetch(`${this.backendUrl}/health`, {
                method: 'GET',
                timeout: 5000
            });
            return response.ok;
        } catch (error) {
            console.warn('Backend connection test failed:', error);
            return false;
        }
    }

    loadCuratedResponses() {
        const saved = localStorage.getItem('virgilCuratedResponses');
        if (saved) {
            return JSON.parse(saved);
        }
        
        // Default curated responses (empty to start)
        return {
            coding: {},
            political: {},
            hr: {},
            teacher: {},
            cyrano: {}
        };
    }
    
    saveCuratedResponses() {
        localStorage.setItem('virgilCuratedResponses', JSON.stringify(this.curatedResponses));
    }
    
    addCuratedResponse(question, response, mode) {
        const key = this.generateResponseKey(question);
        this.curatedResponses[mode][key] = {
            question: question,
            response: response,
            timestamp: Date.now(),
            source: 'ai-curated'
        };
        this.saveCuratedResponses();
    }
    
    generateResponseKey(question) {
        // Create a simple key from question keywords
        return question.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(' ')
            .filter(word => word.length > 3)
            .slice(0, 3)
            .join('_');
    }
    
    findCuratedResponse(question, mode) {
        const key = this.generateResponseKey(question);
        const modeResponses = this.curatedResponses[mode] || {};
        
        // Direct match
        if (modeResponses[key]) {
            return modeResponses[key].response;
        }
        
        // Fuzzy match - check if question contains similar keywords
        const questionWords = question.toLowerCase().split(' ');
        for (const [savedKey, savedResponse] of Object.entries(modeResponses)) {
            const savedWords = savedKey.split('_');
            const overlap = savedWords.filter(word => 
                questionWords.some(qWord => qWord.includes(word) || word.includes(qWord))
            );
            
            if (overlap.length >= 2) { // At least 2 keyword matches
                return savedResponse.response;
            }
        }
        
        return null;
    }
    
    saveCurrentResponse() {
        if (this.lastResponse && this.lastQuestion && this.currentMode) {
            this.addCuratedResponse(this.lastQuestion, this.lastResponse, this.currentMode);
            this.updateAdvice(`✅ Response saved! This answer will be used for similar questions.`);
            
            // Show curated response count
            const count = Object.keys(this.curatedResponses[this.currentMode] || {}).length;
            setTimeout(() => {
                this.updateAdvice(`📚 ${count} curated responses for ${this.currentMode} mode`);
            }, 2000);
        } else {
            this.updateAdvice(`❌ No response to save. Generate an AI response first.`);
        }
    }

    showCuratedStats() {
        const stats = Object.entries(this.curatedResponses).map(([mode, responses]) => {
            const count = Object.keys(responses).length;
            return `${mode}: ${count}`;
        }).join(', ');
        
        const total = Object.values(this.curatedResponses)
            .reduce((sum, responses) => sum + Object.keys(responses).length, 0);
        
        this.updateAdvice(`📚 Curated Responses - Total: ${total} (${stats})`);
    }
    
    clearCuratedResponses() {
        if (confirm('Clear all curated responses? This cannot be undone.')) {
            this.curatedResponses = {
                coding: {},
                political: {},
                hr: {},
                teacher: {},
                cyrano: {}
            };
            this.saveCuratedResponses();
            this.updateAdvice('🗑️ All curated responses cleared');
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.virgilCoach = new VirgilCoach();
});

// Handle app install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Create install button for user-initiated install
    const showInstallButton = () => {
        if (deferredPrompt && !document.getElementById('installBtn')) {
            const installBtn = document.createElement('button');
            installBtn.id = 'installBtn';
            installBtn.textContent = '📱 Install App';
            installBtn.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(139, 69, 19, 0.9);
                color: white;
                border: none;
                padding: 10px 15px;
                border-radius: 8px;
                cursor: pointer;
                z-index: 1000;
                font-size: 14px;
                backdrop-filter: blur(10px);
            `;
            
            installBtn.addEventListener('click', async () => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    deferredPrompt = null;
                    installBtn.remove();
                }
            });
            
            document.body.appendChild(installBtn);
            
            // Auto-hide after 10 seconds
            setTimeout(() => {
                if (installBtn.parentNode) {
                    installBtn.remove();
                }
            }, 10000);
        }
    };
    
    // Show install button after user has interacted with the page
    setTimeout(showInstallButton, 2000);
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