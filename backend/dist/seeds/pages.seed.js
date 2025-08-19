"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedPages = seedPages;
const pages_model_1 = require("../models/pages.model");
async function seedPages() {
    try {
        const existing = await pages_model_1.Page.countDocuments();
        if (existing > 0) {
            console.log('   ⏭️  Pages already exist, skipping...');
            return;
        }
        await pages_model_1.Page.create({ title: 'About Us', slug: 'about-us', body: 'About us page content.', status: pages_model_1.PageStatus.PUBLISHED });
        console.log('   ✅ Created 1 page');
    }
    catch (error) {
        console.error('   ❌ Error seeding pages:', error);
    }
}
//# sourceMappingURL=pages.seed.js.map