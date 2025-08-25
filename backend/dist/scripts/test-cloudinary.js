"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const cloudinary_1 = require("cloudinary");
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../.env') });
async function testCloudinary() {
    try {
        console.log('🔍 Testing Cloudinary Configuration...\n');
        const config = {
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        };
        console.log('📋 Environment Variables:');
        console.log(`  Cloud Name: ${config.cloud_name ? '✅ Set' : '❌ Missing'}`);
        console.log(`  API Key: ${config.api_key ? '✅ Set' : '❌ Missing'}`);
        console.log(`  API Secret: ${config.api_secret ? '✅ Set' : '❌ Missing'}\n`);
        const missingConfig = Object.entries(config)
            .filter(([key, value]) => !value)
            .map(([key]) => key);
        if (missingConfig.length > 0) {
            console.error('❌ Missing configuration:', missingConfig.join(', '));
            console.log('\n💡 Please add the missing environment variables to your .env file');
            process.exit(1);
        }
        cloudinary_1.v2.config({
            cloud_name: config.cloud_name,
            api_key: config.api_key,
            api_secret: config.api_secret
        });
        console.log('🔗 Testing Cloudinary Connection...');
        const result = await cloudinary_1.v2.api.resources({
            type: 'upload',
            max_results: 1
        });
        console.log('✅ Cloudinary connection successful!');
        console.log(`📊 Account Status: Active`);
        console.log(`📁 Total Resources: ${result.total_count || 0}`);
        console.log(`📦 Used Storage: ${result.rate_limit_remaining || 'Unknown'}\n`);
        console.log('📁 Testing folder access...');
        try {
            const folderResult = await cloudinary_1.v2.api.resources({
                type: 'upload',
                prefix: 'keralagiftsonline/products',
                max_results: 1
            });
            console.log('✅ Products folder accessible');
        }
        catch (folderError) {
            console.log('ℹ️  Products folder will be created on first upload');
        }
        console.log('\n🎉 All tests passed! Cloudinary is ready to use.');
        console.log('\n📝 Next steps:');
        console.log('  1. Start your server: npm run dev');
        console.log('  2. Test image upload via API');
        console.log('  3. Run migration if needed: npm run migrate:cloudinary');
    }
    catch (error) {
        console.error('\n❌ Cloudinary test failed:', error);
        if (error instanceof Error) {
            if (error.message.includes('401')) {
                console.log('\n💡 This usually means invalid API credentials. Please check:');
                console.log('  - Cloudinary API Key is correct');
                console.log('  - Cloudinary API Secret is correct');
                console.log('  - Cloudinary Cloud Name is correct');
            }
            else if (error.message.includes('403')) {
                console.log('\n💡 This usually means insufficient permissions. Please check:');
                console.log('  - Your Cloudinary account is active');
                console.log('  - You have the necessary permissions');
            }
        }
        process.exit(1);
    }
}
if (require.main === module) {
    testCloudinary();
}
//# sourceMappingURL=test-cloudinary.js.map