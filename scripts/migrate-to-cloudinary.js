"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const migrateToCloudinary_1 = require("../utils/migrateToCloudinary");
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../.env') });
async function main() {
    try {
        console.log('Starting Cloudinary migration...');
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI environment variable is required');
        }
        await mongoose_1.default.connect(mongoUri);
        console.log('Connected to MongoDB');
        const cloudinaryConfig = {
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        };
        const missingConfig = Object.entries(cloudinaryConfig)
            .filter(([key, value]) => !value)
            .map(([key]) => key);
        if (missingConfig.length > 0) {
            throw new Error(`Missing Cloudinary configuration: ${missingConfig.join(', ')}`);
        }
        console.log('Cloudinary configuration verified');
        const args = process.argv.slice(2);
        const options = {
            deleteLocalAfterUpload: args.includes('--delete-local'),
            updateProductReferences: args.includes('--update-products'),
            batchSize: 10
        };
        console.log('Migration options:', options);
        const results = await (0, migrateToCloudinary_1.migrateAllImages)(options);
        const report = (0, migrateToCloudinary_1.generateMigrationReport)(results);
        console.log(report);
        const fs = await Promise.resolve().then(() => __importStar(require('fs')));
        const reportPath = `migration-report-${new Date().toISOString().split('T')[0]}.txt`;
        fs.writeFileSync(reportPath, report);
        console.log(`Migration report saved to: ${reportPath}`);
        console.log('Migration completed successfully!');
    }
    catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('Disconnected from MongoDB');
    }
}
if (require.main === module) {
    main();
}
//# sourceMappingURL=migrate-to-cloudinary.js.map