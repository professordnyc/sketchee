/**
 * Goose Integration Module
 * Implements Goose subagent communication for P5.js generation
 */

export class GooseIntegration {
    constructor(config) {
        this.config = config;
        this.apiEndpoint = config.goose.endpoint;
        this.timeout = config.goose.timeout;
        this.commandPatterns = config.commandParsing.supportedPatterns;
        this.fallbackTemplates = config.commandParsing.fallbackTemplates;
        
        console.log('GooseIntegration module initialized');
    }

    async generateP5JSCode(voiceCommand) {
        console.log('Generating P5.js code for command:', voiceCommand);
        
        try {
            // Parse the voice command first
            const parsedCommand = this.parseCommand(voiceCommand);
            console.log('Parsed command:', parsedCommand);
            
            // Try to generate code via Goose API
            const generatedCode = await this.callGooseAPI(parsedCommand);
            
            // Validate the generated code
            if (this.validateP5JSCode(generatedCode)) {
                return generatedCode;
            } else {
                console.warn('Generated code failed validation, using fallback');
                return this.generateFallbackCode(parsedCommand);
            }
            
        } catch (error) {
            console.error('Goose integration error:', error);
            return this.generateFallbackCode(this.parseCommand(voiceCommand));
        }
    }

    parseCommand(command) {
        const cleanCommand = command.toLowerCase().trim();
        
        // Initialize parsed result
        const parsed = {
            action: 'create',
            shape: 'circle',
            color: 'blue',
            size: 'medium',
            position: 'center',
            animation: null,
            count: 1,
            originalCommand: command
        };
        
        // Extract shape
        if (cleanCommand.includes('circle') || cleanCommand.includes('round')) {
            parsed.shape = 'circle';
        } else if (cleanCommand.includes('square')) {
            parsed.shape = 'square';
        } else if (cleanCommand.includes('rectangle') || cleanCommand.includes('rect')) {
            parsed.shape = 'rectangle';
        } else if (cleanCommand.includes('triangle')) {
            parsed.shape = 'triangle';
        } else if (cleanCommand.includes('line')) {
            parsed.shape = 'line';
        }
        
        // Extract color
        const colors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'gray', 'brown'];
        for (const color of colors) {
            if (cleanCommand.includes(color)) {
                parsed.color = color;
                break;
            }
        }
        
        // Extract size
        if (cleanCommand.includes('big') || cleanCommand.includes('large') || cleanCommand.includes('huge')) {
            parsed.size = 'large';
        } else if (cleanCommand.includes('small') || cleanCommand.includes('tiny') || cleanCommand.includes('little')) {
            parsed.size = 'small';
        }
        
        // Extract position
        if (cleanCommand.includes('center') || cleanCommand.includes('middle')) {
            parsed.position = 'center';
        } else if (cleanCommand.includes('top')) {
            parsed.position = 'top';
        } else if (cleanCommand.includes('bottom')) {
            parsed.position = 'bottom';
        } else if (cleanCommand.includes('left')) {
            parsed.position = 'left';
        } else if (cleanCommand.includes('right')) {
            parsed.position = 'right';
        }
        
        // Extract animation
        if (cleanCommand.includes('spin') || cleanCommand.includes('rotate') || cleanCommand.includes('turning')) {
            parsed.animation = 'rotate';
        } else if (cleanCommand.includes('bounce') || cleanCommand.includes('jump')) {
            parsed.animation = 'bounce';
        } else if (cleanCommand.includes('move') || cleanCommand.includes('drift')) {
            parsed.animation = 'move';
        }
        
        // Extract count
        const numberWords = {
            'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
            'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
        };
        
        for (const [word, num] of Object.entries(numberWords)) {
            if (cleanCommand.includes(word)) {
                parsed.count = num;
                break;
            }
        }
        
        // Check for numerical digits
        const numberMatch = cleanCommand.match(/\b(\d+)\b/);
        if (numberMatch) {
            const num = parseInt(numberMatch[1]);
            if (num > 0 && num <= 20) {
                parsed.count = num;
            }
        }
        
