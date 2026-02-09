"use strict";
/**
 * Occasions Routes - JSON-based occasions for public requests
 * Routes admin requests to MongoDB, public requests to JSON files
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const occasions_model_1 = require("../models/occasions.model");
const products_model_1 = require("../models/products.model");
const database_1 = require("../middleware/database");
const cache_1 = require("../middleware/cache");
const requestBatching_1 = require("../middleware/requestBatching");
const auth_1 = require("../middleware/auth");
const role_1 = require("../middleware/role");
const validation_1 = require("../middleware/validation");
const zod_1 = require("zod");
const jsonDataService_1 = require("../services/jsonDataService");
const router = express_1.default.Router();
// Validation schemas (for admin requests)
const createOccasionSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Occasion name is required').max(100, 'Occasion name too long'),
    description: zod_1.z.string().max(500, 'Description too long').optional(),
    icon: zod_1.z.string().max(50, 'Icon name too long').optional(),
    color: zod_1.z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color format').optional(),
    dateRange: zod_1.z.object({
        startMonth: zod_1.z.number().min(1).max(12),
        startDay: zod_1.z.number().min(1).max(31),
        endMonth: zod_1.z.number().min(1).max(12),
        endDay: zod_1.z.number().min(1).max(31),
        isRecurring: zod_1.z.boolean().default(true),
        specificYear: zod_1.z.number().min(2020).max(2030).optional()
    }),
    priority: zod_1.z.object({
        level: zod_1.z.enum(['low', 'medium', 'high', 'peak']).default('medium'),
        boostMultiplier: zod_1.z.number().min(1.0).max(3.0).default(1.5)
    }),
    seasonalFlags: zod_1.z.object({
        isFestival: zod_1.z.boolean().default(false),
        isHoliday: zod_1.z.boolean().default(false),
        isPersonal: zod_1.z.boolean().default(false),
        isSeasonal: zod_1.z.boolean().default(false)
    }),
    sortOrder: zod_1.z.number().default(0)
});
const updateOccasionSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Occasion name is required').max(100, 'Occasion name too long').optional(),
    description: zod_1.z.string().max(500, 'Description too long').optional(),
    icon: zod_1.z.string().max(50, 'Icon name too long').optional(),
    color: zod_1.z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color format').optional(),
    dateRange: zod_1.z.object({
        startMonth: zod_1.z.number().min(1).max(12).optional(),
        startDay: zod_1.z.number().min(1).max(31).optional(),
        endMonth: zod_1.z.number().min(1).max(12).optional(),
        endDay: zod_1.z.number().min(1).max(31).optional(),
        isRecurring: zod_1.z.boolean().optional(),
        specificYear: zod_1.z.number().min(2020).max(2030).optional()
    }).optional(),
    priority: zod_1.z.object({
        level: zod_1.z.enum(['low', 'medium', 'high', 'peak']).optional(),
        boostMultiplier: zod_1.z.number().min(1.0).max(3.0).optional()
    }).optional(),
    seasonalFlags: zod_1.z.object({
        isFestival: zod_1.z.boolean().optional(),
        isHoliday: zod_1.z.boolean().optional(),
        isPersonal: zod_1.z.boolean().optional(),
        isSeasonal: zod_1.z.boolean().optional()
    }).optional(),
    sortOrder: zod_1.z.number().optional(),
    isActive: zod_1.z.boolean().optional()
});
// GET /api/occasions - Route to JSON for public, MongoDB for admin
router.get('/', async (req, res) => {
    try {
        const { admin } = req.query;
        if (admin === 'true') {
            // ADMIN REQUEST → Use MongoDB (existing functionality)
            console.log('🔧 Admin occasions request - using MongoDB');
            return await handleAdminOccasionsRequest(req, res);
        }
        else {
            // PUBLIC REQUEST → Use JSON files (no MongoDB dependency)
            console.log('📄 Public occasions request - using JSON files');
            return await handlePublicOccasionsRequest(req, res);
        }
    }
    catch (error) {
        console.error('❌ Error in occasions route:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch occasions',
                code: 'OCCASIONS_FETCH_ERROR'
            }
        });
    }
});
/**
 * Handle public occasions requests using JSON files (items page filtering)
 * NO MongoDB dependency
 */
async function handlePublicOccasionsRequest(req, res) {
    const { includeInactive = false } = req.query;
    try {
        const occasions = await jsonDataService_1.jsonDataService.getOccasions({
            includeInactive: includeInactive === 'true'
        });
        res.json({
            success: true,
            data: occasions
        });
    }
    catch (error) {
        console.error('❌ Error fetching occasions from JSON:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch occasions',
                code: 'JSON_OCCASIONS_ERROR'
            }
        });
    }
}
/**
 * Handle admin occasions requests using MongoDB (admin panel)
 * Preserves existing MongoDB functionality
 */
