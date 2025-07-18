/**
 * SupportTickets Seed - Minimal
 */
import { SupportTicket, TicketStatus } from '../models/supportTickets.model';
export async function seedSupportTickets(users: any[], orders: any[]) {
  try {
    const existing = await SupportTicket.countDocuments();
    if (existing > 0) { console.log('   ⏭️  Support tickets already exist, skipping...'); return; }
    if (!users.length) return;
    await SupportTicket.create({ userId: users[0]._id, issue: 'Sample Issue', status: TicketStatus.OPEN, conversation: [] });
    console.log('   ✅ Created 1 support ticket');
  } catch (error) { console.error('   ❌ Error seeding support tickets:', error); }
} 