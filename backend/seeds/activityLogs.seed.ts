/**
 * ActivityLogs Seed - Minimal
 */
import { ActivityLog } from '../models/activityLogs.model';
export async function seedActivityLogs(users: any[]) {
  try {
    const existing = await ActivityLog.countDocuments();
    if (existing > 0) { console.log('   ⏭️  Activity logs already exist, skipping...'); return; }
    if (!users.length) return;
    await ActivityLog.create({ actorId: users[0]._id, actionType: 'login', target: { type: 'User', id: users[0]._id }, details: {} });
    console.log('   ✅ Created 1 activity log');
  } catch (error) { console.error('   ❌ Error seeding activity logs:', error); }
} 