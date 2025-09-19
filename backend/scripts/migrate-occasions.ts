/**
 * Occasions Migration Script
 * Creates predefined occasions with date ranges and migrates existing product occasion data
 */

import mongoose from 'mongoose';
import { Occasion } from '../models/occasions.model';
import { Product } from '../models/products.model';
import { connectToDatabase } from '../utils/database';

// Predefined occasions with date ranges
const PREDEFINED_OCCASIONS = [
  {
    name: "Diwali",
    description: "Festival of Lights - Hindu celebration of victory of light over darkness",
    icon: "🪔",
    color: "#FF6B35",
    dateRange: {
      startMonth: 10,
      startDay: 15,
      endMonth: 11,
      endDay: 15,
      isRecurring: true
    },
    priority: {
      level: "peak" as const,
      boostMultiplier: 2.5
    },
    seasonalFlags: {
      isFestival: true,
      isHoliday: true,
      isPersonal: false,
      isSeasonal: false
    },
    sortOrder: 1
  },
  {
    name: "Onam",
    description: "Kerala's harvest festival celebrating King Mahabali's return",
    icon: "🌾",
    color: "#4CAF50",
    dateRange: {
      startMonth: 8,
      startDay: 20,
      endMonth: 9,
      endDay: 5,
      isRecurring: true
    },
    priority: {
      level: "peak" as const,
      boostMultiplier: 2.5
    },
    seasonalFlags: {
      isFestival: true,
      isHoliday: true,
      isPersonal: false,
      isSeasonal: false
    },
    sortOrder: 2
  },
  {
    name: "Birthday",
    description: "Personal celebration of birth anniversary",
    icon: "🎂",
    color: "#E91E63",
    dateRange: {
      startMonth: 1,
      startDay: 1,
      endMonth: 12,
      endDay: 31,
      isRecurring: true
    },
    priority: {
      level: "medium" as const,
      boostMultiplier: 1.5
    },
    seasonalFlags: {
      isFestival: false,
      isHoliday: false,
      isPersonal: true,
      isSeasonal: false
    },
    sortOrder: 3
  },
  {
    name: "Anniversary",
    description: "Celebration of wedding or relationship milestones",
    icon: "💍",
    color: "#9C27B0",
    dateRange: {
      startMonth: 1,
      startDay: 1,
      endMonth: 12,
      endDay: 31,
      isRecurring: true
    },
    priority: {
      level: "high" as const,
      boostMultiplier: 2.0
    },
    seasonalFlags: {
      isFestival: false,
      isHoliday: false,
      isPersonal: true,
      isSeasonal: false
    },
    sortOrder: 4
  },
  {
    name: "Wedding",
    description: "Marriage celebration and ceremonies",
    icon: "💒",
    color: "#FF9800",
    dateRange: {
      startMonth: 1,
      startDay: 1,
      endMonth: 12,
      endDay: 31,
      isRecurring: true
    },
    priority: {
      level: "peak" as const,
      boostMultiplier: 2.5
    },
    seasonalFlags: {
      isFestival: false,
      isHoliday: false,
      isPersonal: true,
      isSeasonal: false
    },
    sortOrder: 5
  },
  {
    name: "Valentine's Day",
    description: "Celebration of love and romance",
    icon: "💕",
    color: "#E91E63",
    dateRange: {
      startMonth: 2,
      startDay: 10,
      endMonth: 2,
      endDay: 20,
      isRecurring: true
    },
    priority: {
      level: "high" as const,
      boostMultiplier: 2.0
    },
    seasonalFlags: {
      isFestival: false,
      isHoliday: true,
      isPersonal: true,
      isSeasonal: false
    },
    sortOrder: 6
  },
  {
    name: "Mother's Day",
    description: "Celebration honoring mothers and motherhood",
    icon: "👩‍👧‍👦",
    color: "#FF5722",
    dateRange: {
      startMonth: 5,
      startDay: 8,
      endMonth: 5,
      endDay: 15,
      isRecurring: true
    },
    priority: {
      level: "high" as const,
      boostMultiplier: 2.0
    },
    seasonalFlags: {
      isFestival: false,
      isHoliday: true,
      isPersonal: true,
      isSeasonal: false
    },
    sortOrder: 7
  },
  {
    name: "Father's Day",
    description: "Celebration honoring fathers and fatherhood",
    icon: "👨‍👧‍👦",
    color: "#2196F3",
    dateRange: {
      startMonth: 6,
      startDay: 15,
      endMonth: 6,
      endDay: 22,
      isRecurring: true
    },
    priority: {
      level: "high" as const,
      boostMultiplier: 2.0
    },
    seasonalFlags: {
      isFestival: false,
      isHoliday: true,
      isPersonal: true,
      isSeasonal: false
    },
    sortOrder: 8
  },
  {
    name: "New Born",
    description: "Celebration of new baby arrival",
    icon: "👶",
    color: "#FFC107",
    dateRange: {
      startMonth: 1,
      startDay: 1,
      endMonth: 12,
      endDay: 31,
      isRecurring: true
    },
    priority: {
      level: "high" as const,
      boostMultiplier: 2.0
    },
    seasonalFlags: {
      isFestival: false,
      isHoliday: false,
      isPersonal: true,
      isSeasonal: false
    },
    sortOrder: 9
  },
  {
    name: "Thank You",
    description: "Expression of gratitude and appreciation",
    icon: "🙏",
    color: "#4CAF50",
    dateRange: {
      startMonth: 1,
      startDay: 1,
      endMonth: 12,
      endDay: 31,
      isRecurring: true
    },
    priority: {
      level: "low" as const,
      boostMultiplier: 1.2
    },
    seasonalFlags: {
      isFestival: false,
      isHoliday: false,
      isPersonal: true,
      isSeasonal: false
    },
    sortOrder: 10
  },
  {
    name: "Get Well Soon",
    description: "Wishes for quick recovery and good health",
    icon: "🏥",
    color: "#00BCD4",
    dateRange: {
      startMonth: 1,
      startDay: 1,
      endMonth: 12,
      endDay: 31,
      isRecurring: true
    },
    priority: {
      level: "medium" as const,
      boostMultiplier: 1.5
    },
    seasonalFlags: {
      isFestival: false,
      isHoliday: false,
      isPersonal: true,
      isSeasonal: false
    },
    sortOrder: 11
  },
  {
    name: "Condolences",
    description: "Sympathy and support during difficult times",
    icon: "🕊️",
    color: "#607D8B",
    dateRange: {
      startMonth: 1,
      startDay: 1,
      endMonth: 12,
      endDay: 31,
      isRecurring: true
    },
    priority: {
      level: "medium" as const,
      boostMultiplier: 1.3
    },
    seasonalFlags: {
      isFestival: false,
      isHoliday: false,
      isPersonal: true,
      isSeasonal: false
    },
    sortOrder: 12
  },
  {
    name: "Congratulation",
    description: "Celebration of achievements and milestones",
    icon: "🎉",
    color: "#FF9800",
    dateRange: {
      startMonth: 1,
      startDay: 1,
      endMonth: 12,
      endDay: 31,
      isRecurring: true
    },
    priority: {
      level: "medium" as const,
      boostMultiplier: 1.5
    },
    seasonalFlags: {
      isFestival: false,
      isHoliday: false,
      isPersonal: true,
      isSeasonal: false
    },
    sortOrder: 13
  },
  {
    name: "House Warming",
    description: "Celebration of new home or relocation",
    icon: "🏠",
    color: "#795548",
    dateRange: {
      startMonth: 1,
      startDay: 1,
      endMonth: 12,
      endDay: 31,
      isRecurring: true
    },
    priority: {
      level: "medium" as const,
      boostMultiplier: 1.5
    },
    seasonalFlags: {
      isFestival: false,
      isHoliday: false,
      isPersonal: true,
      isSeasonal: false
    },
    sortOrder: 14
  },
  {
    name: "Just Because",
    description: "Spontaneous gift giving without specific occasion",
    icon: "🎁",
    color: "#9E9E9E",
    dateRange: {
      startMonth: 1,
      startDay: 1,
      endMonth: 12,
      endDay: 31,
      isRecurring: true
    },
    priority: {
      level: "low" as const,
      boostMultiplier: 1.0
    },
    seasonalFlags: {
      isFestival: false,
      isHoliday: false,
      isPersonal: true,
      isSeasonal: false
    },
    sortOrder: 15
  },
  {
    name: "Miss You",
    description: "Expression of longing and affection",
    icon: "💌",
    color: "#E91E63",
    dateRange: {
      startMonth: 1,
      startDay: 1,
      endMonth: 12,
      endDay: 31,
      isRecurring: true
    },
    priority: {
      level: "low" as const,
      boostMultiplier: 1.2
    },
    seasonalFlags: {
      isFestival: false,
      isHoliday: false,
      isPersonal: true,
      isSeasonal: false
    },
    sortOrder: 16
  },
  {
    name: "Sympathy",
    description: "Support and comfort during loss",
    icon: "🤝",
    color: "#607D8B",
    dateRange: {
      startMonth: 1,
      startDay: 1,
      endMonth: 12,
      endDay: 31,
      isRecurring: true
    },
    priority: {
      level: "medium" as const,
      boostMultiplier: 1.3
    },
    seasonalFlags: {
      isFestival: false,
      isHoliday: false,
      isPersonal: true,
      isSeasonal: false
    },
    sortOrder: 17
  },
  {
    name: "Traditional",
    description: "Cultural and traditional celebrations",
    icon: "🏛️",
    color: "#8BC34A",
    dateRange: {
      startMonth: 1,
      startDay: 1,
      endMonth: 12,
      endDay: 31,
      isRecurring: true
    },
    priority: {
      level: "medium" as const,
      boostMultiplier: 1.5
    },
    seasonalFlags: {
      isFestival: true,
      isHoliday: false,
      isPersonal: false,
      isSeasonal: false
    },
    sortOrder: 18
  }
];

