# API Integration Guide

## Goose Subagent Integration

### Expected Request Format
```javascript
{
  "command": "draw a red circle in the center",
  "context": {
    "canvas": {
      "width": 800,
      "height": 600
    },
    "previous_shapes": [],
    "user_session": "session_id"
  }
}
```

### Expected Response Format
```javascript
{
  "success": true,
  "p5js_code": "function setup() { createCanvas(800, 600); } function draw() { background(240); fill(255, 0, 0); ellipse(400, 300, 100, 100); }",
  "explanation": "Created a red circle at the center of the canvas",
  "shapes_added": [
    {
      "type": "ellipse",
      "color": [255, 0, 0],
      "position": [400, 300],
      "size": [100, 100]
    }
  ]
}
```

### Error Response Format
```javascript
{
  "success": false,
  "error": "Could not parse command",
  "fallback_code": "function setup() { createCanvas(800, 600); } function draw() { background(240); }",
  "suggestion": "Try saying 'draw a red circle' or 'create a blue square'"
}
```

## ElevenLabs TTS Integration

### Audio Generation Request
```javascript
{
  "text": "Your sketch has been created",
  "voice_settings": {
    "voice_id": "21m00Tcm4TlvDq8ikWAM",
    "stability": 0.5,
    "similarity_boost": 0.5
  },
  "model_id": "eleven_monolingual_v1"
}
```

### Response Handling
- Audio stream or base64 encoded audio
- Error handling for quota/rate limits
- Fallback to Web Speech API if needed

## Voice Command Patterns

### Supported Command Types

#### Basic Shapes
- "draw a [color] [shape]"
- "create a [shape] that is [color]"
- "make a [size] [color] [shape]"

#### Positioning
- "draw a circle in the center"
- "put a square in the top left"
- "create a triangle at the bottom"

#### Modifications
- "make it bigger"
- "change the color to blue"
- "make it spin"
- "add another one"

#### Multiple Objects
- "draw three red circles"
- "create five blue squares"
- "make a row of triangles"

### Command Parsing Pipeline
1. **Speech Recognition** → Raw transcription
2. **Text Normalization** → Clean and standardize
3. **Pattern Matching** → Match to known patterns
4. **Intent Extraction** → Extract shape, color, position, action
5. **Context Integration** → Consider previous commands
6. **Goose Processing** → Generate P5.js code
