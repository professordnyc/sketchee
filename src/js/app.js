/**
 * Sketchee MVP - Main Application Entry Point
 * Frontend implementation with mock backend integration
 */

import { VoiceInput } from './modules/voice-input.js';
import { GooseIntegration } from './modules/goose-integration.js';
import { ElevenLabsTTS } from './modules/elevenlabs-tts.js';
import { P5JSRenderer } from './modules/p5js-renderer.js';

class SketcheeApp {
    constructor() {
        this.voiceInput = null;
        this.gooseIntegration = null;
        this.tts = null;
        this.renderer = null;
        this.config = null;
        this.isProcessing = false;
        
        console.log('Sketchee MVP initializing...');
    }

    async initialize() {
        try {
            // Load configuration
            await this.loadConfiguration();
            
            // Initialize modules
            await this.initializeModules();
            
            // Set up event handlers
            this.setupEventHandlers();
            
            console.log('Sketchee MVP initialized successfully');
            this.updateStatus('Ready to record! Click "Start Recording" and say something like "draw a red circle"');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.updateStatus('Failed to initialize. Please refresh the page.', 'error');
        }
    }

    async loadConfiguration() {
        try {
            // Load voice configuration
            const voiceConfigResponse = await fetch('/config/voice/speech-config.json');
            const voiceConfig = await voiceConfigResponse.json();
            
            // Load P5.js configuration  
            const p5ConfigResponse = await fetch('/config/p5js/canvas-config.json');
            const p5Config = await p5ConfigResponse.json();
            
            // Load Goose configuration
            const gooseConfigResponse = await fetch('/config/goose/integration-config.json');
            const gooseConfig = await gooseConfigResponse.json();
            
            this.config = {
                voice: voiceConfig,
                p5js: p5Config,
                goose: gooseConfig
            };
            
        } catch (error) {
            console.warn('Failed to load configuration, using defaults:', error);
            // Use default configuration
            this.config = this.getDefaultConfig();
        }
    }

    getDefaultConfig() {
        return {
            voice: {
                speechRecognition: {
                    language: 'en-US',
                    continuous: false,
                    interimResults: true,
                    maxAlternatives: 1
                },
                elevenlabs: {
                    voice: { voiceId: 'default' }
                },
                feedback: {
                    confirmationMessages: ['Your sketch has been created'],
                    errorMessages: ['I couldn\'t understand that command'],
                    processingMessages: ['Creating your sketch']
                }
            },
            p5js: {
                canvas: {
                    width: 800,
                    height: 600,
                    containerId: 'p5js-container'
                }
            },
            goose: {
                endpoint: '/api/generate-sketch',
                timeout: 15000
            }
        };
    }

    async initializeModules() {
        // Initialize TTS first (for feedback)
        this.tts = new ElevenLabsTTS(this.config.voice);
        
        // Initialize P5.js renderer
        this.renderer = new P5JSRenderer(this.config.p5js);
        
        // Initialize Goose integration
        this.gooseIntegration = new GooseIntegration(this.config.goose);
        
        // Initialize voice input
        this.voiceInput = new VoiceInput(this.config.voice);
        await this.voiceInput.initialize();
        
        console.log('All modules initialized');
    }

    setupEventHandlers() {
        // Voice input event handlers
        this.voiceInput.onTranscription((result) => {
            if (result.isFinal && result.final.trim()) {
                this.processVoiceCommand(result.final.trim());
            }
        });

        this.voiceInput.onError((error) => {
            console.error('Voice input error:', error);
            this.updateStatus(error.message, 'error');
            this.tts.speakError();
        });

        // Record button handler
        const recordButton = document.getElementById('record-button');
        if (recordButton) {
            recordButton.addEventListener('click', () => {
                if (this.voiceInput.isRecording) {
                    this.stopVoiceSession();
                } else {
                    this.startVoiceSession();
                }
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Space' && !event.repeat) {
                event.preventDefault();
                if (this.voiceInput.isRecording) {
                    this.stopVoiceSession();
                } else {
                    this.startVoiceSession();
                }
            }
        });

        console.log('Event handlers set up');
    }

    async startVoiceSession() {
        if (this.isProcessing) {
            console.warn('Already processing a command');
            return;
        }

        try {
            this.updateStatus('Click the button again or press Space to stop recording', 'processing');
            this.voiceInput.startRecording();
        } catch (error) {
            console.error('Failed to start voice session:', error);
            this.updateStatus('Failed to start recording. Check microphone permissions.', 'error');
        }
    }

    async stopVoiceSession() {
        try {
            this.voiceInput.stopRecording();
            this.updateStatus('Processing your command...', 'processing');
        } catch (error) {
            console.error('Failed to stop voice session:', error);
        }
    }

    async processVoiceCommand(transcription) {
        if (this.isProcessing) {
            return;
        }

        this.isProcessing = true;
        
        try {
            console.log('Processing voice command:', transcription);
            this.updateStatus('Generating your sketch...', 'processing');
            
            // Announce processing
            await this.tts.speakProcessing();
            
            // Generate sketch using Goose integration (with fallback to mock)
            const p5jsCode = await this.generateSketch(transcription);
            
            // Render the sketch
            await this.renderSketch(p5jsCode);
            
            // Provide success feedback
            this.updateStatus('Sketch created successfully! Try another command.', 'success');
            await this.tts.speakConfirmation();
            
        } catch (error) {
            console.error('Error processing voice command:', error);
            this.updateStatus('Failed to create sketch. Please try again.', 'error');
            await this.tts.speakError();
            
            // Show fallback sketch
            this.renderer.showError('Could not generate sketch. Try a simpler command.');
        } finally {
            this.isProcessing = false;
        }
    }

