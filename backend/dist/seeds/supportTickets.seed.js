"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedSupportTickets = seedSupportTickets;
const supportTickets_model_1 = require("../models/supportTickets.model");
async function seedSupportTickets(users, orders) {
    try {
        const existing = await supportTickets_model_1.SupportTicket.countDocuments();
        if (existing > 0) {
            console.log('   ⏭️  Support tickets already exist, skipping...');
            return;
        }
        if (!users.length)
            return;
        await supportTickets_model_1.SupportTicket.create({ userId: users[0]._id, issue: 'Sample Issue', status: supportTickets_model_1.TicketStatus.OPEN, conversation: [] });
        console.log('   ✅ Created 1 support ticket');
    }
    catch (error) {
        console.error('   ❌ Error seeding support tickets:', error);
    }
}
//# sourceMappingURL=supportTickets.seed.js.map