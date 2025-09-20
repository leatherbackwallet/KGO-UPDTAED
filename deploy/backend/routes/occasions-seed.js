"use strict";
/**
 * Occasions Seed Route
 * Creates predefined occasions with date ranges
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const occasions_model_1 = require("../models/occasions.model");
const database_1 = require("../middleware/database");
const auth_1 = require("../middleware/auth");
const role_1 = require("../middleware/role");
const router = express_1.default.Router();
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
            level: "peak",
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
            level: "peak",
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
            level: "medium",
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
            level: "high",
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
            level: "peak",
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
            level: "high",
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
            level: "high",
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
            level: "high",
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
            level: "high",
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
            level: "low",
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
            level: "medium",
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
            level: "medium",
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
            level: "medium",
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
            level: "medium",
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
            level: "low",
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
            level: "low",
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
            level: "medium",
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
            level: "medium",
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
// POST /api/occasions/seed - Seed predefined occasions
router.post('/seed', auth_1.auth, (0, role_1.requireRole)('admin'), database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        console.log('🌱 Starting occasions seeding...');
        // Check if occasions already exist
        const existingOccasions = await occasions_model_1.Occasion.countDocuments();
        if (existingOccasions > 0) {
            return res.status(400).json({
                success: false,
                error: {
                    message: `${existingOccasions} occasions already exist. Use the admin panel to manage them.`,
                    code: 'OCCASIONS_EXIST'
                }
            });
        }
        // Create predefined occasions
        console.log('📝 Creating predefined occasions...');
        const createdOccasions = [];
        for (const occasionData of PREDEFINED_OCCASIONS) {
            const occasion = new occasions_model_1.Occasion(occasionData);
            await occasion.save();
            createdOccasions.push(occasion);
            console.log(`✅ Created occasion: ${occasion.name}`);
        }
        console.log(`✅ Created ${createdOccasions.length} occasions`);
        return res.status(201).json({
            success: true,
            data: createdOccasions,
            message: `Successfully created ${createdOccasions.length} occasions`,
            count: createdOccasions.length
        });
    }
    catch (error) {
        console.error('❌ Occasions seeding failed:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to seed occasions',
                code: 'SEED_ERROR',
                details: error.message
            }
        });
    }
});
exports.default = router;
