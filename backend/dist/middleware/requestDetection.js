"use strict";
/**
 * Request Detection Middleware
 *
 * Detects whether a request comes from the admin panel or frontend
 * to route product requests to appropriate data sources.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectRequestSource = detectRequestSource;
exports.forceAdminRequest = forceAdminRequest;
exports.forceFrontendRequest = forceFrontendRequest;
exports.isAdminRequest = isAdminRequest;
exports.isFrontendRequest = isFrontendRequest;
exports.createRequestDetectionLogger = createRequestDetectionLogger;
/**
 * Detect request source based on multiple factors
 */
function detectRequestSource(req, res, next) {
    try {
        let isAdminRequest = false;
        let requestSource = 'unknown';
        // Method 1: Check for explicit admin parameter
        if (req.query.admin === 'true' || req.query.source === 'admin') {
            isAdminRequest = true;
            requestSource = 'admin';
        }
        // Method 2: Check User-Agent for admin panel patterns
        else if (req.headers['user-agent']) {
            const userAgent = req.headers['user-agent'].toLowerCase();
            // Admin panel typically makes requests from admin pages
            if (userAgent.includes('admin') ||
                req.headers.referer?.includes('/admin') ||
                req.headers.referer?.includes('admin.')) {
                isAdminRequest = true;
                requestSource = 'admin';
            }
        }
        // Method 3: Check for authorization header (admin requests usually have auth)
        else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            // If there's a valid JWT token, it's likely an admin request
            isAdminRequest = true;
            requestSource = 'admin';
        }
        // Method 4: Check request path patterns
        else if (req.path.includes('/admin/') || req.originalUrl.includes('admin=true')) {
            isAdminRequest = true;
            requestSource = 'admin';
        }
        // Method 5: Check for specific admin query parameters
        else if (req.query.includeDeleted === 'true' ||
            req.query.includeDeleted === 'false' ||
            req.query.limit === '1000') {
            // These parameters are typically used by admin panel
            isAdminRequest = true;
            requestSource = 'admin';
        }
        // Default to frontend if no admin indicators found
        else {
            isAdminRequest = false;
            requestSource = 'frontend';
        }
        // Set request properties
        req.isAdminRequest = isAdminRequest;
        req.isFrontendRequest = !isAdminRequest;
        req.requestSource = requestSource;
        // Log detection for debugging (only in development)
        if (process.env.NODE_ENV === 'development') {
            console.log(`🔍 Request Detection: ${requestSource.toUpperCase()}`, {
                path: req.path,
                query: req.query,
                hasAuth: !!req.headers.authorization,
                userAgent: req.headers['user-agent']?.substring(0, 50) + '...',
                referer: req.headers.referer
            });
        }
        next();
    }
    catch (error) {
        console.error('❌ Error in request detection middleware:', error);
        // Default to admin request on error to maintain existing functionality
        req.isAdminRequest = true;
        req.isFrontendRequest = false;
        req.requestSource = 'admin';
        next();
    }
}
/**
 * Middleware to force admin request detection
 */
function forceAdminRequest(req, res, next) {
    req.isAdminRequest = true;
    req.isFrontendRequest = false;
    req.requestSource = 'admin';
    next();
}
/**
 * Middleware to force frontend request detection
 */
function forceFrontendRequest(req, res, next) {
    req.isAdminRequest = false;
    req.isFrontendRequest = true;
    req.requestSource = 'frontend';
    next();
}
/**
 * Helper function to check if request is from admin
 */
function isAdminRequest(req) {
    return req.isAdminRequest === true;
}
/**
 * Helper function to check if request is from frontend
 */
function isFrontendRequest(req) {
    return req.isFrontendRequest === true;
}
/**
 * Middleware factory for debugging request detection
 */
function createRequestDetectionLogger(prefix = 'REQ') {
    return (req, res, next) => {
        console.log(`${prefix} [${req.requestSource?.toUpperCase()}] ${req.method} ${req.path}`, {
            query: Object.keys(req.query).length > 0 ? req.query : undefined,
            hasAuth: !!req.headers.authorization,
            isAdmin: req.isAdminRequest
        });
        next();
    };
}
