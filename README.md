# Sketchee MVP

Voice-controlled P5.js sketch generator that transforms spoken descriptions into interactive visual sketches using Goose integration with optional ElevenLabs TTS via a secure backend.

## 🚀 Quick Start

### Prerequisites
- Modern web browser with Web Speech API support (Chrome recommended)
- Node.js 16+ (for local development)
- Internet connection (for external APIs)

### Local Setup
```bash
cd sketchee-mvp
npm install

# create your local env file
cp env.template .env
# edit .env and set ELEVENLABS_API_KEY (optional) and other values as needed

# start backend (port 3001) and frontend (port 8080) together
npm run dev
```

Then open http://localhost:8080 in your browser.

### 💡 Usage (MVP)
1. Click **"Start Recording"**.
2. Say a command like **"Draw a red circle"**.
3. The app will:
   - Capture your speech via the Web Speech API.
   - Generate P5.js code (using Goose integration and/or mock logic).
   - Render the sketch on the canvas.
   - Provide voice feedback:
     - Uses **ElevenLabs TTS** if the backend can load a valid API key.
     - Otherwise falls back to **browser Web Speech synthesis**.

## � Deployment

This project is designed to be deployed with a static frontend and a small Node/Express backend:

- **Backend (API server)**: Render Web Service
  - Build command: `npm install`
  - Start command: `node src/server/index.js`
  - Environment variables (examples):
    - `NODE_ENV=production`
    - `ELEVENLABS_API_KEY=...` (optional, used only by the backend)
    - `CLIENT_ORIGIN=https://<your-netlify-site>.netlify.app`
    - `ALLOWED_ORIGINS=https://<your-netlify-site>.netlify.app`

- **Frontend (static app)**: Netlify
  - Build command: _empty_ (no build step required)
  - Publish directory: `.` (repository root with `index.html`)

The ElevenLabs TTS module automatically uses:

- `http://localhost:3001` when running locally.
- Your deployed backend URL (e.g. `https://sketchee-api.onrender.com`) in production.

## � Project Structure

```
sketchee-mvp/
├── index.html              # Main application entry point
├── package.json            # Dependencies and scripts
├── README.md              # This file
├── .gitignore             # Git ignore rules
├── src/                   # Source code
│   ├── js/                # JavaScript modules
│   │   ├── app.js         # Main app coordination
│   │   └── modules/       # Core functionality modules
│   │       ├── voice-input.js      # Web Speech API integration
│   │       ├── goose-integration.js # Goose AI for P5.js generation
│   │       ├── elevenlabs-tts.js   # Voice feedback
│   │       └── p5js-renderer.js    # Canvas rendering
│   └── css/               # Styles
│       ├── styles.css     # Main application styles
│       ├── voice-controls.css # Voice UI components
│       └── canvas-display.css # Canvas and code display
├── config/                # Configuration files
│   ├── voice/             # Voice and TTS settings
│   ├── p5js/              # Canvas and rendering config
│   └── goose/             # Goose integration settings
├── docs/                  # Technical documentation
│   ├── ARCHITECTURE.md    # System architecture
│   └── API_INTEGRATION.md # API integration guide
└── tests/                 # Test suite
    ├── unit/              # Unit tests
    ├── integration/       # End-to-end tests
    └── run-tests.js       # Test runner
```

## 🛠️ Development Team Roles

### 🏗️ Architect (COMPLETE)
- ✅ Project structure and scaffolding
- ✅ Configuration system setup
- ✅ Module interface definitions
- ✅ Technical documentation

### 💻 Frontend Developer (TODO)
**Priority Tasks** (12 minutes):
1. **Voice Input Integration** - Implement Web Speech API in `voice-input.js`
2. **UI Components** - Build recording controls and transcription display
3. **P5.js Canvas** - Dynamic code execution and canvas management
4. **Responsive Layout** - Finish CSS implementation

### 🔧 Backend Developer (TODO)
**Priority Tasks** (15 minutes):
1. **Goose Integration** - Natural language → P5.js code generation
2. **Command Parsing** - Extract shapes, colors, positions from voice
3. **ElevenLabs TTS** - Voice feedback implementation
4. **Error Handling** - Graceful fallbacks and recovery

