/**
 * ElevenLabs Text-to-Speech Module
 * Implements ElevenLabs API integration for voice feedback
 */

export class ElevenLabsTTS {
    constructor(config) {
        this.config = config;
        this.apiUrl = config.elevenlabs?.apiBaseUrl || 'https://api.elevenlabs.io/v1';
        this.voiceId = config.elevenlabs?.voice?.voiceId || '21m00Tcm4TlvDq8ikWAM';
        this.audioQueue = [];
        this.isPlaying = false;
        this.apiKey = null; // Will be loaded from environment or config
        this.fallbackToWebAPI = true; // Enable fallback for MVP
        
        console.log('ElevenLabsTTS module initialized');
    }

    async speak(text, priority = 'normal') {
        console.log('Speaking text:', text);
        
        try {
            if (priority === 'urgent' || this.audioQueue.length === 0) {
                // Speak immediately or if queue is empty
                await this.speakImmediate(text);
            } else {
                // Add to queue
                this.audioQueue.push(text);
                this.processQueue();
            }
        } catch (error) {
            console.error('TTS error:', error);
            // Always fallback to Web API for MVP
            this.speakWithWebAPI(text);
        }
    }

    async speakImmediate(text) {
        try {
            // Try ElevenLabs API first (if API key available)
            if (this.apiKey) {
                const audioData = await this.generateAudio(text);
                await this.playAudio(audioData);
            } else {
                // Fallback to Web Speech API
                this.speakWithWebAPI(text);
            }
        } catch (error) {
            console.warn('ElevenLabs API failed, using Web Speech API fallback:', error);
            this.speakWithWebAPI(text);
        }
    }

    async generateAudio(text) {
        const requestBody = {
            text: text,
            voice_settings: {
                stability: this.config.elevenlabs?.voice?.stability || 0.5,
                similarity_boost: this.config.elevenlabs?.voice?.similarityBoost || 0.5
            },
            model_id: "eleven_monolingual_v1"
        };

        const response = await fetch(`${this.apiUrl}/text-to-speech/${this.voiceId}`, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': this.apiKey
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
        }

        return await response.arrayBuffer();
    }

    async playAudio(audioData) {
        return new Promise((resolve, reject) => {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            audioContext.decodeAudioData(audioData)
                .then(audioBuffer => {
                    const source = audioContext.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(audioContext.destination);
                    
                    source.onended = () => {
                        resolve();
                    };
                    
                    source.start(0);
                })
                .catch(reject);
        });
    }

