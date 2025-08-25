"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const cloudinary_1 = require("cloudinary");
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../.env') });
async function checkCloudinaryImages() {
    try {
        console.log('🔍 Checking Cloudinary images...');
        cloudinary_1.v2.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
        const result = await cloudinary_1.v2.api.resources({
            type: 'upload',
            prefix: 'keralagiftsonline/products',
            max_results: 50
        });
        console.log(`📊 Found ${result.resources.length} images in Cloudinary:`);
        console.log('');
        result.resources.forEach((resource, index) => {
            console.log(`${index + 1}. ${resource.public_id}`);
            console.log(`   Format: ${resource.format}`);
            console.log(`   Size: ${resource.bytes} bytes`);
            console.log(`   Created: ${resource.created_at}`);
            console.log(`   URL: ${resource.secure_url}`);
            console.log('');
        });
        console.log('🔍 Looking for recent uploads that might be for TEST Cake...');
        const recentImages = result.resources
            .filter((resource) => {
            const createdAt = new Date(resource.created_at);
            const now = new Date();
            const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
            return hoursDiff < 24;
        })
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        if (recentImages.length > 0) {
            console.log(`📅 Found ${recentImages.length} recent uploads:`);
            recentImages.forEach((resource) => {
                console.log(`   - ${resource.public_id} (${resource.created_at})`);
            });
        }
        else {
            console.log('📅 No recent uploads found');
        }
    }
    catch (error) {
        console.error('❌ Error checking Cloudinary images:', error);
    }
}
if (require.main === module) {
    checkCloudinaryImages();
}
//# sourceMappingURL=check-cloudinary-images.js.map