### 🧪 QA Engineer (TODO)
**Priority Tasks** (3 minutes):
1. **End-to-End Testing** - Voice command to sketch rendering
2. **Browser Compatibility** - Web Speech API across browsers
3. **Error Scenario Testing** - Edge cases and failure modes

## 🎯 MVP Success Criteria

### Must Have Features
- [ ] Voice command "Draw a red circle" generates working P5.js sketch
- [ ] Generated sketch displays in browser canvas
- [ ] Voice feedback confirms successful generation
- [ ] Basic error handling for unsupported browsers

### Voice Commands Supported
- Basic shapes: "draw a [color] [shape]"
- Positioning: "put it in the center"
- Modifications: "make it bigger", "change color to blue"
- Simple animations: "make it spin"

## 🔧 Configuration

### API Setup
1. **ElevenLabs API**: Add your API key to `config/voice/elevenlabs-api-key.txt`
2. **Goose Integration**: Configure endpoint in `config/goose/integration-config.json`

### Voice Settings
Edit `config/voice/speech-config.json` to customize:
- Speech recognition language
- Voice feedback settings
- Timeout values
- Error messages

### Canvas Settings
Edit `config/p5js/canvas-config.json` to customize:
- Canvas dimensions
- Default colors and shapes
- Performance limits
- Supported command patterns

## 🚨 Troubleshooting

### Voice Input Not Working
- Ensure browser supports Web Speech API
- Check microphone permissions
- Try Chrome browser for best compatibility

### Sketch Not Rendering
- Check browser console for P5.js errors
- Verify generated code in code display panel
- Ensure canvas container is properly sized

### Voice Feedback Silent
- Check ElevenLabs API configuration
- Verify internet connection
- Fallback to browser TTS if API unavailable

## 📖 API Documentation

### Goose Integration
See `docs/API_INTEGRATION.md` for:
- Request/response formats
- Error handling
- Command parsing patterns

### Voice Commands
Supported patterns:
- `"draw a {color} {shape}"` → Basic shape creation
- `"make it {action}"` → Modify current sketch
- `"change color to {color}"` → Color modification

## 🎨 Example Voice Commands

```
"Draw a red circle"
→ Creates centered red ellipse

"Make a big blue square"
→ Creates large blue rectangle

"Draw three green triangles"
→ Creates multiple triangular shapes

"Make it spin slowly"
→ Adds rotation animation

"Change the background to yellow"
→ Updates canvas background color
```

## 📝 Development Notes

### Challenge Context & Agent Orchestration

This project was created as a quick entry into Block and Code.tv's **nokeyboardsallowed.dev** challenge.

Sketchee was built using **Goose** (Desktop UI for Windows or CLI, also available for Mac and Linux) and its agent runtime to orchestrate multiple subagents:

- **Project Planner / Manager** – created a `project_board.md` to define and track tasks.
- **Architect** – defined structure and module interfaces.
- **Frontend Developer** – implemented voice UI, P5.js rendering, and client wiring.
- **Backend Developer** – implemented the secure ElevenLabs API key service and Express server.
- **QA Engineer** – focused on flow validation and error handling.

A neat feature of Goose is parallel subagent execution: in this project, frontend and backend agents could work **in parallel** against the same plan, coordinated by the planner.

For a quick how-to on using Goose agents, recipes, and reusable workflows, see:

- https://www.youtube.com/watch?v=yIBrD5AxtTc&t=316s

### Parallel Development
- Frontend and Backend can work simultaneously
- Mock data and fallbacks provided for independent testing
- Configuration-driven integration points

### Performance Considerations
- P5.js sketches limited to 50 lines for MVP
- Voice recognition debounced to prevent spam
- Canvas size constrained for smooth rendering

### Browser Support
- **Primary**: Chrome (full Web Speech API support)
- **Secondary**: Firefox (limited speech recognition)
- **Fallback**: Text input for unsupported browsers

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

This is an MVP sprint project. Focus on core functionality over features.

### Development Workflow
1. Clone repository
2. Install dependencies: `npm install`
3. Start development: `npm run dev`
4. Run tests: `npm test`
5. Submit focused pull requests


