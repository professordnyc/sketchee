/**
 * Voice Input Module
 * Implements Web Speech API integration with real-time transcription
 */

export class VoiceInput {
    constructor(config) {
        this.config = config;
        this.recognition = null;
        this.isRecording = false;
        this.transcriptionCallback = null;
        this.errorCallback = null;
        this.finalTranscription = '';
        this.interimTranscription = '';
        
        console.log('VoiceInput module initialized');
    }

    async initialize() {
        // Check browser compatibility
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            throw new Error('Web Speech API not supported in this browser');
        }

        // Initialize speech recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();

        // Configure speech recognition
        this.recognition.lang = this.config.speechRecognition.language || 'en-US';
        this.recognition.continuous = this.config.speechRecognition.continuous || false;
        this.recognition.interimResults = this.config.speechRecognition.interimResults || true;
        this.recognition.maxAlternatives = this.config.speechRecognition.maxAlternatives || 1;

        // Set up event listeners
        this.recognition.onstart = () => {
            this.isRecording = true;
            console.log('Voice recognition started');
            this.updateRecordingState(true);
        };

        this.recognition.onend = () => {
            this.isRecording = false;
            console.log('Voice recognition ended');
            this.updateRecordingState(false);
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            this.interimTranscription = interimTranscript;
            this.finalTranscription = finalTranscript;

            // Update transcription display
            this.updateTranscriptionDisplay(finalTranscript, interimTranscript);

            // Call transcription callback if set
            if (this.transcriptionCallback) {
                this.transcriptionCallback({
                    final: finalTranscript,
                    interim: interimTranscript,
                    isFinal: finalTranscript.length > 0
                });
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isRecording = false;
            this.updateRecordingState(false);
            
            if (this.errorCallback) {
                this.errorCallback({
                    type: event.error,
                    message: this.getErrorMessage(event.error)
                });
            }
        };

        console.log('Voice input initialized successfully');
    }

    startRecording() {
        if (!this.recognition) {
            throw new Error('Voice input not initialized');
        }

        if (this.isRecording) {
            console.warn('Recording already in progress');
            return;
        }

        try {
            this.finalTranscription = '';
            this.interimTranscription = '';
            this.clearTranscriptionDisplay();
            this.recognition.start();
            console.log('Started voice recording');
        } catch (error) {
            console.error('Error starting recording:', error);
            if (this.errorCallback) {
                this.errorCallback({
                    type: 'start_error',
                    message: 'Failed to start voice recording'
                });
            }
        }
    }

    stopRecording() {
        if (!this.recognition || !this.isRecording) {
            console.warn('No recording in progress');
            return;
        }

        try {
            this.recognition.stop();
            console.log('Stopped voice recording');
        } catch (error) {
            console.error('Error stopping recording:', error);
        }
    }

    onTranscription(callback) {
        this.transcriptionCallback = callback;
    }

    onError(callback) {
        this.errorCallback = callback;
    }

    updateRecordingState(isRecording) {
        const recordButton = document.querySelector('#record-button');
        const statusElement = document.querySelector('#recording-status');
        
        if (recordButton) {
            recordButton.textContent = isRecording ? 'Stop Recording' : 'Start Recording';
            recordButton.className = isRecording ? 'voice-button recording' : 'voice-button idle';
        }

        if (statusElement) {
            statusElement.innerHTML = isRecording ? 
                '<span class="voice-indicator"></span>Listening...' : 
                'Ready to record';
            statusElement.className = isRecording ? 'status-message processing' : 'status-message';
        }
    }

    updateTranscriptionDisplay(finalText, interimText) {
        const transcriptionElement = document.querySelector('#transcription-text');
        if (transcriptionElement) {
            const displayText = finalText + (interimText ? ` <em>${interimText}</em>` : '');
            transcriptionElement.innerHTML = displayText || 'Speak your command...';
            
            const container = document.querySelector('#transcription-display');
            if (container) {
                container.className = (finalText || interimText) ? 'active' : '';
            }
        }
    }

    clearTranscriptionDisplay() {
        const transcriptionElement = document.querySelector('#transcription-text');
        if (transcriptionElement) {
            transcriptionElement.innerHTML = 'Listening...';
        }
    }

    getErrorMessage(errorType) {
        const errorMessages = {
            'no-speech': 'No speech was detected. Please try again.',
            'audio-capture': 'Audio capture failed. Check your microphone.',
            'not-allowed': 'Microphone permission denied. Please allow access.',
            'network': 'Network error occurred. Check your connection.',
            'service-not-allowed': 'Speech service not allowed on this domain.',
            'bad-grammar': 'Grammar compilation failed.',
            'language-not-supported': 'Language not supported.'
        };
        
        return errorMessages[errorType] || `Speech recognition error: ${errorType}`;
    }

    destroy() {
        if (this.recognition) {
            if (this.isRecording) {
                this.recognition.stop();
            }
            this.recognition = null;
        }
        this.transcriptionCallback = null;
        this.errorCallback = null;
        console.log('Voice input destroyed');
    }
}
