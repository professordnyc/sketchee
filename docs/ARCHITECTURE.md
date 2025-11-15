# Sketchee MVP - Technical Architecture

## Overview
Voice-controlled P5.js sketch generator with real-time code generation via Goose subagent and ElevenLabs voice feedback.

## System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Voice Input   │    │   Goose Agent    │    │  ElevenLabs     │
│  (Web Speech)   │    │  (P5.js Gen)     │    │    (TTS)        │
└─────────┬───────┘    └─────────┬────────┘    └─────────┬───────┘
          │                      │                       │
          │                      │                       │
          ▼                      ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend Application                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Voice UI    │  │  Canvas     │  │     Code Display        │  │
│  │ Controls    │  │ (P5.js)     │  │      Panel              │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Voice Command Processing Pipeline
1. **Voice Input** → Web Speech API captures audio
2. **Transcription** → Speech-to-text conversion
3. **Command Parsing** → Extract intent (shape, color, action)
4. **Goose Integration** → Generate P5.js code from natural language
5. **Code Validation** → Syntax and security checks
6. **Canvas Rendering** → Execute P5.js code on canvas
7. **Voice Feedback** → ElevenLabs TTS confirmation

### Component Communication
```javascript
VoiceInput → App → GooseIntegration → P5JSRenderer
    ↓                      ↓               ↓
StatusFeedback ← ElevenLabsTTS ← CodeDisplay
```

## Module Specifications

### 1. VoiceInput Module (`src/js/modules/voice-input.js`)
**Responsibility**: Web Speech API integration
**Dependencies**: Browser Speech Recognition API
**Key Methods**:
- `startRecording()` - Begin voice capture
- `stopRecording()` - End capture, process final result
- `onTranscription(callback)` - Handle real-time transcription
- `onError(callback)` - Error handling

### 2. GooseIntegration Module (`src/js/modules/goose-integration.js`)
**Responsibility**: Natural language → P5.js code generation
**Dependencies**: Goose subagent API
**Key Methods**:
- `generateP5JSCode(voiceCommand)` - Main generation endpoint
- `parseCommand(command)` - Extract drawing intent
- `validateP5JSCode(code)` - Security/syntax validation
- `getFallbackCode()` - Error recovery

### 3. ElevenLabsTTS Module (`src/js/modules/elevenlabs-tts.js`)
**Responsibility**: Voice feedback and confirmation
**Dependencies**: ElevenLabs API
**Key Methods**:
- `speak(text)` - Convert text to speech
- `speakConfirmation()` - Success feedback
- `speakError()` - Error announcement
- `stopSpeaking()` - Cancel current speech

### 4. P5JSRenderer Module (`src/js/modules/p5js-renderer.js`)
**Responsibility**: Dynamic P5.js execution and canvas management
**Dependencies**: P5.js library
**Key Methods**:
- `renderSketch(p5jsCode)` - Execute and display sketch
- `clearCanvas()` - Reset canvas state
- `updateCodeDisplay(code)` - Show generated code
- `executeP5JSCode(code)` - Safe code execution

## Configuration System

### Voice Configuration (`config/voice/speech-config.json`)
- Speech recognition settings
- ElevenLabs API configuration
- Feedback message templates
- Timeout values

### P5.js Configuration (`config/p5js/canvas-config.json`)
- Canvas dimensions and settings
- Default colors and styles
- Supported shapes and commands
- Performance limits

### Goose Integration (`config/goose/integration-config.json`)
- API endpoints and timeouts
- Command parsing patterns
- Code generation templates
- Error handling strategies

## Security Considerations

### Code Execution Safety
1. **Syntax Validation**: Parse P5.js code before execution
2. **Function Whitelist**: Only allow safe P5.js functions
3. **Resource Limits**: Restrict canvas size, animation complexity
4. **Input Sanitization**: Clean voice commands before processing

### API Security
1. **API Key Management**: Store credentials securely
2. **Request Validation**: Validate all external API calls
3. **Rate Limiting**: Prevent API abuse
4. **Error Isolation**: Don't expose internal errors to users

## Performance Optimization

### Voice Processing
- Minimize speech recognition restarts
- Debounce rapid voice commands
- Cache common command patterns

### Code Generation
- Use fallback templates for common shapes
- Implement request timeout/retry logic
- Cache successful code generations

### Canvas Rendering
- Limit P5.js sketch complexity
- Use requestAnimationFrame for smooth animations
- Implement canvas size constraints

## Error Handling Strategy

### Voice Input Errors
- Browser compatibility fallback (text input)
- Microphone permission handling
- Network connectivity issues

### Code Generation Errors
- Goose API timeout → Use fallback templates
- Parse errors → Show simple default sketch
- Invalid commands → Voice error feedback

### Rendering Errors
- P5.js syntax errors → Display error message
- Canvas initialization failure → Show placeholder
- Performance issues → Simplify sketch complexity

## Development Workflow

### Parallel Development Support
1. **Frontend** can work on UI/Voice independently using mock data
2. **Backend** can develop Goose/ElevenLabs integration with test UI
3. **Integration points** clearly defined via configuration files
4. **Mock/fallback** systems allow independent testing

### Testing Strategy
- Unit tests for each module
- Integration tests for complete pipeline
- Cross-browser compatibility testing
- Voice command accuracy testing

## Deployment Considerations

### Local Development
- Simple HTTP server for file serving
- No build process required for MVP
- Configuration files for easy customization

### Production Readiness
- HTTPS required for Web Speech API
- API key environment variable management
- CDN hosting for P5.js and other assets
- Error monitoring and logging
