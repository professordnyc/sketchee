/**
 * API Keys Module
 * Centralized management of API keys and configuration
 */

// Rate limiting configuration
const RATE_LIMIT = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
};

// Cache for rate limiting
const rateLimitStore = new Map();

/**
 * Get API keys with rate limiting
 * @param {string} clientIp - Client IP address for rate limiting
 * @returns {Object} API keys object or rate limit info if rate limited
 */
export function getApiKeys(clientIp) {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT.windowMs;
    
    // Clean up old entries
    for (const [ip, entry] of rateLimitStore.entries()) {
        if (entry.timestamp < windowStart) {
            rateLimitStore.delete(ip);
        }
    }
    
    // Check rate limit
    const clientEntry = rateLimitStore.get(clientIp) || { count: 0, timestamp: now };
    
    if (clientEntry.count >= RATE_LIMIT.max && (now - clientEntry.timestamp) < RATE_LIMIT.windowMs) {
        return {
            error: 'Too many requests',
            retryAfter: Math.ceil((clientEntry.timestamp + RATE_LIMIT.windowMs - now) / 1000)
        };
    }
    
    // Update rate limit counter
    clientEntry.count += 1;
    clientEntry.timestamp = now;
    rateLimitStore.set(clientIp, clientEntry);
    
    // Return API keys
    return {
        elevenlabs: process.env.ELEVENLABS_API_KEY,
        // Add other API keys here if needed
        timestamp: now,
        rateLimit: {
            remaining: Math.max(0, RATE_LIMIT.max - clientEntry.count),
            reset: Math.ceil((clientEntry.timestamp + RATE_LIMIT.windowMs) / 1000)
        }
    };
}
