/**
 * Notifications Seed - Minimal
 */
import { Notification } from '../models/notifications.model';
export async function seedNotifications(users: any[]) {
  try {
    const existing = await Notification.countDocuments();
    if (existing > 0) { console.log('   ⏭️  Notifications already exist, skipping...'); return; }
    if (!users.length) return;
    await Notification.create({ recipientId: users[0]._id, title: 'Welcome!', message: 'Thanks for joining.' });
    console.log('   ✅ Created 1 notification');
  } catch (error) { console.error('   ❌ Error seeding notifications:', error); }
} 