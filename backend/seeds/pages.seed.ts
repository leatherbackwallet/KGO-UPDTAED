/**
 * Pages Seed - Minimal
 */
import { Page, PageStatus } from '../models/pages.model';
export async function seedPages() {
  try {
    const existing = await Page.countDocuments();
    if (existing > 0) { console.log('   ⏭️  Pages already exist, skipping...'); return; }
    await Page.create({ title: 'About Us', slug: 'about-us', body: 'About us page content.', status: PageStatus.PUBLISHED });
    console.log('   ✅ Created 1 page');
  } catch (error) { console.error('   ❌ Error seeding pages:', error); }
} 