"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDatabaseConnection = ensureDatabaseConnection;
exports.optionalDatabaseConnection = optionalDatabaseConnection;
const database_1 = require("../utils/database");
async function ensureDatabaseConnection(req, res, next) {
    try {
        if ((0, database_1.isDatabaseConnected)()) {
            return next();
        }
        await (0, database_1.connectToDatabase)();
        next();
    }
    catch (error) {
        console.error('Database connection failed:', error);
        res.status(503).json({
            success: false,
            error: {
                message: 'Database connection failed',
                code: 'DATABASE_ERROR'
            }
        });
    }
}
async function optionalDatabaseConnection(req, res, next) {
    try {
        if (!(0, database_1.isDatabaseConnected)()) {
            await (0, database_1.connectToDatabase)();
        }
    }
    catch (error) {
        console.warn('Optional database connection failed:', error);
    }
    next();
}
//# sourceMappingURL=database.js.map