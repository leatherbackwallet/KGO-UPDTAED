"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const index_1 = require("../models/index");
const database_1 = require("../middleware/database");
const auth = require('../middleware/auth.js');
const role = require('../middleware/role.js');
const router = express_1.default.Router();
router.post('/', auth, database_1.ensureDatabaseConnection, async (req, res) => {
    return res.status(400).json({
        success: false,
        error: {
            message: 'Direct order creation is disabled. Please use the payment flow at /api/payments/create-order',
            code: 'DEPRECATED_ENDPOINT'
        }
    });
});
router.get('/', auth, role('admin'), database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const orders = await index_1.Order.find({ isDeleted: false })
            .populate('userId', 'firstName lastName email phone')
            .populate({
            path: 'orderItems.productId',
            select: 'name price images description categories',
            populate: {
                path: 'categories',
                select: 'name'
            }
        })
            .sort({ createdAt: -1 });
        return res.json(orders || []);
    }
    catch (err) {
        console.error('Error fetching orders:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});
router.get('/my', auth, database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const orders = await index_1.Order.find({ userId: req.user.id, isDeleted: false })
            .populate({
            path: 'orderItems.productId',
            select: 'name price images description categories',
            populate: {
                path: 'categories',
                select: 'name'
            }
        })
            .sort({ createdAt: -1 });
        return res.json(orders || []);
    }
    catch (err) {
        console.error('Error fetching user orders:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});
router.put('/:id/status', auth, role('admin'), database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const { status, notes } = req.body;
        if (!status) {
            return res.status(400).json({
                success: false,
                error: { message: 'Status is required', code: 'MISSING_STATUS' }
            });
        }
        const validStatuses = ['payment_done', 'order_received', 'collecting_items', 'packing', 'en_route', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: { message: 'Invalid status', code: 'INVALID_STATUS' }
            });
        }
        const order = await index_1.Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({
                success: false,
                error: { message: 'Order not found', code: 'ORDER_NOT_FOUND' }
            });
        }
        order.orderStatus = status;
        order.statusHistory.push({
            status,
            timestamp: new Date(),
            notes: notes || '',
            updatedBy: req.user.id
        });
        await order.save();
        const updatedOrder = await index_1.Order.findById(req.params.id)
            .populate('userId', 'firstName lastName email phone')
            .populate({
            path: 'orderItems.productId',
            select: 'name price images description categories',
            populate: {
                path: 'categories',
                select: 'name'
            }
        });
        return res.json({
            success: true,
            data: {
                message: 'Order status updated successfully',
                order: updatedOrder
            }
        });
    }
    catch (err) {
        console.error('Error updating order status:', err);
        return res.status(500).json({
            success: false,
            error: { message: 'Server error', code: 'SERVER_ERROR' }
        });
    }
});
router.put('/:id/recipient', auth, database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const { recipientAddress } = req.body;
        if (!recipientAddress || !recipientAddress.name || !recipientAddress.phone || !recipientAddress.address) {
            return res.status(400).json({
                success: false,
                error: { message: 'Recipient address information is required', code: 'MISSING_RECIPIENT_INFO' }
            });
        }
        const existingOrder = await index_1.Order.findById(req.params.id);
        if (!existingOrder) {
            return res.status(404).json({
                success: false,
                error: { message: 'Order not found', code: 'ORDER_NOT_FOUND' }
            });
        }
        const isAdmin = req.user.roleName === 'admin';
        const isOrderOwner = existingOrder.userId.toString() === req.user.id;
        if (!isAdmin && !isOrderOwner) {
            return res.status(403).json({
                success: false,
                error: { message: 'You can only update your own orders', code: 'UNAUTHORIZED' }
            });
        }
        const shippingDetails = {
            recipientName: recipientAddress.name,
            recipientPhone: recipientAddress.phone,
            address: {
                streetName: recipientAddress.address.streetName,
                houseNumber: recipientAddress.address.houseNumber,
                postalCode: recipientAddress.address.postalCode,
                city: recipientAddress.address.city,
                countryCode: recipientAddress.address.countryCode || 'DE'
            },
            specialInstructions: recipientAddress.additionalInstructions || ''
        };
        const updatedOrder = await index_1.Order.findByIdAndUpdate(req.params.id, { shippingDetails }, { new: true }).populate('userId', 'firstName lastName email phone')
            .populate({
            path: 'orderItems.productId',
            select: 'name price images description categories',
            populate: {
                path: 'categories',
                select: 'name'
            }
        });
        if (!updatedOrder) {
            return res.status(404).json({
                success: false,
                error: { message: 'Order not found', code: 'ORDER_NOT_FOUND' }
            });
        }
        return res.json({
            success: true,
            data: {
                message: 'Order recipient updated successfully',
                order: updatedOrder
            }
        });
    }
    catch (err) {
        console.error('Error updating order recipient:', err);
        return res.status(500).json({
            success: false,
            error: { message: 'Server error', code: 'SERVER_ERROR' }
        });
    }
});
router.delete('/:id', auth, role('admin'), database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const order = await index_1.Order.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
        if (!order)
            return res.status(404).json({ message: 'Order not found' });
        return res.json({ message: 'Order deleted' });
    }
    catch (err) {
        console.error('Error deleting order:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=orders.js.map