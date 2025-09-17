"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const products_model_1 = require("../models/products.model");
const categories_model_1 = require("../models/categories.model");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const sampleProducts = [
    {
        name: 'Kerala Spice Box',
        slug: 'kerala-spice-box',
        description: 'Authentic Kerala spices in a beautiful wooden box',
        price: 1299,
        stock: 50,
        images: ['kerala-spice-box.jpg'],
        categories: [],
        occasions: ['ONAM', 'WEDDING'],
        isFeatured: true,
        isDeleted: false
    },
    {
        name: 'Coconut Oil - Virgin',
        slug: 'coconut-oil-virgin',
        description: 'Pure virgin coconut oil from Kerala',
        price: 599,
        stock: 100,
        images: ['coconut-oil-virgin.jpg'],
        categories: [],
        occasions: ['JUST BECAUSE'],
        isFeatured: true,
        isDeleted: false
    },
    {
        name: 'Traditional Kerala Saree',
        slug: 'traditional-kerala-saree',
        description: 'Handwoven Kerala saree with golden border',
        price: 2999,
        stock: 25,
        images: ['kerala-saree-traditional.jpg'],
        categories: [],
        occasions: ['ONAM', 'WEDDING'],
        isFeatured: true,
        isDeleted: false
    },
    {
        name: 'Kerala Banana Chips',
        slug: 'kerala-banana-chips',
        description: 'Crispy banana chips made in traditional Kerala style',
        price: 199,
        stock: 200,
        images: ['banana-chips-kerala.jpg'],
        categories: [],
        occasions: ['JUST BECAUSE'],
        isFeatured: false,
        isDeleted: false
    },
    {
        name: 'Ayurvedic Herbal Tea',
        slug: 'ayurvedic-herbal-tea',
        description: 'Traditional Kerala herbal tea blend',
        price: 399,
        stock: 75,
        images: ['ayurvedic-herbal-tea.jpg'],
        categories: [],
        occasions: ['GET WELL SOON'],
        isFeatured: true,
        isDeleted: false
    }
];
const sampleCategories = [
    {
        name: 'Spices & Condiments',
        slug: 'spices-condiments',
        description: 'Authentic Kerala spices and condiments',
        isActive: true,
        isPopular: true
    },
    {
        name: 'Coconut Products',
        slug: 'coconut-products',
        description: 'Pure coconut oil and related products',
        isActive: true,
        isPopular: true
    },
    {
        name: 'Traditional Clothing',
        slug: 'traditional-clothing',
        description: 'Kerala traditional wear and sarees',
        isActive: true,
        isPopular: false
    },
    {
        name: 'Snacks & Food',
        slug: 'snacks-food',
        description: 'Traditional Kerala snacks and food items',
        isActive: true,
        isPopular: true
    },
    {
        name: 'Health & Wellness',
        slug: 'health-wellness',
        description: 'Ayurvedic and health products',
        isActive: true,
        isPopular: false
    }
];
async function seedDatabase() {
    try {
        console.log('🌱 Starting database seeding...');
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI environment variable is not set');
        }
        await mongoose_1.default.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        await products_model_1.Product.deleteMany({});
        await categories_model_1.Category.deleteMany({});
        console.log('🧹 Cleared existing data');
        const createdCategories = await categories_model_1.Category.insertMany(sampleCategories);
        console.log(`✅ Created ${createdCategories.length} categories`);
        const updatedProducts = sampleProducts.map((product, index) => ({
            ...product,
            categories: [createdCategories[index % createdCategories.length]?._id]
        }));
        const createdProducts = await products_model_1.Product.insertMany(updatedProducts);
        console.log(`✅ Created ${createdProducts.length} products`);
        console.log('🎉 Database seeding completed successfully!');
        console.log(`📊 Summary:`);
        console.log(`   - Categories: ${createdCategories.length}`);
        console.log(`   - Products: ${createdProducts.length}`);
    }
    catch (error) {
        console.error('❌ Error seeding database:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}
seedDatabase();
//# sourceMappingURL=seed-products.js.map