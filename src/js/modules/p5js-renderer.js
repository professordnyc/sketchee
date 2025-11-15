/**
 * P5.js Renderer Module
 * Implements dynamic P5.js code execution and canvas management
 */

export class P5JSRenderer {
    constructor(config) {
        this.config = config;
        this.containerId = config.canvas.containerId;
        this.currentSketch = null;
        this.p5Instance = null;
        this.canvasWidth = config.canvas.width || 800;
        this.canvasHeight = config.canvas.height || 600;
        
        console.log('P5JSRenderer module initialized');
    }

    async renderSketch(p5jsCode) {
        console.log('Rendering P5.js sketch:', p5jsCode.substring(0, 100) + '...');
        
        try {
            // Clear any existing sketch
            this.clearCanvas();
            
            // Show loading state
            this.showLoading();
            
            // Validate code before execution
            if (!this.validateCode(p5jsCode)) {
                throw new Error('Invalid P5.js code provided');
            }
            
            // Update code display
            this.updateCodeDisplay(p5jsCode);
            
            // Execute the P5.js code
            await this.executeP5JSCode(p5jsCode);
            
            console.log('Sketch rendered successfully');
            
        } catch (error) {
            console.error('Error rendering sketch:', error);
            this.showError(error.message);
        }
    }

    showLoading() {
        const container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = `
                <div class="canvas-loading">
                    <div class="loading-spinner"></div>
                    Generating your sketch...
                </div>
            `;
        }
    }

    showError(message) {
        const container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = `
                <div class="canvas-error">
                    <div class="error-icon">⚠️</div>
                    <div class="error-message">${message}</div>
                    <div class="error-suggestion">Try a simpler command like "draw a red circle"</div>
                </div>
            `;
            container.classList.remove('has-canvas');
        }
    }

    showPlaceholder(message = "Ready for your voice command") {
        const container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = `<div class="canvas-placeholder">${message}</div>`;
            container.classList.remove('has-canvas');
        }
    }

    clearCanvas() {
        // Remove existing P5.js instance
        if (this.p5Instance) {
            this.p5Instance.remove();
            this.p5Instance = null;
        }
        
        // Reset container
        const container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = '';
            container.classList.remove('has-canvas');
        }
    }

    updateCodeDisplay(code) {
        const codeElement = document.getElementById('generated-code');
        if (codeElement) {
            // Format the code with basic indentation
            const formattedCode = this.formatCode(code);
            codeElement.textContent = formattedCode;
        }
    }

    formatCode(code) {
        // Basic code formatting with proper line breaks and indentation
        return code
            .replace(/;/g, ';\n')
            .replace(/{/g, ' {\n  ')
            .replace(/}/g, '\n}')
            .replace(/\n\s*\n/g, '\n')
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('\n');
    }

    executeP5JSCode(code) {
        return new Promise((resolve, reject) => {
            try {
                // Create a safe execution environment
                const safeCode = this.wrapCodeForExecution(code);
                
                // Create new P5.js instance
                this.p5Instance = new p5((p) => {
                    // Inject the user's code into the p5 context
                    const wrappedCode = safeCode.replace(/createCanvas/g, 'p.createCanvas')
                        .replace(/background/g, 'p.background')
                        .replace(/fill/g, 'p.fill')
                        .replace(/stroke/g, 'p.stroke')
                        .replace(/noStroke/g, 'p.noStroke')
                        .replace(/noFill/g, 'p.noFill')
                        .replace(/ellipse/g, 'p.ellipse')
                        .replace(/circle/g, 'p.circle')
                        .replace(/rect/g, 'p.rect')
                        .replace(/square/g, 'p.square')
                        .replace(/line/g, 'p.line')
                        .replace(/triangle/g, 'p.triangle')
                        .replace(/point/g, 'p.point')
                        .replace(/push/g, 'p.push')
                        .replace(/pop/g, 'p.pop')
                        .replace(/translate/g, 'p.translate')
                        .replace(/rotate/g, 'p.rotate')
                        .replace(/scale/g, 'p.scale')
                        .replace(/frameCount/g, 'p.frameCount')
                        .replace(/width/g, 'p.width')
                        .replace(/height/g, 'p.height')
                        .replace(/mouseX/g, 'p.mouseX')
                        .replace(/mouseY/g, 'p.mouseY')
                        .replace(/mousePressed/g, 'p.mousePressed')
                        .replace(/keyPressed/g, 'p.keyPressed');
                    
                    // Execute the wrapped code
                    try {
                        eval(wrappedCode);
                    } catch (execError) {
                        console.error('Code execution error:', execError);
                        reject(execError);
                    }
                }, this.containerId);
                
                // Mark container as having canvas
                setTimeout(() => {
                    const container = document.getElementById(this.containerId);
                    if (container && container.querySelector('canvas')) {
                        container.classList.add('has-canvas');
                    }
                    resolve();
                }, 100);
                
            } catch (error) {
                reject(error);
            }
        });
    }

    wrapCodeForExecution(code) {
        // Ensure the code has proper setup and draw functions
        let wrappedCode = code;
        
        // Add default setup if missing
        if (!code.includes('function setup')) {
            wrappedCode = `function setup() { createCanvas(${this.canvasWidth}, ${this.canvasHeight}); }\n` + wrappedCode;
        }
        
        // Add default draw if missing  
        if (!code.includes('function draw')) {
            wrappedCode += `\nfunction draw() { /* User code executed in setup */ }`;
        }
        
        // Ensure canvas creation with proper size
        wrappedCode = wrappedCode.replace(
            /createCanvas\([^)]*\)/g, 
            `createCanvas(${this.canvasWidth}, ${this.canvasHeight})`
        );
        
        return wrappedCode;
    }

    validateCode(code) {
        // Basic validation checks
        if (!code || typeof code !== 'string') {
            return false;
        }
        
        // Check for potentially dangerous functions
        const dangerousFunctions = ['eval', 'Function', 'setTimeout', 'setInterval', 'fetch', 'XMLHttpRequest'];
        for (const func of dangerousFunctions) {
            if (code.includes(func)) {
                console.warn(`Potentially dangerous function detected: ${func}`);
                return false;
            }
        }
        
        // Check code length
        if (code.length > 5000) {
            console.warn('Code too long for safe execution');
            return false;
        }
        
        return true;
    }

    resizeCanvas(width, height) {
        if (this.p5Instance && this.p5Instance.resizeCanvas) {
            this.p5Instance.resizeCanvas(width, height);
            this.canvasWidth = width;
            this.canvasHeight = height;
        }
    }

    exportSketch() {
        if (this.p5Instance && this.p5Instance.saveCanvas) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            this.p5Instance.saveCanvas(`sketchee-${timestamp}`, 'png');
        }
    }

    destroy() {
        this.clearCanvas();
        console.log('P5JSRenderer destroyed');
    }

    // Mock function for testing without backend
    renderMockSketch(command) {
        console.log('Rendering mock sketch for:', command);
        
        // Simple mock P5.js code generation based on command
        let mockCode;
        
        if (command.includes('circle') || command.includes('round')) {
            const color = this.extractColor(command) || 'red';
            const colorValues = this.getColorValues(color);
            mockCode = `
function setup() {
    createCanvas(800, 600);
}

function draw() {
    background(240);
    fill(${colorValues.join(', ')});
    ellipse(400, 300, 150, 150);
}`;
        } else if (command.includes('square') || command.includes('rectangle') || command.includes('rect')) {
            const color = this.extractColor(command) || 'blue';
            const colorValues = this.getColorValues(color);
            mockCode = `
function setup() {
    createCanvas(800, 600);
}

function draw() {
    background(240);
    fill(${colorValues.join(', ')});
    rect(350, 250, 100, 100);
}`;
        } else if (command.includes('triangle')) {
            const color = this.extractColor(command) || 'green';
            const colorValues = this.getColorValues(color);
            mockCode = `
function setup() {
    createCanvas(800, 600);
}

function draw() {
    background(240);
    fill(${colorValues.join(', ')});
    triangle(400, 200, 350, 350, 450, 350);
}`;
        } else {
            // Default fallback
            mockCode = `
function setup() {
    createCanvas(800, 600);
}

function draw() {
    background(240);
    fill(150);
    ellipse(400, 300, 100, 100);
}`;
        }
        
        this.renderSketch(mockCode);
    }

    extractColor(text) {
        const colors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'gray'];
        for (const color of colors) {
            if (text.toLowerCase().includes(color)) {
                return color;
            }
        }
        return null;
    }

    getColorValues(colorName) {
        const colorMap = {
            'red': [255, 0, 0],
            'blue': [0, 0, 255],
            'green': [0, 255, 0],
            'yellow': [255, 255, 0],
            'orange': [255, 165, 0],
            'purple': [128, 0, 128],
            'pink': [255, 192, 203],
            'black': [0, 0, 0],
            'white': [255, 255, 255],
            'gray': [128, 128, 128]
        };
        
        return colorMap[colorName] || [100, 100, 100];
    }
}
