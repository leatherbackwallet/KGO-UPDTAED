"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedVendorDocuments = seedVendorDocuments;
const vendorDocuments_model_1 = require("../models/vendorDocuments.model");
async function seedVendorDocuments(vendors) {
    try {
        const existing = await vendorDocuments_model_1.VendorDocument.countDocuments();
        if (existing > 0) {
            console.log('   ⏭️  Vendor documents already exist, skipping...');
            return;
        }
        const documents = [];
        for (const vendor of vendors) {
            documents.push({
                vendorId: vendor._id,
                documentType: vendorDocuments_model_1.DocumentType.GSTIN,
                fileUrl: '/documents/gstin-sample.pdf',
                status: vendorDocuments_model_1.DocumentStatus.APPROVED
            });
        }
        await vendorDocuments_model_1.VendorDocument.insertMany(documents);
        console.log(`   ✅ Created ${documents.length} vendor documents`);
    }
    catch (error) {
        console.error('   ❌ Error seeding vendor documents:', error);
    }
}
//# sourceMappingURL=vendorDocuments.seed.js.map