        return parsed;
    }

    async callGooseAPI(parsedCommand) {
        // This would normally call the actual Goose API
        // For MVP, we'll simulate the API call and return generated code
        
        const requestPayload = {
            command: parsedCommand.originalCommand,
            parsed: parsedCommand,
            context: {
                canvas: {
                    width: 800,
                    height: 600
                },
                style: 'modern',
                complexity: 'simple'
            }
        };
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        // For now, generate code based on parsed command
        return this.generateCodeFromParsedCommand(parsedCommand);
    }

    generateCodeFromParsedCommand(parsed) {
        const colorValues = this.getColorValues(parsed.color);
        const sizeValue = this.getSizeValue(parsed.size);
        const position = this.getPositionValues(parsed.position);
        
        let setupCode = 'function setup() {\n  createCanvas(800, 600);\n}';
        let drawCode = 'function draw() {\n  background(240, 240, 240);';
        
        // Add styling
        drawCode += `\n  fill(${colorValues.join(', ')});`;
        drawCode += '\n  stroke(0);\n  strokeWeight(2);';
        
        // Handle animation
        if (parsed.animation === 'rotate') {
            drawCode += '\n  \n  push();';
            drawCode += `\n  translate(${position.x}, ${position.y});`;
            drawCode += '\n  rotate(frameCount * 0.05);';
            
            // Draw shape at origin for rotation
            drawCode += this.generateShapeCode(parsed.shape, 0, 0, sizeValue);
            
            drawCode += '\n  pop();';
        } else if (parsed.count > 1) {
            // Draw multiple shapes
            for (let i = 0; i < parsed.count; i++) {
                const offsetX = (i - (parsed.count - 1) / 2) * (sizeValue + 20);
                drawCode += this.generateShapeCode(parsed.shape, position.x + offsetX, position.y, sizeValue);
            }
        } else {
            // Single static shape
            drawCode += this.generateShapeCode(parsed.shape, position.x, position.y, sizeValue);
        }
        
        drawCode += '\n}';
        
        return setupCode + '\n\n' + drawCode;
    }

    generateShapeCode(shape, x, y, size) {
        switch (shape) {
            case 'circle':
                return `\n  ellipse(${x}, ${y}, ${size}, ${size});`;
            case 'square':
                return `\n  rectMode(CENTER);\n  rect(${x}, ${y}, ${size}, ${size});`;
            case 'rectangle':
                return `\n  rectMode(CENTER);\n  rect(${x}, ${y}, ${size}, ${size * 0.6});`;
            case 'triangle':
                const halfSize = size / 2;
                return `\n  triangle(${x}, ${y - halfSize}, ${x - halfSize}, ${y + halfSize}, ${x + halfSize}, ${y + halfSize});`;
            case 'line':
                return `\n  strokeWeight(5);\n  line(${x - size/2}, ${y}, ${x + size/2}, ${y});`;
            default:
                return `\n  ellipse(${x}, ${y}, ${size}, ${size});`;
        }
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

    getSizeValue(sizeCategory) {
        const sizeMap = {
            'small': 80,
            'medium': 150,
            'large': 250
        };
        
        return sizeMap[sizeCategory] || 150;
    }

    getPositionValues(position) {
        const positionMap = {
            'center': { x: 400, y: 300 },
            'top': { x: 400, y: 150 },
            'bottom': { x: 400, y: 450 },
            'left': { x: 200, y: 300 },
            'right': { x: 600, y: 300 }
        };
        
        return positionMap[position] || { x: 400, y: 300 };
    }

    validateP5JSCode(code) {
        if (!code || typeof code !== 'string') {
            return false;
        }
        
        // Check for required functions
        const hasSetup = code.includes('function setup');
        const hasDraw = code.includes('function draw');
        const hasCreateCanvas = code.includes('createCanvas');
        
        if (!hasSetup || !hasDraw || !hasCreateCanvas) {
            console.warn('Generated code missing required P5.js functions');
            return false;
        }
        
        // Check for dangerous code
        const dangerousPatterns = [
            'eval', 'Function', 'setTimeout', 'setInterval', 
            'fetch', 'XMLHttpRequest', 'import', 'require',
            'document.', 'window.', 'localStorage', 'sessionStorage'
        ];
        
        for (const pattern of dangerousPatterns) {
            if (code.includes(pattern)) {
                console.warn(`Potentially dangerous pattern detected: ${pattern}`);
                return false;
            }
        }
        
        // Check code length (security measure)
        if (code.length > 10000) {
            console.warn('Generated code too long');
            return false;
        }
        
        return true;
    }

    generateFallbackCode(parsedCommand) {
        console.log('Generating fallback code for:', parsedCommand);
        
        // Use simple template based on shape
        const colorValues = this.getColorValues(parsedCommand.color);
        const sizeValue = this.getSizeValue(parsedCommand.size);
        
        if (parsedCommand.shape === 'circle') {
            return this.fallbackTemplates.coloredShape
                .replace(/{r}/g, colorValues[0])
                .replace(/{g}/g, colorValues[1])
                .replace(/{b}/g, colorValues[2])
                .replace(/{shape}/g, 'ellipse')
                .replace(/{x}/g, '400')
                .replace(/{y}/g, '300')
                .replace(/{size}/g, sizeValue);
        } else if (parsedCommand.animation === 'rotate') {
            return this.fallbackTemplates.animatedShape
                .replace(/{r}/g, colorValues[0])
                .replace(/{g}/g, colorValues[1])
                .replace(/{b}/g, colorValues[2])
                .replace(/{shape}/g, 'rect')
                .replace(/{size}/g, sizeValue)
                .replace(/{speed}/g, '0.05');
        } else {
            // Default simple shape
            return `function setup() {
  createCanvas(800, 600);
}

function draw() {
  background(240, 240, 240);
  fill(${colorValues.join(', ')});
  stroke(0);
  strokeWeight(2);
  ellipse(400, 300, ${sizeValue}, ${sizeValue});
}`;
        }
    }

    async handleApiError(error) {
        console.error('Goose API error:', error);
        
        // Log error details for debugging
        const errorDetails = {
            timestamp: new Date().toISOString(),
            error: error.message,
            stack: error.stack
        };
        
        console.log('Error details:', errorDetails);
        
        // Could implement error reporting to analytics service here
        
        throw new Error('Failed to generate P5.js code via Goose API');
    }
}
