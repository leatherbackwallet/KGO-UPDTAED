"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const users_model_1 = require("../models/users.model");
const auth_1 = require("../middleware/auth");
const role_1 = require("../middleware/role");
const router = express_1.default.Router();
router.get('/', auth_1.auth, (0, role_1.requireRole)('admin'), async (req, res) => {
    try {
        const users = await users_model_1.User.find({}, '-password').populate('roleId');
        res.json(users);
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
router.put('/:id/grant', auth_1.auth, (0, role_1.requireRole)('admin'), async (req, res) => {
    try {
        const user = await users_model_1.User.findByIdAndUpdate(req.params.id, { roleId: 'admin' }, { new: true });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json({ message: 'Admin granted', user });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
router.put('/:id/revoke', auth_1.auth, (0, role_1.requireRole)('admin'), async (req, res) => {
    try {
        const user = await users_model_1.User.findByIdAndUpdate(req.params.id, { roleId: 'user' }, { new: true });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json({ message: 'Admin revoked', user });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map