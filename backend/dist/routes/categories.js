"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const categories_model_1 = require("../models/categories.model");
const database_1 = require("../middleware/database");
const cache_1 = require("../middleware/cache");
const requestBatching_1 = require("../middleware/requestBatching");
const router = express_1.default.Router();
router.get('/', (0, requestBatching_1.deduplicateRequests)(), cache_1.cacheConfigs.categories, database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const categories = await categories_model_1.Category.find({ isActive: true }).sort('sortOrder');
        res.json({
            success: true,
            data: categories,
            count: categories.length
        });
    }
    catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch categories', code: 'FETCH_ERROR' }
        });
    }
});
exports.default = router;
//# sourceMappingURL=categories.js.map