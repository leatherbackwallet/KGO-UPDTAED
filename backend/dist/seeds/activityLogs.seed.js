"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedActivityLogs = seedActivityLogs;
const activityLogs_model_1 = require("../models/activityLogs.model");
async function seedActivityLogs(users) {
    try {
        const existing = await activityLogs_model_1.ActivityLog.countDocuments();
        if (existing > 0) {
            console.log('   ⏭️  Activity logs already exist, skipping...');
            return;
        }
        if (!users.length)
            return;
        await activityLogs_model_1.ActivityLog.create({ actorId: users[0]._id, actionType: 'login', target: { type: 'User', id: users[0]._id }, details: {} });
        console.log('   ✅ Created 1 activity log');
    }
    catch (error) {
        console.error('   ❌ Error seeding activity logs:', error);
    }
}
//# sourceMappingURL=activityLogs.seed.js.map