    async generateSketch(command) {
        try {
            // Try Goose integration first
            return await this.gooseIntegration.generateP5JSCode(command);
        } catch (error) {
            console.warn('Goose integration failed, using mock generation:', error);
            // Fallback to mock generation for demo purposes
            return this.generateMockSketch(command);
        }
    }

    generateMockSketch(command) {
        const cmd = command.toLowerCase();
        
        if (cmd.includes('circle')) {
            const color = this.extractColor(cmd) || 'red';
            const size = cmd.includes('big') || cmd.includes('large') ? 200 : cmd.includes('small') ? 80 : 150;
            return this.createCircleSketch(color, size);
        } else if (cmd.includes('square') || cmd.includes('rectangle')) {
            const color = this.extractColor(cmd) || 'blue'; 
            const size = cmd.includes('big') || cmd.includes('large') ? 200 : cmd.includes('small') ? 80 : 120;
            return this.createSquareSketch(color, size);
        } else if (cmd.includes('triangle')) {
            const color = this.extractColor(cmd) || 'green';
            const size = cmd.includes('big') || cmd.includes('large') ? 200 : cmd.includes('small') ? 80 : 120;
            return this.createTriangleSketch(color, size);
        } else if (cmd.includes('spin') || cmd.includes('rotate')) {
            return this.createSpinningSketch();
        } else {
            return this.createDefaultSketch();
        }
    }

    createCircleSketch(color, size) {
        const colorValues = this.getColorValues(color);
        return `function setup() {
    createCanvas(800, 600);
}

function draw() {
    background(240, 240, 240);
    fill(${colorValues.join(', ')});
    stroke(0);
    strokeWeight(2);
    ellipse(width / 2, height / 2, ${size}, ${size});
}`;
    }

    createSquareSketch(color, size) {
        const colorValues = this.getColorValues(color);
        return `function setup() {
    createCanvas(800, 600);
}

function draw() {
    background(240, 240, 240);
    fill(${colorValues.join(', ')});
    stroke(0);
    strokeWeight(2);
    rectMode(CENTER);
    rect(width / 2, height / 2, ${size}, ${size});
}`;
    }

    createTriangleSketch(color, size) {
        const colorValues = this.getColorValues(color);
        const halfSize = size / 2;
        return `function setup() {
    createCanvas(800, 600);
}

function draw() {
    background(240, 240, 240);
    fill(${colorValues.join(', ')});
    stroke(0);
    strokeWeight(2);
    triangle(width / 2, height / 2 - ${halfSize}, 
             width / 2 - ${halfSize}, height / 2 + ${halfSize}, 
             width / 2 + ${halfSize}, height / 2 + ${halfSize});
}`;
    }

    createSpinningSketch() {
        return `function setup() {
    createCanvas(800, 600);
}

function draw() {
    background(240, 240, 240);
    
    push();
    translate(width / 2, height / 2);
    rotate(frameCount * 0.05);
    
    fill(255, 100, 150);
    stroke(0);
    strokeWeight(2);
    rectMode(CENTER);
    rect(0, 0, 100, 100);
    
    pop();
}`;
    }

    createDefaultSketch() {
        return `function setup() {
    createCanvas(800, 600);
}

function draw() {
    background(240, 240, 240);
    fill(100, 150, 200);
    stroke(0);
    strokeWeight(2);
    ellipse(width / 2, height / 2, 120, 120);
}`;
    }

    extractColor(text) {
        const colors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'gray', 'brown'];
        for (const color of colors) {
            if (text.includes(color)) {
                return color;
            }
        }
        return null;
    }

    getColorValues(colorName) {
        const colorMap = {
            'red': [255, 80, 80],
            'blue': [80, 120, 255],
            'green': [80, 255, 120],
            'yellow': [255, 255, 80],
            'orange': [255, 165, 80],
            'purple': [200, 100, 255],
            'pink': [255, 150, 200],
            'black': [50, 50, 50],
            'white': [255, 255, 255],
            'gray': [150, 150, 150],
            'brown': [165, 100, 80]
        };
        
        return colorMap[colorName] || [100, 150, 200];
    }

    async renderSketch(p5jsCode) {
        try {
            await this.renderer.renderSketch(p5jsCode);
            console.log('Sketch rendered successfully');
        } catch (error) {
            console.error('Error rendering sketch:', error);
            throw error;
        }
    }

    updateStatus(message, type = '') {
        const statusElement = document.getElementById('recording-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `status-message ${type}`;
        }
        console.log(`Status (${type}): ${message}`);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new SketcheeApp();
    app.initialize();
    
    // Make app globally accessible for debugging
    window.SketcheeApp = app;
    
    // Show browser compatibility info
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        const statusElement = document.getElementById('recording-status');
        if (statusElement) {
            statusElement.innerHTML = '⚠️ Voice input not supported. Please use Chrome browser.';
            statusElement.className = 'status-message error';
        }
    }
});