async function handleAdminOccasionsRequest(req, res) {
    // Apply middleware for admin requests
    await new Promise((resolve, reject) => {
        (0, requestBatching_1.deduplicateRequests)()(req, res, (err) => {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
    await new Promise((resolve, reject) => {
        cache_1.cacheConfigs.occasions(req, res, (err) => {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
    await new Promise((resolve, reject) => {
        (0, database_1.ensureDatabaseConnection)(req, res, (err) => {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
    try {
        const { includeInactive = false } = req.query;
        const filter = includeInactive === 'true' ? { isDeleted: false } : { isActive: true, isDeleted: false };
        const occasions = await occasions_model_1.Occasion.find(filter).sort('sortOrder');
        res.json({
            success: true,
            data: occasions
        });
    }
    catch (error) {
        console.error('❌ Error fetching occasions from MongoDB:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch occasions',
                code: 'MONGODB_OCCASIONS_ERROR'
            }
        });
    }
}
// GET /api/occasions/:id - Route to JSON for public, MongoDB for admin
router.get('/:id', async (req, res) => {
    try {
        const { admin } = req.query;
        if (admin === 'true') {
            // ADMIN REQUEST → Use MongoDB
            console.log('🔧 Admin single occasion request - using MongoDB');
            return await handleAdminSingleOccasionRequest(req, res);
        }
        else {
            // PUBLIC REQUEST → Use JSON files
            console.log('📄 Public single occasion request - using JSON files');
            return await handlePublicSingleOccasionRequest(req, res);
        }
    }
    catch (error) {
        console.error('❌ Error in single occasion route:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch occasion',
                code: 'OCCASION_FETCH_ERROR'
            }
        });
    }
});
/**
 * Handle public single occasion requests using JSON files
 */
async function handlePublicSingleOccasionRequest(req, res) {
    try {
        const id = typeof req.params.id === 'string' ? req.params.id : (req.params.id?.[0] ?? '');
        const occasion = await jsonDataService_1.jsonDataService.getOccasionById(id);
        if (!occasion) {
            res.status(404).json({ success: false, error: 'Occasion not found' });
            return;
        }
        res.json({ success: true, data: occasion });
    }
    catch (error) {
        console.error('❌ Error fetching occasion from JSON:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch occasion',
                code: 'JSON_OCCASION_ERROR'
            }
        });
    }
}
/**
 * Handle admin single occasion requests using MongoDB
 */
async function handleAdminSingleOccasionRequest(req, res) {
    await new Promise((resolve, reject) => {
        (0, database_1.ensureDatabaseConnection)(req, res, (err) => {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
    try {
        const occasion = await occasions_model_1.Occasion.findById(req.params.id);
        if (!occasion) {
            res.status(404).json({ success: false, error: 'Occasion not found' });
            return;
        }
        res.json({ success: true, data: occasion });
    }
    catch (error) {
        console.error('❌ Error fetching occasion from MongoDB:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch occasion' });
    }
}
// All other routes (POST, PUT, DELETE) remain admin-only and use MongoDB
// These are preserved exactly as they were for admin functionality
// POST /api/occasions - Create new occasion (admin only)
router.post('/', auth_1.auth, (0, role_1.requireRole)('admin'), (0, validation_1.validate)(createOccasionSchema), database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const occasionData = req.body;
        // Check if occasion with same name already exists
        const existingOccasion = await occasions_model_1.Occasion.findOne({
            name: { $regex: new RegExp(`^${occasionData.name}$`, 'i') },
            isDeleted: false
        });
        if (existingOccasion) {
            res.status(400).json({
                success: false,
                error: 'Occasion with this name already exists'
            });
            return;
        }
        // Generate slug from name
        const slug = occasionData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const occasion = new occasions_model_1.Occasion({
            ...occasionData,
            slug
        });
        await occasion.save();
        res.status(201).json({
            success: true,
            data: occasion,
            message: 'Occasion created successfully'
        });
    }
    catch (error) {
        console.error('Error creating occasion:', error);
        res.status(500).json({ success: false, error: 'Failed to create occasion' });
    }
});
// PUT /api/occasions/:id - Update occasion (admin only)
router.put('/:id', auth_1.auth, (0, role_1.requireRole)('admin'), (0, validation_1.validate)(updateOccasionSchema), database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const updateData = req.body;
        // Check if another occasion with same name exists
        if (updateData.name) {
            const existingOccasion = await occasions_model_1.Occasion.findOne({
                name: { $regex: new RegExp(`^${updateData.name}$`, 'i') },
                _id: { $ne: req.params.id },
                isDeleted: false
            });
            if (existingOccasion) {
                res.status(400).json({
                    success: false,
                    error: 'Occasion with this name already exists'
                });
                return;
            }
            // Update slug if name is changed
            updateData.slug = updateData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }
        const occasion = await occasions_model_1.Occasion.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
        if (!occasion) {
            res.status(404).json({ success: false, error: 'Occasion not found' });
            return;
        }
        res.json({
            success: true,
            data: occasion,
            message: 'Occasion updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating occasion:', error);
        res.status(500).json({ success: false, error: 'Failed to update occasion' });
    }
});
// DELETE /api/occasions/:id - Delete occasion (admin only)
router.delete('/:id', auth_1.auth, (0, role_1.requireRole)('admin'), database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        // Check if occasion has products
        const productsCount = await products_model_1.Product.countDocuments({
            occasions: req.params.id,
            isDeleted: false
        });
        if (productsCount > 0) {
            res.status(400).json({
                success: false,
                error: `Cannot delete occasion with ${productsCount} products. Please reassign products first.`
            });
            return;
        }
        const occasion = await occasions_model_1.Occasion.findByIdAndUpdate(req.params.id, { isDeleted: true, isActive: false }, { new: true });
        if (!occasion) {
            res.status(404).json({ success: false, error: 'Occasion not found' });
            return;
        }
        res.json({
            success: true,
            message: 'Occasion deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting occasion:', error);
        res.status(500).json({ success: false, error: 'Failed to delete occasion' });
    }
});
exports.default = router;
