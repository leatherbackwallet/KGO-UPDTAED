"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedNotifications = seedNotifications;
const notifications_model_1 = require("../models/notifications.model");
async function seedNotifications(users) {
    try {
        const existing = await notifications_model_1.Notification.countDocuments();
        if (existing > 0) {
            console.log('   ⏭️  Notifications already exist, skipping...');
            return;
        }
        if (!users.length)
            return;
        await notifications_model_1.Notification.create({ recipientId: users[0]._id, title: 'Welcome!', message: 'Thanks for joining.' });
        console.log('   ✅ Created 1 notification');
    }
    catch (error) {
        console.error('   ❌ Error seeding notifications:', error);
    }
}
//# sourceMappingURL=notifications.seed.js.map