// Mapping from old occasion strings to new occasion names
const OCCASION_MAPPING: { [key: string]: string } = {
  'DIWALI': 'Diwali',
  'ONAM': 'Onam',
  'BIRTHDAY': 'Birthday',
  'ANNIVERSARY': 'Anniversary',
  'WEDDING': 'Wedding',
  'FATHERS DAY': 'Father\'s Day',
  'NEW BORN': 'New Born',
  'THANK YOU': 'Thank You',
  'GET WELL SOON': 'Get Well Soon',
  'CONDOLENCES': 'Condolences',
  'CONGRATULATION': 'Congratulation',
  'HOUSE WARMING': 'House Warming',
  'JUST BECAUSE': 'Just Because',
  'MISS YOU': 'Miss You',
  'SYMPATHY': 'Sympathy',
  'TRADITIONAL': 'Traditional'
};

async function migrateOccasions() {
  try {
    console.log('🚀 Starting occasions migration...');
    
    // Connect to database
    await connectToDatabase();
    console.log('✅ Connected to database');

    // Check if occasions already exist
    const existingOccasions = await Occasion.countDocuments();
    if (existingOccasions > 0) {
      console.log(`⚠️  ${existingOccasions} occasions already exist. Skipping creation.`);
    } else {
      // Create predefined occasions
      console.log('📝 Creating predefined occasions...');
      for (const occasionData of PREDEFINED_OCCASIONS) {
        const occasion = new Occasion(occasionData);
        await occasion.save();
        console.log(`✅ Created occasion: ${occasion.name}`);
      }
      console.log(`✅ Created ${PREDEFINED_OCCASIONS.length} occasions`);
    }

    // Get all occasions for mapping
    const occasions = await Occasion.find({});
    const occasionMap = new Map(occasions.map(occ => [occ.name, occ._id]));

    // Migrate product occasions
    console.log('🔄 Migrating product occasions...');
    const products = await Product.find({ occasions: { $exists: true, $ne: [] } });
    console.log(`📦 Found ${products.length} products with occasions`);

    let migratedCount = 0;
    for (const product of products) {
      const newOccasionIds: string[] = [];
      
      for (const oldOccasion of product.occasions) {
        const newOccasionName = OCCASION_MAPPING[oldOccasion.toString() as keyof typeof OCCASION_MAPPING];
        if (newOccasionName && occasionMap.has(newOccasionName)) {
          const occasionId = occasionMap.get(newOccasionName);
          if (occasionId && !newOccasionIds.includes(occasionId.toString())) {
            newOccasionIds.push(occasionId.toString());
          }
        }
      }

      if (newOccasionIds.length > 0) {
        product.occasions = newOccasionIds.map(id => new mongoose.Types.ObjectId(id));
        await product.save();
        migratedCount++;
        console.log(`✅ Migrated product: ${product.name} (${newOccasionIds.length} occasions)`);
      }
    }

    console.log(`✅ Migration completed!`);
    console.log(`📊 Summary:`);
    console.log(`   - Occasions created: ${PREDEFINED_OCCASIONS.length}`);
    console.log(`   - Products migrated: ${migratedCount}`);
    console.log(`   - Total products processed: ${products.length}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateOccasions()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export { migrateOccasions };
