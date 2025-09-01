"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const products_model_1 = require("../models/products.model");
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../.env') });
async function fixTestcake2Image() {
    try {
        console.log('🔧 Fixing test2CAKE image...');
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI environment variable is required');
        }
        await mongoose_1.default.connect(mongoUri);
        console.log('✅ Connected to MongoDB');
        const testcake2 = await products_model_1.Product.findOne({ name: 'test2CAKE' });
        if (!testcake2) {
            console.log('❌ test2CAKE product not found');
            return;
        }
        console.log(`✅ Found test2CAKE product: ${testcake2._id}`);
        console.log(`Current images: ${JSON.stringify(testcake2.images)}`);
        console.log(`Current defaultImage: ${testcake2.defaultImage}`);
        const cloudinaryImageId = 'keralagiftsonline/products/product-1756024186118-30010235';
        const updatedProduct = await products_model_1.Product.findByIdAndUpdate(testcake2._id, {
            images: [cloudinaryImageId],
            defaultImage: cloudinaryImageId
        }, { new: true });
        if (updatedProduct) {
            console.log('✅ test2CAKE image updated successfully!');
            console.log(`New images: ${JSON.stringify(updatedProduct.images)}`);
            console.log(`New defaultImage: ${updatedProduct.defaultImage}`);
            const cloudinaryUrl = `https://res.cloudinary.com/deojqbepy/image/upload/${cloudinaryImageId}`;
            console.log(`Cloudinary URL: ${cloudinaryUrl}`);
        }
        else {
            console.log('❌ Failed to update test2CAKE product');
        }
    }
    catch (error) {
        console.error('❌ Error fixing test2CAKE image:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('Disconnected from MongoDB');
    }
}
if (require.main === module) {
    fixTestcake2Image();
}
//# sourceMappingURL=fix-testcake2-image.js.map