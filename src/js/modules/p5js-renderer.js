/**
 * P5.js Renderer Module - FIXED VERSION
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
        
        console.log('🎨 P5JSRenderer initialized');
    }

    async renderSketch(p5jsCode) {
        console.log('🚀 Starting sketch render:', p5jsCode.substring(0, 100) + '...');
        
        try {
            // Clear any existing sketch
            this.clearCanvas();
            
            // Show loading state briefly
            this.showLoading();
            
            // Small delay to show loading
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Validate code before execution
            if (!this.validateCode(p5jsCode)) {
                throw new Error('Invalid P5.js code provided');
            }
            
            // Update code display
            this.updateCodeDisplay(p5jsCode);
            
            // Execute the P5.js code
            await this.executeP5JSCode(p5jsCode);
            
            console.log('✅ Sketch rendered successfully');
            
        } catch (error) {
            console.error('❌ Error rendering sketch:', error);
            this.showError(error.message);
            throw error;
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
            container.classList.remove('has-canvas');
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

    clearCanvas() {
        // Remove existing P5.js instance
        if (this.p5Instance) {
            try {
                this.p5Instance.remove();
            } catch (e) {
                console.warn('Error removing P5 instance:', e);
            }
            this.p5Instance = null;
        }
        
        // Reset container
        const container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = '';
            container.classList.remove('has-canvas', 'success');
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
        // Basic code formatting
        return code
            .replace(/;/g, ';\n')
            .replace(/{/g, ' {\n  ')
            .replace(/}/g, '\n}')
            .replace(/\n\s*\n/g, '\n')
            .trim();
    }

    async executeP5JSCode(code) {
        return new Promise((resolve, reject) => {
            console.log('🎯 Executing P5.js code...');
            
            try {
                // Ensure we have the P5.js library
                if (typeof p5 === 'undefined') {
                    throw new Error('P5.js library not loaded');
                }
                
                // Wrap and prepare code
                const wrappedCode = this.wrapCodeForExecution(code);
                console.log('📝 Wrapped code:', wrappedCode);
                
                // Clear container first
                const container = document.getElementById(this.containerId);
                if (!container) {
                    throw new Error('Canvas container not found');
                }
                container.innerHTML = '';
                
                // Create P5.js instance with proper error handling
                this.p5Instance = new p5((p) => {
                    console.log('🎨 P5.js sketch function called');
                    
                    try {
                        // Replace P5.js functions with p. prefixed versions
                        const processedCode = this.processFunctionCalls(wrappedCode, p);
                        console.log('🔧 Processed code:', processedCode);
                        
                        // Execute the code in the P5 context
                        const func = new Function('p', processedCode);
                        func(p);
                        
                        console.log('✅ P5.js code executed successfully');
                        
                    } catch (execError) {
                        console.error('❌ P5.js execution error:', execError);
                        reject(execError);
                        return;
                    }
                }, this.containerId);
                
                // Wait a bit for the canvas to be created, then resolve
                setTimeout(() => {
                    const canvas = container.querySelector('canvas');
                    if (canvas) {
                        container.classList.add('has-canvas');
                        container.classList.add('success');
                        setTimeout(() => container.classList.remove('success'), 2000);
                        console.log('🎉 Canvas created and displayed');
                        resolve();
                    } else {
                        reject(new Error('Canvas was not created'));
                    }
                }, 300);
                
            } catch (error) {
                console.error('❌ Setup error:', error);
                reject(error);
            }
        });
    }

    processFunctionCalls(code, p) {
        // Replace P5.js function calls with p. prefixed versions
        return code
            .replace(/function\s+setup\s*\(\)/g, 'p.setup = function()')
            .replace(/function\s+draw\s*\(\)/g, 'p.draw = function()')
            .replace(/createCanvas\s*\(/g, 'p.createCanvas(')
            .replace(/background\s*\(/g, 'p.background(')
            .replace(/fill\s*\(/g, 'p.fill(')
            .replace(/stroke\s*\(/g, 'p.stroke(')
            .replace(/noStroke\s*\(/g, 'p.noStroke(')
            .replace(/noFill\s*\(/g, 'p.noFill(')
            .replace(/ellipse\s*\(/g, 'p.ellipse(')
            .replace(/circle\s*\(/g, 'p.circle(')
            .replace(/rect\s*\(/g, 'p.rect(')
            .replace(/square\s*\(/g, 'p.square(')
            .replace(/line\s*\(/g, 'p.line(')
            .replace(/triangle\s*\(/g, 'p.triangle(')
            .replace(/point\s*\(/g, 'p.point(')
            .replace(/push\s*\(/g, 'p.push(')
            .replace(/pop\s*\(/g, 'p.pop(')
            .replace(/translate\s*\(/g, 'p.translate(')
            .replace(/rotate\s*\(/g, 'p.rotate(')
            .replace(/scale\s*\(/g, 'p.scale(')
            .replace(/strokeWeight\s*\(/g, 'p.strokeWeight(')
            .replace(/rectMode\s*\(/g, 'p.rectMode(')
            .replace(/\bframeCount\b/g, 'p.frameCount')
            .replace(/\bwidth\b/g, 'p.width')
            .replace(/\bheight\b/g, 'p.height')
            .replace(/\bmouseX\b/g, 'p.mouseX')
            .replace(/\bmouseY\b/g, 'p.mouseY')
            .replace(/\bCENTER\b/g, 'p.CENTER');
    }

    wrapCodeForExecution(code) {
        let wrappedCode = code.trim();
        
        // Ensure we have setup function
        if (!wrappedCode.includes('function setup')) {
            wrappedCode = `function setup() {\n  createCanvas(${this.canvasWidth}, ${this.canvasHeight});\n}\n\n` + wrappedCode;
        }
        
        // Ensure we have draw function
        if (!wrappedCode.includes('function draw')) {
            wrappedCode += `\n\nfunction draw() {\n  // Static sketch\n}`;
        }
        
        // Ensure proper canvas size
        wrappedCode = wrappedCode.replace(
            /createCanvas\s*\([^)]*\)/g, 
            `createCanvas(${this.canvasWidth}, ${this.canvasHeight})`
        );
        
        return wrappedCode;
    }

    validateCode(code) {
        if (!code || typeof code !== 'string') {
            return false;
        }
        
        // Check for dangerous functions
        const dangerousFunctions = [
            'eval', 'Function', 'setTimeout', 'setInterval', 
            'fetch', 'XMLHttpRequest', 'import', 'require',
            'document\.', 'window\.', 'localStorage', 'sessionStorage'
        ];
        
        for (const pattern of dangerousFunctions) {
            const regex = new RegExp(pattern);
            if (regex.test(code)) {
                console.warn(`Dangerous pattern detected: ${pattern}`);
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

    // Test method for debugging
    async renderTestSketch() {
        console.log('🧪 Rendering test sketch...');
        
        const testCode = `
function setup() {
    createCanvas(800, 600);
}

function draw() {
    background(240, 240, 240);
    fill(255, 100, 100);
    stroke(0);
    strokeWeight(2);
    ellipse(400, 300, 150, 150);
}`;
        
        await this.renderSketch(testCode);
    }

    destroy() {
        this.clearCanvas();
        console.log('🗑️ P5JSRenderer destroyed');
    }
}

// Make it globally available for debugging
window.P5JSRenderer = P5JSRenderer;
