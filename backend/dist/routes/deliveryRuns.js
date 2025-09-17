"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const deliveryRuns_model_1 = require("../models/deliveryRuns.model");
const auth_1 = require("../middleware/auth");
const role_1 = require("../middleware/role");
const router = express_1.default.Router();
router.get('/', auth_1.auth, async (req, res) => {
    try {
        const { status, deliveryAgentId, date } = req.query;
        const filter = {};
        if (status) {
            filter.status = status;
        }
        if (deliveryAgentId) {
            filter.deliveryAgentId = deliveryAgentId;
        }
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 1);
            filter.scheduledDate = {
                $gte: startDate,
                $lt: endDate
            };
        }
        const deliveryRuns = await deliveryRuns_model_1.DeliveryRun.find(filter)
            .populate('orders')
            .populate('hubId', 'name address')
            .sort({ scheduledDate: -1 });
        res.json({
            success: true,
            data: deliveryRuns
        });
    }
    catch (error) {
        console.error('Error fetching delivery runs:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch delivery runs', code: 'DELIVERY_RUNS_FETCH_ERROR' }
        });
    }
});
router.get('/:id', auth_1.auth, async (req, res) => {
    try {
        const deliveryRun = await deliveryRuns_model_1.DeliveryRun.findById(req.params.id)
            .populate('orders')
            .populate('hubId', 'name address')
            .populate('deliveryAgentId', 'firstName lastName phone');
        if (!deliveryRun) {
            res.status(404).json({
                success: false,
                error: { message: 'Delivery run not found', code: 'DELIVERY_RUN_NOT_FOUND' }
            });
            return;
        }
        res.json({
            success: true,
            data: deliveryRun
        });
    }
    catch (error) {
        console.error('Error fetching delivery run:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch delivery run', code: 'DELIVERY_RUN_FETCH_ERROR' }
        });
    }
});
router.post('/', auth_1.auth, (0, role_1.requireRole)('admin'), async (req, res) => {
    try {
        const deliveryRun = new deliveryRuns_model_1.DeliveryRun(req.body);
        await deliveryRun.save();
        res.status(201).json({
            success: true,
            data: deliveryRun
        });
    }
    catch (error) {
        console.error('Error creating delivery run:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to create delivery run', code: 'DELIVERY_RUN_CREATE_ERROR' }
        });
    }
});
router.put('/:id', auth_1.auth, (0, role_1.requireRole)('admin'), async (req, res) => {
    try {
        const deliveryRun = await deliveryRuns_model_1.DeliveryRun.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!deliveryRun) {
            res.status(404).json({
                success: false,
                error: { message: 'Delivery run not found', code: 'DELIVERY_RUN_NOT_FOUND' }
            });
            return;
        }
        res.json({
            success: true,
            data: deliveryRun
        });
    }
    catch (error) {
        console.error('Error updating delivery run:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to update delivery run', code: 'DELIVERY_RUN_UPDATE_ERROR' }
        });
    }
});
router.post('/:id/start', auth_1.auth, (0, role_1.requireRole)('admin'), async (req, res) => {
    try {
        const deliveryRun = await deliveryRuns_model_1.DeliveryRun.findByIdAndUpdate(req.params.id, {
            status: 'in_progress',
            actualStartTime: new Date()
        }, { new: true });
        if (!deliveryRun) {
            res.status(404).json({
                success: false,
                error: { message: 'Delivery run not found', code: 'DELIVERY_RUN_NOT_FOUND' }
            });
            return;
        }
        res.json({
            success: true,
            data: deliveryRun,
            message: 'Delivery run started successfully'
        });
    }
    catch (error) {
        console.error('Error starting delivery run:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to start delivery run', code: 'DELIVERY_RUN_START_ERROR' }
        });
    }
});
router.post('/:id/complete', auth_1.auth, (0, role_1.requireRole)('admin'), async (req, res) => {
    try {
        const deliveryRun = await deliveryRuns_model_1.DeliveryRun.findByIdAndUpdate(req.params.id, {
            status: 'completed',
            actualEndTime: new Date()
        }, { new: true });
        if (!deliveryRun) {
            res.status(404).json({
                success: false,
                error: { message: 'Delivery run not found', code: 'DELIVERY_RUN_NOT_FOUND' }
            });
            return;
        }
        res.json({
            success: true,
            data: deliveryRun,
            message: 'Delivery run completed successfully'
        });
    }
    catch (error) {
        console.error('Error completing delivery run:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to complete delivery run', code: 'DELIVERY_RUN_COMPLETE_ERROR' }
        });
    }
});
exports.default = router;
//# sourceMappingURL=deliveryRuns.js.map