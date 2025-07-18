/**
 * VendorDocuments Seed - Sample vendor verification documents
 */

import { VendorDocument, DocumentType, DocumentStatus } from '../models/vendorDocuments.model';

export async function seedVendorDocuments(vendors: any[]) {
  try {
    const existing = await VendorDocument.countDocuments();
    if (existing > 0) {
      console.log('   ⏭️  Vendor documents already exist, skipping...');
      return;
    }

    const documents = [];
    
    for (const vendor of vendors) {
      documents.push({
        vendorId: vendor._id,
        documentType: DocumentType.GSTIN,
        fileUrl: '/documents/gstin-sample.pdf',
        status: DocumentStatus.APPROVED
      });
    }

    await VendorDocument.insertMany(documents);
    console.log(`   ✅ Created ${documents.length} vendor documents`);
  } catch (error) {
    console.error('   ❌ Error seeding vendor documents:', error);
  }
} 