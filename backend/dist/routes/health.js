"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const products_model_1 = require("../models/products.model");
const productAttributes_model_1 = require("../models/productAttributes.model");
const vendorProducts_model_1 = require("../models/vendorProducts.model");
const reviews_model_1 = require("../models/reviews.model");
const wishlists_model_1 = require("../models/wishlists.model");
const router = express_1.default.Router();
router.get('/', async (req, res) => {
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: {
                status: 'connected',
                collections: {}
            },
            integrity: {
                orphanedRecords: {},
                totalIssues: 0
            }
        };
        if (mongoose_1.default.connection.readyState !== 1) {
            health.status = 'unhealthy';
            health.database.status = 'disconnected';
            res.status(503).json(health);
            return;
        }
        const existingProductIds = await products_model_1.Product.find({}, '_id');
        const productIdSet = new Set(existingProductIds.map(p => p._id.toString()));
        const orphanedAttributes = await productAttributes_model_1.ProductAttribute.countDocuments({
            productId: { $nin: existingProductIds.map(p => p._id) }
        });
        const orphanedVendorProducts = await vendorProducts_model_1.VendorProduct.countDocuments({
            productId: { $nin: existingProductIds.map(p => p._id) }
        });
        const orphanedReviews = await reviews_model_1.Review.countDocuments({
            productId: { $nin: existingProductIds.map(p => p._id) }
        });
        health.database.collections = {
            products: await products_model_1.Product.countDocuments(),
            productAttributes: await productAttributes_model_1.ProductAttribute.countDocuments(),
            vendorProducts: await vendorProducts_model_1.VendorProduct.countDocuments(),
            reviews: await reviews_model_1.Review.countDocuments(),
            wishlists: await wishlists_model_1.Wishlist.countDocuments()
        };
        health.integrity.orphanedRecords = {
            productAttributes: orphanedAttributes,
            vendorProducts: orphanedVendorProducts,
            reviews: orphanedReviews
        };
        health.integrity.totalIssues = orphanedAttributes + orphanedVendorProducts + orphanedReviews;
        if (health.integrity.totalIssues > 0) {
            health.status = 'degraded';
            health.message = `Found ${health.integrity.totalIssues} orphaned records`;
        }
        res.json(health);
    }
    catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=health.js.map