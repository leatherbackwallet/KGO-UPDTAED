"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const products_model_1 = require("../models/products.model");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function addProductPrices() {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        const productsWithoutPrice = await products_model_1.Product.find({
            $or: [
                { price: { $exists: false } },
                { price: 0 },
                { price: null }
            ]
        });
        console.log(`Found ${productsWithoutPrice.length} products without price`);
        if (productsWithoutPrice.length === 0) {
            console.log('All products already have prices');
            return;
        }
        const defaultPrice = 29.99;
        let updatedCount = 0;
        for (const product of productsWithoutPrice) {
            await products_model_1.Product.findByIdAndUpdate(product._id, {
                price: defaultPrice
            });
            console.log(`Updated product "${product.name}" with price ₹${defaultPrice}`);
            updatedCount++;
        }
        console.log(`Successfully updated ${updatedCount} products with default price`);
    }
    catch (error) {
        console.error('Migration error:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('Disconnected from MongoDB');
    }
}
addProductPrices();
//# sourceMappingURL=add-product-prices.js.map