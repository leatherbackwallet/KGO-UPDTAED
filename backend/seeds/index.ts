/**
 * Database Seeder - Main seeding orchestration
 * Seeds all database tables in the correct dependency order
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import all seed functions
import { seedUsers } from './users.seed';
import { seedCategories } from './categories.seed';
import { seedProducts } from './products.seed';
import { seedVendors } from './vendors.seed';
import { seedVendorProducts } from './vendorProducts.seed';
import { seedVendorDocuments } from './vendorDocuments.seed';
import { seedCoupons } from './coupons.seed';
import { seedOrders } from './orders.seed';
import { seedReviews } from './reviews.seed';
import { seedTransactions } from './transactions.seed';
import { seedPayouts } from './payouts.seed';
import { seedLedger } from './ledger.seed';
import { seedWishlists } from './wishlists.seed';
import { seedNotifications } from './notifications.seed';
import { seedSupportTickets } from './supportTickets.seed';
import { seedPages } from './pages.seed';
import { seedActivityLogs } from './activityLogs.seed';
import { seedDailyStats } from './dailyStats.seed';

// Load environment variables
dotenv.config();

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/onYourBehlf';

/**
 * Main seeding function
 */
async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Clear existing data (optional - uncomment if needed)
    // await clearDatabase();
    
    // Seed in dependency order
    console.log('\n📝 Seeding users...');
    const users = await seedUsers();
    
    console.log('\n📝 Seeding categories...');
    const categories = await seedCategories();
    
    console.log('\n📝 Seeding products...');
    const products = await seedProducts(categories);
    
    console.log('\n📝 Seeding vendors...');
    const vendors = await seedVendors(users);
    
    console.log('\n📝 Seeding vendor products...');
    await seedVendorProducts(vendors, products);
    
    console.log('\n📝 Seeding vendor documents...');
    await seedVendorDocuments(vendors);
    
    console.log('\n📝 Seeding coupons...');
    await seedCoupons();
    
    console.log('\n📝 Seeding orders...');
    const orders = await seedOrders(users, products, vendors);
    
    console.log('\n📝 Seeding reviews...');
    await seedReviews(users, orders, products, vendors);
    
    console.log('\n📝 Seeding transactions...');
    await seedTransactions(orders, users);
    
    console.log('\n📝 Seeding payouts...');
    await seedPayouts(vendors, orders);
    
    console.log('\n📝 Seeding ledger...');
    await seedLedger(users, orders);
    
    console.log('\n📝 Seeding wishlists...');
    await seedWishlists(users, products);
    
    console.log('\n📝 Seeding notifications...');
    await seedNotifications(users);
    
    console.log('\n📝 Seeding support tickets...');
    await seedSupportTickets(users, orders);
    
    console.log('\n📝 Seeding pages...');
    await seedPages();
    
    console.log('\n📝 Seeding activity logs...');
    await seedActivityLogs(users);
    
    console.log('\n📝 Seeding daily stats...');
    await seedDailyStats(products, vendors);
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Seeding Summary:');
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Products: ${products.length}`);
    console.log(`   - Vendors: ${vendors.length}`);
    console.log(`   - Orders: ${orders.length}`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

/**
 * Clear all collections (use with caution)
 */
async function clearDatabase() {
  console.log('🗑️  Clearing existing data...');
  const collections = await mongoose.connection.db!.collections();
  
  for (const collection of collections) {
    await collection.deleteMany({});
  }
  console.log('✅ Database cleared');
}

// Run seeder if called directly
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase }; 