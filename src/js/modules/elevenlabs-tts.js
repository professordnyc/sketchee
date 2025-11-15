/**
 * ElevenLabs Text-to-Speech Module
 * Implements ElevenLabs API integration with secure backend and Web Speech API fallback
 */

export class ElevenLabsTTS {
    constructor(config) {
        this.config = config || {};
        this.apiUrl = this.config.apiBaseUrl || 'https://api.elevenlabs.io/v1';
        this.voiceId = this.config.voice?.voiceId || '21m00Tcm4TlvDq8ikWAM';
        this.audioQueue = [];
        this.isPlaying = false;
        this.apiKey = null;
        this.fallbackToWebAPI = true;
        this.rateLimit = {
            remaining: 0,
            reset: 0
        };
        
        console.log('ElevenLabsTTS module initialized');
        this.loadApiKey().catch(console.error);
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

    /**
     * Generate audio from text using ElevenLabs API
     * @param {string} text - Text to convert to speech
     * @returns {Promise<ArrayBuffer>} Audio data
     */
    async generateAudio(text) {
        if (this.fallbackToWebAPI) {
            throw new Error('Using Web Speech API fallback');
        }

        if (!this.apiKey) {
            throw new Error('No API key available');
        }

        try {
            const response = await fetch(`${this.apiUrl}/text-to-speech/${this.voiceId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'xi-api-key': this.apiKey,
                },
                body: JSON.stringify({
                    text: text,
                    model_id: "eleven_monolingual_v1",
                    voice_settings: {
                        stability: this.config.voice?.stability || 0.5,
                        similarity_boost: this.config.voice?.similarityBoost || 0.5
                    }
                })
            });

            if (response.status === 429) {
                const resetTime = response.headers.get('x-ratelimit-reset');
                this.rateLimit.reset = resetTime ? new Date(resetTime).getTime() : Date.now() + 60000;
                throw new Error('Rate limit exceeded');
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail?.message || 'Failed to generate audio');
            }

            // Update rate limit info from headers if available
            const remaining = response.headers.get('x-ratelimit-remaining');
            const reset = response.headers.get('x-ratelimit-reset');
            
            if (remaining !== null) {
                this.rateLimit.remaining = parseInt(remaining, 10);
            }
            if (reset) {
                this.rateLimit.reset = new Date(reset).getTime();
            }

            return await response.arrayBuffer();

        } catch (error) {
            console.error('Error generating audio with ElevenLabs:', error);
            throw error;
        }
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

    /**
     * Load API key from the secure backend server
     * @returns {Promise<boolean>} True if API key was loaded successfully
     */
    async loadApiKey() {
        try {
            // Try to get API key from our secure backend
            const response = await fetch('http://localhost:3001/api/keys', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // Add any authentication headers if needed
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch API key');
            }

            if (data.elevenlabs && data.elevenlabs !== '***MASKED***') {
                this.apiKey = data.elevenlabs;
                this.rateLimit = {
                    remaining: data.rateLimit?.remaining || 0,
                    reset: data.rateLimit?.reset || 0
                };
                this.fallbackToWebAPI = false;
                console.log('ElevenLabs API key loaded successfully');
                return true;
            }

            throw new Error('No valid API key received from server');

        } catch (error) {
            console.warn('Failed to load ElevenLabs API key:', error.message);
            console.log('Falling back to Web Speech API');
            this.fallbackToWebAPI = true;
            return false;
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
