/**
 * Health Check Routes
 * Provides system health monitoring and status endpoints
 */

import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product } from '../models/products.model';
import { ProductAttribute } from '../models/productAttributes.model';
import { VendorProduct } from '../models/vendorProducts.model';
import { Review } from '../models/reviews.model';
import { Wishlist } from '../models/wishlists.model';

const router = express.Router();

// Enhanced health check with database integrity
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const health: any = {
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

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      health.status = 'unhealthy';
      health.database.status = 'disconnected';
      res.status(503).json(health);
      return;
    }

    // Check for orphaned records
    const existingProductIds = await Product.find({}, '_id');
    const productIdSet = new Set(existingProductIds.map(p => p._id.toString()));

    // Check orphaned product attributes
    const orphanedAttributes = await ProductAttribute.countDocuments({
      productId: { $nin: existingProductIds.map(p => p._id) }
    });

    // Check orphaned vendor products
    const orphanedVendorProducts = await VendorProduct.countDocuments({
      productId: { $nin: existingProductIds.map(p => p._id) }
    });

    // Check orphaned reviews
    const orphanedReviews = await Review.countDocuments({
      productId: { $nin: existingProductIds.map(p => p._id) }
    });

    // Check collection counts
    health.database.collections = {
      products: await Product.countDocuments(),
      productAttributes: await ProductAttribute.countDocuments(),
      vendorProducts: await VendorProduct.countDocuments(),
      reviews: await Review.countDocuments(),
      wishlists: await Wishlist.countDocuments()
    };

    // Integrity check results
    health.integrity.orphanedRecords = {
      productAttributes: orphanedAttributes,
      vendorProducts: orphanedVendorProducts,
      reviews: orphanedReviews
    };

    health.integrity.totalIssues = orphanedAttributes + orphanedVendorProducts + orphanedReviews;

    // Mark as unhealthy if there are integrity issues
    if (health.integrity.totalIssues > 0) {
      health.status = 'degraded';
      health.message = `Found ${health.integrity.totalIssues} orphaned records`;
    }

    res.json(health);
  } catch (error: any) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

export default router;
