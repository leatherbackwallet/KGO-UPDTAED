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
async function fixFuneralWreathImage() {
    try {
        console.log('🔧 Fixing Funeral Wreath image...');
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI environment variable is required');
        }
        await mongoose_1.default.connect(mongoUri);
        console.log('✅ Connected to MongoDB');
        const product = await products_model_1.Product.findOne({ name: 'Funeral Wreath' });
        if (!product) {
            console.log('❌ Funeral Wreath product not found');
            return;
        }
        console.log(`✅ Found Funeral Wreath product: ${product._id}`);
        console.log(`Current images: ${JSON.stringify(product.images)}`);
        console.log(`Current defaultImage: ${product.defaultImage}`);
        const cloudinaryImageId = 'keralagiftsonline/products/product-1756024815368-142700380';
        const updatedProduct = await products_model_1.Product.findByIdAndUpdate(product._id, {
            images: [cloudinaryImageId],
            defaultImage: cloudinaryImageId
        }, { new: true });
        if (updatedProduct) {
            console.log('✅ Funeral Wreath image updated successfully!');
            console.log(`New images: ${JSON.stringify(updatedProduct.images)}`);
            console.log(`New defaultImage: ${updatedProduct.defaultImage}`);
            const cloudinaryUrl = `https://res.cloudinary.com/deojqbepy/image/upload/${cloudinaryImageId}`;
            console.log(`Cloudinary URL: ${cloudinaryUrl}`);
        }
        else {
            console.log('❌ Failed to update Funeral Wreath product');
        }
    }
    catch (error) {
        console.error('❌ Error fixing Funeral Wreath image:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('Disconnected from MongoDB');
    }
}
if (require.main === module) {
    fixFuneralWreathImage();
}
//# sourceMappingURL=fix-funeral-wreath-image.js.map