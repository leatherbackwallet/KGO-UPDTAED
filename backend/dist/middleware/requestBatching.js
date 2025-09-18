"use strict";
/**
 * Request Batching and Deduplication Middleware
 * Optimizes network utilization by batching requests and preventing duplicate calls
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueRequests = exports.globalRequestQueue = exports.enhanceProductsWithBatchLoading = exports.batchRelatedData = exports.deduplicateRequests = void 0;
const crypto = __importStar(require("crypto"));
// In-memory store for pending requests and batching
const pendingRequests = new Map();
const batchQueues = new Map();
// Generate request signature for deduplication
const generateRequestSignature = (req) => {
    const { method, originalUrl, query, body } = req;
    const signature = crypto.createHash('md5')
        .update(JSON.stringify({ method, originalUrl, query, body }))
        .digest('hex');
    return signature;
};
// Request deduplication middleware
const deduplicateRequests = () => {
    return (req, res, next) => {
        // Only deduplicate GET requests
        if (req.method !== 'GET') {
            return next();
        }
        const signature = generateRequestSignature(req);
        // Check if identical request is already pending
        if (pendingRequests.has(signature)) {
            const pendingRequest = pendingRequests.get(signature);
            if (pendingRequest) {
                // Add this response to the pending request's response list
                pendingRequest.responses.push(res);
                // Don't call next() - this request will be handled when the original completes
                return;
            }
        }
        // Create new pending request entry
        pendingRequests.set(signature, {
            responses: [res],
            timestamp: Date.now()
        });
        // Override res.json to handle multiple responses
        const originalJson = res.json;
        const originalStatus = res.status;
        const originalEnd = res.end;
        let responseData = null;
        let statusCode = 200;
        res.json = function (data) {
            responseData = data;
            // Get the pending request
            const pending = pendingRequests.get(signature);
            if (pending) {
                // Send response to all waiting clients
                pending.responses.forEach((response, index) => {
                    if (response !== res || index === 0) {
                        // Copy headers from original response
                        Object.keys(res.getHeaders()).forEach(headerName => {
                            const headerValue = res.getHeader(headerName);
                            if (headerValue !== undefined) {
                                response.setHeader(headerName, headerValue);
                            }
                        });
                        response.status(statusCode);
                        originalJson.call(response, data);
                    }
                });
                // Clean up
                pendingRequests.delete(signature);
            }
            return this;
        };
        res.status = function (code) {
            statusCode = code;
            return originalStatus.call(this, code);
        };
        res.end = function (data) {
            // If no json was called, handle end directly
            if (!responseData && pendingRequests.has(signature)) {
                const pending = pendingRequests.get(signature);
                if (pending) {
                    pending.responses.forEach((response) => {
                        if (response !== res) {
                            response.status(statusCode);
                            originalEnd.call(response, data, 'utf8');
                        }
                    });
                    pendingRequests.delete(signature);
                }
            }
            return originalEnd.call(this, data, 'utf8');
        };
        next();
    };
};
exports.deduplicateRequests = deduplicateRequests;
// Batch loading middleware for related data
const batchRelatedData = (batchConfig = {}) => {
    const { batchSize = 10, batchTimeout = 100, // ms
    enableBatching = true } = batchConfig;
    return (req, res, next) => {
        if (!enableBatching || req.method !== 'GET') {
            return next();
        }
        // Check if this is a batchable request (products with categories)
        if (req.originalUrl.includes('/api/products') && !req.params.id) {
            req.batchable = true;
            req.batchType = 'products-with-categories';
        }
        next();
    };
};
exports.batchRelatedData = batchRelatedData;
// Enhanced products route with batch loading
const enhanceProductsWithBatchLoading = async (req, res, next) => {
    if (!req.batchable) {
        return next();
    }
    try {
        const { Product, Category } = require('../dist/models');
        const { category, min, max, search, featured, occasions } = req.query;
        let filter = {};
        // Apply filters (same logic as original route)
        if (category) {
            if (require('mongoose').Types.ObjectId.isValid(category)) {
                filter.categories = category;
            }
            else {
                const categoryDoc = await Category.findOne({ slug: category });
                if (categoryDoc) {
                    filter.categories = categoryDoc._id;
                }
                else {
                    res.json({ success: true, data: [], count: 0 });
                    return;
                }
            }
        }
        if (featured === 'true')
            filter.isFeatured = true;
        if (min || max)
            filter.price = {};
        if (min)
            filter.price.$gte = Number(min);
        if (max)
            filter.price.$lte = Number(max);
        if (occasions) {
            const occasionArray = occasions.split(',').map(o => o.trim().toUpperCase());
            filter.occasions = { $in: occasionArray };
        }
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            filter.$or = [
                { 'name': searchRegex },
                { 'description': searchRegex },
                { occasions: searchRegex }
            ];
        }
        // Batch load products and categories in parallel
        const [products, categories] = await Promise.all([
            Product.find(filter)
                .populate('categories', 'name slug')
                .populate('vendors', 'storeName')
                .sort({ isFeatured: -1, createdAt: -1 })
                .limit(100),
            // Pre-load categories for potential filtering
            Category.find({ isActive: true }).select('name slug isPopular').limit(50)
        ]);
        // Attach categories to request for potential use
        req.preloadedCategories = categories;
        // Set the products data
        req.batchedData = {
            success: true,
            data: products,
            count: products.length,
            categories: categories // Include categories in response for frontend caching
        };
        next();
    }
    catch (error) {
        console.error('Batch loading error:', error);
        next(); // Fall back to normal processing
    }
};
exports.enhanceProductsWithBatchLoading = enhanceProductsWithBatchLoading;
// Request queue management for optimal network utilization
class RequestQueue {
    constructor(options = {}) {
        this.maxConcurrent = options.maxConcurrent || 5;
        this.queue = [];
        this.active = 0;
        this.stats = {
            queued: 0,
            processed: 0,
            errors: 0
        };
    }
    async add(requestFn, priority = 'normal') {
        return new Promise((resolve, reject) => {
            const request = {
                fn: requestFn,
                priority,
                resolve,
                reject,
                timestamp: Date.now()
            };
            // Insert based on priority
            if (priority === 'high') {
                this.queue.unshift(request);
            }
            else {
                this.queue.push(request);
            }
            this.stats.queued++;
            this.process();
        });
    }
    async process() {
        if (this.active >= this.maxConcurrent || this.queue.length === 0) {
            return;
        }
        const request = this.queue.shift();
        if (!request)
            return;
        this.active++;
        try {
            const result = await request.fn();
            request.resolve(result);
            this.stats.processed++;
        }
        catch (error) {
            request.reject(error);
            this.stats.errors++;
        }
        finally {
            this.active--;
            this.process(); // Process next request
        }
    }
    getStats() {
        return {
            ...this.stats,
            queueLength: this.queue.length,
            active: this.active
        };
    }
}
// Global request queue instance
exports.globalRequestQueue = new RequestQueue({ maxConcurrent: 10 });
// Queue middleware for high-traffic endpoints
const queueRequests = (options = {}) => {
    const { priority = 'normal', queueTimeout = 5000 } = options;
    return (req, res, next) => {
        // Only queue expensive operations
        const shouldQueue = req.originalUrl.includes('/api/products') ||
            req.originalUrl.includes('/api/categories') ||
            req.originalUrl.includes('/api/search');
        if (!shouldQueue) {
            return next();
        }
        const requestFn = () => {
            return new Promise((resolve, reject) => {
                // Set up timeout
                const timeout = setTimeout(() => {
                    reject(new Error('Request timeout'));
                }, queueTimeout);
                // Override res.json to resolve promise
                const originalJson = res.json;
                res.json = function (data) {
                    clearTimeout(timeout);
                    resolve(data);
                    return originalJson.call(this, data);
                };
                // Override error handling
                const originalStatus = res.status;
                res.status = function (code) {
                    if (code >= 400) {
                        clearTimeout(timeout);
                        reject(new Error(`Request failed with status ${code}`));
                    }
                    return originalStatus.call(this, code);
                };
                next();
            });
        };
        // Add to queue
        exports.globalRequestQueue.add(requestFn, priority)
            .catch(error => {
            console.error('Queued request failed:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Request processing failed', code: 'QUEUE_ERROR' }
            });
        });
    };
};
exports.queueRequests = queueRequests;
// Cleanup function for expired pending requests
const cleanupExpiredRequests = () => {
    const now = Date.now();
    const expiredThreshold = 30000; // 30 seconds
    for (const [signature, request] of pendingRequests.entries()) {
        if (now - request.timestamp > expiredThreshold) {
            // Send timeout response to all waiting clients
            request.responses.forEach(res => {
                if (!res.headersSent) {
                    res.status(408).json({
                        success: false,
                        error: { message: 'Request timeout', code: 'TIMEOUT' }
                    });
                }
            });
            pendingRequests.delete(signature);
        }
    }
};
// Schedule cleanup every 30 seconds
setInterval(cleanupExpiredRequests, 30000);
