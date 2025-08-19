"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const products_model_1 = require("../models/products.model");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function addProductStock() {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        const productsWithoutStock = await products_model_1.Product.find({
            $or: [
                { stock: { $exists: false } },
                { stock: null },
                { stock: 0 }
            ]
        });
        console.log(`Found ${productsWithoutStock.length} products without stock`);
        if (productsWithoutStock.length === 0) {
            console.log('All products already have stock values');
            return;
        }
        const defaultStock = 100;
        let updatedCount = 0;
        for (const product of productsWithoutStock) {
            await products_model_1.Product.findByIdAndUpdate(product._id, {
                stock: defaultStock
            });
            console.log(`Updated product "${product.name.en}" with stock ${defaultStock}`);
            updatedCount++;
        }
        console.log(`Successfully updated ${updatedCount} products with default stock`);
    }
    catch (error) {
        console.error('Migration error:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('Disconnected from MongoDB');
    }
}
addProductStock();
//# sourceMappingURL=add-product-stock.js.map