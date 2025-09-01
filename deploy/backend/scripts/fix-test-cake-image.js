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
async function fixTestCakeImage() {
    try {
        console.log('🔧 Fixing TEST Cake image...');
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI environment variable is required');
        }
        await mongoose_1.default.connect(mongoUri);
        console.log('✅ Connected to MongoDB');
        const testCake = await products_model_1.Product.findOne({ name: 'TEST Cake' });
        if (!testCake) {
            console.log('❌ TEST Cake product not found');
            return;
        }
        console.log(`✅ Found TEST Cake product: ${testCake._id}`);
        console.log(`Current images: ${JSON.stringify(testCake.images)}`);
        console.log(`Current defaultImage: ${testCake.defaultImage}`);
        const cloudinaryImageId = 'keralagiftsonline/products/product-1756023789547-930946815';
        const updatedProduct = await products_model_1.Product.findByIdAndUpdate(testCake._id, {
            images: [cloudinaryImageId],
            defaultImage: cloudinaryImageId
        }, { new: true });
        if (updatedProduct) {
            console.log('✅ TEST Cake image updated successfully!');
            console.log(`New images: ${JSON.stringify(updatedProduct.images)}`);
            console.log(`New defaultImage: ${updatedProduct.defaultImage}`);
            const cloudinaryUrl = `https://res.cloudinary.com/deojqbepy/image/upload/${cloudinaryImageId}`;
            console.log(`Cloudinary URL: ${cloudinaryUrl}`);
        }
        else {
            console.log('❌ Failed to update TEST Cake product');
        }
    }
    catch (error) {
        console.error('❌ Error fixing TEST Cake image:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('Disconnected from MongoDB');
    }
}
if (require.main === module) {
    fixTestCakeImage();
}
//# sourceMappingURL=fix-test-cake-image.js.map