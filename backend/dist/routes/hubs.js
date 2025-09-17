"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const hubs_model_1 = require("../models/hubs.model");
const auth_1 = require("../middleware/auth");
const role_1 = require("../middleware/role");
const router = express_1.default.Router();
router.get('/', auth_1.auth, (0, role_1.requireRole)('admin'), async (req, res) => {
    try {
        const hubs = await hubs_model_1.Hub.find().sort({ name: 1 });
        res.json({
            success: true,
            data: hubs
        });
    }
    catch (error) {
        console.error('Error fetching hubs:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch hubs', code: 'HUBS_FETCH_ERROR' }
        });
    }
});
router.get('/:id', auth_1.auth, (0, role_1.requireRole)('admin'), async (req, res) => {
    try {
        const hub = await hubs_model_1.Hub.findById(req.params.id);
        if (!hub) {
            res.status(404).json({
                success: false,
                error: { message: 'Hub not found', code: 'HUB_NOT_FOUND' }
            });
            return;
        }
        res.json({
            success: true,
            data: hub
        });
    }
    catch (error) {
        console.error('Error fetching hub:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch hub', code: 'HUB_FETCH_ERROR' }
        });
    }
});
router.post('/', auth_1.auth, (0, role_1.requireRole)('admin'), async (req, res) => {
    try {
        const hub = new hubs_model_1.Hub(req.body);
        await hub.save();
        res.status(201).json({
            success: true,
            data: hub
        });
    }
    catch (error) {
        console.error('Error creating hub:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to create hub', code: 'HUB_CREATE_ERROR' }
        });
    }
});
router.put('/:id', auth_1.auth, (0, role_1.requireRole)('admin'), async (req, res) => {
    try {
        const hub = await hubs_model_1.Hub.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!hub) {
            res.status(404).json({
                success: false,
                error: { message: 'Hub not found', code: 'HUB_NOT_FOUND' }
            });
            return;
        }
        res.json({
            success: true,
            data: hub
        });
    }
    catch (error) {
        console.error('Error updating hub:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to update hub', code: 'HUB_UPDATE_ERROR' }
        });
    }
});
router.delete('/:id', auth_1.auth, (0, role_1.requireRole)('admin'), async (req, res) => {
    try {
        const hub = await hubs_model_1.Hub.findByIdAndDelete(req.params.id);
        if (!hub) {
            res.status(404).json({
                success: false,
                error: { message: 'Hub not found', code: 'HUB_NOT_FOUND' }
            });
            return;
        }
        res.json({
            success: true,
            message: 'Hub deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting hub:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to delete hub', code: 'HUB_DELETE_ERROR' }
        });
    }
});
exports.default = router;
//# sourceMappingURL=hubs.js.map