"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorLogger = exports.logger = void 0;
const logger = (req, res, next) => {
    const start = Date.now();
    const { method, url, ip, headers } = req;
    console.log(`[${new Date().toISOString()}] ${method} ${url} - IP: ${ip}`);
    if (method !== 'GET' && req.body) {
        const sanitizedBody = { ...req.body };
        if (sanitizedBody.password)
            sanitizedBody.password = '[REDACTED]';
        if (sanitizedBody.token)
            sanitizedBody.token = '[REDACTED]';
        console.log(`Request Body:`, sanitizedBody);
    }
    const originalJson = res.json;
    res.json = function (data) {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;
        console.log(`[${new Date().toISOString()}] ${method} ${url} - ${statusCode} (${duration}ms)`);
        if (statusCode >= 400) {
            console.error(`Error Response:`, data);
        }
        return originalJson.call(this, data);
    };
    next();
};
exports.logger = logger;
const errorLogger = (err, req, res, next) => {
    const { method, url, ip } = req;
    console.error(`[${new Date().toISOString()}] ERROR ${method} ${url} - IP: ${ip}`);
    console.error('Error Details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
    });
    next(err);
};
exports.errorLogger = errorLogger;
//# sourceMappingURL=logger.js.map