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
async function fixAllProductImages() {
    try {
        console.log('🔧 Fixing all product images...');
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI environment variable is required');
        }
        await mongoose_1.default.connect(mongoUri);
        console.log('✅ Connected to MongoDB');
        const products = await products_model_1.Product.find({});
        console.log(`📊 Found ${products.length} products`);
        const workingImages = [
            'keralagiftsonline/products/product-1756023789547-930946815',
            'keralagiftsonline/products/product-1756023765540-566483315'
        ];
        let imageIndex = 0;
        for (const product of products) {
            console.log(`\n🔧 Processing: ${product.name}`);
            console.log(`   Current images: ${JSON.stringify(product.images)}`);
            const workingImage = workingImages[imageIndex % workingImages.length];
            const updatedProduct = await products_model_1.Product.findByIdAndUpdate(product._id, {
                images: [workingImage],
                defaultImage: workingImage
            }, { new: true });
            if (updatedProduct) {
                console.log(`   ✅ Updated with: ${workingImage}`);
                imageIndex++;
            }
            else {
                console.log(`   ❌ Failed to update`);
            }
        }
        console.log('\n🎉 All product images updated!');
    }
    catch (error) {
        console.error('❌ Error fixing product images:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('Disconnected from MongoDB');
    }
}
if (require.main === module) {
    fixAllProductImages();
}
//# sourceMappingURL=fix-all-product-images.js.map