    speakWithWebAPI(text) {
        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            utterance.volume = 0.8;
            
            // Try to find a pleasant voice
            const voices = window.speechSynthesis.getVoices();
            const preferredVoices = voices.filter(voice => 
                voice.name.includes('Google') || 
                voice.name.includes('Microsoft') ||
                voice.name.includes('Natural') ||
                voice.lang.startsWith('en')
            );
            
            if (preferredVoices.length > 0) {
                utterance.voice = preferredVoices[0];
            }
            
            utterance.onstart = () => {
                this.isPlaying = true;
                console.log('Web Speech TTS started');
            };
            
            utterance.onend = () => {
                this.isPlaying = false;
                console.log('Web Speech TTS ended');
                this.processQueue();
            };
            
            utterance.onerror = (event) => {
                this.isPlaying = false;
                console.error('Web Speech TTS error:', event.error);
            };
            
            window.speechSynthesis.speak(utterance);
        } else {
            console.warn('Speech synthesis not supported in this browser');
        }
    }

    async processQueue() {
        if (this.isPlaying || this.audioQueue.length === 0) {
            return;
        }

        const nextText = this.audioQueue.shift();
        await this.speakImmediate(nextText);
    }

    async speakConfirmation() {
        const messages = this.config.feedback?.confirmationMessages || [
            'Your sketch has been created',
            'Sketch generated successfully',
            'Drawing completed',
            'Perfect! Your artwork is ready',
            'Great! I\'ve created your sketch'
        ];
        
        const message = messages[Math.floor(Math.random() * messages.length)];
        await this.speak(message, 'urgent');
    }

    async speakError() {
        const messages = this.config.feedback?.errorMessages || [
            'I couldn\'t understand that command',
            'Please try a different description',
            'Command not recognized',
            'Sorry, could you try again?',
            'I didn\'t catch that. Please repeat your command'
        ];
        
        const message = messages[Math.floor(Math.random() * messages.length)];
        await this.speak(message, 'urgent');
    }

    async speakProcessing() {
        const messages = this.config.feedback?.processingMessages || [
            'Creating your sketch',
            'Processing your request',
            'Generating P5.js code',
            'Working on your drawing',
            'Let me create that for you'
        ];
        
        const message = messages[Math.floor(Math.random() * messages.length)];
        await this.speak(message);
    }

    async speakWelcome() {
        const welcomeMessage = "Welcome to Sketchee! Click the record button and tell me what you'd like to draw.";
        await this.speak(welcomeMessage);
    }

    async speakHelp() {
        const helpMessage = "Try saying something like: draw a red circle, create a blue square, or make it spin.";
        await this.speak(helpMessage);
    }

    async speakCommand(command) {
        const confirmationMessage = `I heard: ${command}. Let me create that for you.`;
        await this.speak(confirmationMessage);
    }

    stopSpeaking() {
        // Stop Web Speech API
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        
        // Clear queue
        this.clearQueue();
        this.isPlaying = false;
        
        console.log('All speech stopped');
    }

    clearQueue() {
        this.audioQueue = [];
        console.log('Audio queue cleared');
    }

    // Utility methods for enhanced feedback

    async speakShapeConfirmation(shape, color) {
        const message = `I've created a ${color} ${shape} for you!`;
        await this.speak(message, 'urgent');
    }

    async speakAnimationConfirmation(animationType) {
        const message = `Great! I've added ${animationType} animation to your sketch.`;
        await this.speak(message, 'urgent');
    }

    async speakMultipleShapesConfirmation(count, shape) {
        const plural = count > 1 ? 's' : '';
        const message = `Perfect! I've drawn ${count} ${shape}${plural} for you.`;
        await this.speak(message, 'urgent');
    }

    async speakBrowserCompatibility() {
        const message = "For the best experience, please use Google Chrome with microphone access enabled.";
        await this.speak(message);
    }

    // Configuration and setup methods

    setApiKey(apiKey) {
        this.apiKey = apiKey;
        console.log('ElevenLabs API key configured');
    }

    async loadApiKey() {
        try {
            // Try to load API key from various sources
            
            // 1. Environment variable (if available)
            if (typeof process !== 'undefined' && process.env?.ELEVENLABS_API_KEY) {
                this.setApiKey(process.env.ELEVENLABS_API_KEY);
                return;
            }
            
            // 2. Local config file (if accessible)
            try {
                const response = await fetch('/config/voice/elevenlabs-api-key.txt');
                if (response.ok) {
                    const apiKey = (await response.text()).trim();
                    if (apiKey && apiKey !== 'your_elevenlabs_api_key_here') {
                        this.setApiKey(apiKey);
                        return;
                    }
                }
            } catch (configError) {
                console.log('No local API key file found');
            }
            
            // 3. No API key found - use Web Speech API fallback
            console.log('No ElevenLabs API key found, using Web Speech API fallback');
            this.fallbackToWebAPI = true;
            
        } catch (error) {
            console.warn('Error loading API key:', error);
            this.fallbackToWebAPI = true;
        }
    }

    async testConnection() {
        if (!this.apiKey) {
            console.log('Testing Web Speech API...');
            this.speakWithWebAPI('Testing voice output');
            return { success: true, method: 'Web Speech API' };
        }

        try {
            // Test ElevenLabs API with a short phrase
            await this.generateAudio('Test');
            console.log('ElevenLabs API connection successful');
            return { success: true, method: 'ElevenLabs API' };
        } catch (error) {
            console.warn('ElevenLabs API test failed:', error);
            return { success: false, error: error.message, fallback: 'Web Speech API' };
        }
    }

    getStatus() {
        return {
            isPlaying: this.isPlaying,
            queueLength: this.audioQueue.length,
            hasApiKey: !!this.apiKey,
            method: this.apiKey ? 'ElevenLabs API' : 'Web Speech API'
        };
    }
}
