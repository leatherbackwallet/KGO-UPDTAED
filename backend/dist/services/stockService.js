"use strict";
/**
 * Stock Management Service
 * Handles atomic stock operations with proper locking to prevent overselling
 *
 * ⚠️  KNOWN LIMITATION - RACE CONDITION IN DISTRIBUTED SYSTEMS:
 *
 * This service uses an in-memory Map for stock reservations which has a critical limitation:
 * - In-memory Map is NOT shared across multiple Node.js instances/servers
 * - In load-balanced or scaled deployments, each server has its own Map
 * - This can lead to RACE CONDITIONS where multiple servers reserve the same stock
 *
 * EXAMPLE RACE CONDITION:
 * 1. Product has 1 item in stock
 * 2. Server A receives order for 1 item → reserves it in its local Map
 * 3. Server B receives order for 1 item → checks stock, sees 1 available (doesn't know about Server A's reservation)
 * 4. Both servers deduct stock → overselling occurs!
 *
 * SOLUTION FOR PRODUCTION:
 * Replace in-memory Map with Redis or MongoDB-based reservation tracking:
 *
 * Option 1 - Redis (Recommended):
 * - Use Redis SETNX for atomic reservation locks
 * - Set TTL for automatic cleanup
 * - Shared across all server instances
 *
 * Option 2 - MongoDB:
 * - Create a 'stock_reservations' collection
 * - Use MongoDB transactions with locks
 * - Add TTL index for automatic cleanup
 *
 * CURRENT USE CASE:
 * This implementation is acceptable for:
 * - Single server deployments
 * - Development/testing environments
 * - Low traffic applications
 *
 * ACTION REQUIRED:
 * Before scaling to multiple servers, implement Redis-based reservation system.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const products_model_1 = require("../models/products.model");
class StockService {
    constructor() {
        // ⚠️ WARNING: In-memory Map - NOT suitable for multi-server deployments!
        // See file header comments for production solution
        this.reservations = new Map();
        this.RESERVATION_TIMEOUT = 5 * 60 * 1000; // 5 minutes
    }
    /**
     * Check if products have sufficient stock
     */
    async checkStockAvailability(items, session) {
        const results = [];
        const unavailableItems = [];
        for (const item of items) {
            console.log(`🔍 [Stock Service] Checking product: ${item.productId}, quantity: ${item.quantity}`);
            const product = await products_model_1.Product.findById(item.productId).session(session || null);
            if (!product) {
                console.error(`❌ [Stock Service] Product not found: ${item.productId}`);
                results.push({
                    available: false,
                    currentStock: 0,
                    requestedQuantity: item.quantity,
                    productName: `Unknown Product (ID: ${item.productId})`
                });
                unavailableItems.push(item.productId);
                continue;
            }
            console.log(`✅ [Stock Service] Product found: ${product.name} (ID: ${item.productId}), current stock: ${product.stock}`);
            // Check current stock minus any active reservations
            const reservedQuantity = this.getReservedQuantity(item.productId);
            const availableStock = Math.max(0, product.stock - reservedQuantity);
            const isAvailable = availableStock >= item.quantity;
            console.log(`📊 [Stock Service] ${product.name}: Total stock: ${product.stock}, Reserved: ${reservedQuantity}, Available: ${availableStock}, Requested: ${item.quantity}, Available: ${isAvailable}`);
            results.push({
                available: isAvailable,
                currentStock: product.stock,
                requestedQuantity: item.quantity,
                productName: product.name
            });
            if (!isAvailable) {
                console.warn(`⚠️ [Stock Service] Insufficient stock for ${product.name}: ${availableStock} available, ${item.quantity} requested`);
                unavailableItems.push(item.productId);
            }
        }
        return {
            available: unavailableItems.length === 0,
            results,
            unavailableItems
        };
    }
    /**
     * Reserve stock for a specific user session
     */
    async reserveStock(items, userId, sessionId, dbSession) {
        const reservations = [];
        const errors = [];
        try {
            // First, check availability
            const availabilityCheck = await this.checkStockAvailability(items, dbSession);
            if (!availabilityCheck.available) {
                return {
                    success: false,
                    reservations: [],
                    errors: availabilityCheck.results
                        .filter(r => !r.available)
                        .map(r => `Insufficient stock for ${r.productName}: ${r.currentStock} available, ${r.requestedQuantity} requested`)
                };
            }
            // Reserve stock atomically
            for (const item of items) {
                const reservationKey = `${item.productId}_${userId}_${sessionId}`;
                const expiresAt = new Date(Date.now() + this.RESERVATION_TIMEOUT);
                // Create reservation
                const reservation = {
                    productId: item.productId,
                    quantity: item.quantity,
                    userId,
                    sessionId,
                    expiresAt
                };
                this.reservations.set(reservationKey, reservation);
                reservations.push(reservationKey);
                // Update database stock atomically
                const updateResult = await products_model_1.Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } }, {
                    session: dbSession,
                    new: true,
                    runValidators: true
                });
                if (!updateResult) {
                    // Rollback reservation if database update fails
                    this.reservations.delete(reservationKey);
                    errors.push(`Failed to update stock for product ${item.productId}`);
                }
            }
            return {
                success: errors.length === 0,
                reservations,
                errors
            };
        }
        catch (error) {
            // Clean up any partial reservations
            reservations.forEach(key => this.reservations.delete(key));
            return {
                success: false,
                reservations: [],
                errors: [`Stock reservation failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
            };
        }
    }
    /**
     * Release stock reservations
     */
    async releaseStock(reservationKeys, dbSession) {
        const errors = [];
        let released = 0;
        for (const key of reservationKeys) {
            const reservation = this.reservations.get(key);
            if (!reservation) {
                continue; // Already released or expired
            }
            try {
                // Restore stock in database
                await products_model_1.Product.findByIdAndUpdate(reservation.productId, { $inc: { stock: reservation.quantity } }, { session: dbSession });
                // Remove reservation
                this.reservations.delete(key);
                released++;
            }
            catch (error) {
                errors.push(`Failed to release stock for reservation ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        return {
            success: errors.length === 0,
            released,
            errors
        };
    }
    /**
     * Confirm stock reservations (convert to permanent order)
     */
    async confirmStockReservations(reservationKeys, dbSession) {
        const errors = [];
        let confirmed = 0;
        for (const key of reservationKeys) {
            const reservation = this.reservations.get(key);
            if (!reservation) {
                errors.push(`Reservation ${key} not found or expired`);
                continue;
            }
            try {
                // Remove reservation (stock already deducted)
                this.reservations.delete(key);
                confirmed++;
            }
            catch (error) {
                errors.push(`Failed to confirm reservation ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        return {
            success: errors.length === 0,
            confirmed,
            errors
        };
    }
    /**
     * Get reserved quantity for a product
     */
    getReservedQuantity(productId) {
        let reserved = 0;
        for (const [key, reservation] of this.reservations.entries()) {
            if (reservation.productId === productId && reservation.expiresAt > new Date()) {
                reserved += reservation.quantity;
            }
        }
        return reserved;
    }
    /**
     * Clean up expired reservations
     */
    cleanupExpiredReservations() {
        const now = new Date();
        const expiredKeys = [];
        for (const [key, reservation] of this.reservations.entries()) {
            if (reservation.expiresAt <= now) {
                expiredKeys.push(key);
            }
        }
        // Release expired reservations
        expiredKeys.forEach(key => {
            const reservation = this.reservations.get(key);
            if (reservation) {
                // Restore stock for expired reservations
                products_model_1.Product.findByIdAndUpdate(reservation.productId, { $inc: { stock: reservation.quantity } }).catch(error => {
                    console.error(`Failed to restore stock for expired reservation ${key}:`, error);
                });
                this.reservations.delete(key);
            }
        });
        if (expiredKeys.length > 0) {
            console.log(`Cleaned up ${expiredKeys.length} expired stock reservations`);
        }
    }
    /**
     * Get reservation statistics
     */
    getReservationStats() {
        const stats = {
            totalReservations: 0,
            totalReservedQuantity: 0,
            productsWithReservations: new Set()
        };
        for (const reservation of this.reservations.values()) {
            if (reservation.expiresAt > new Date()) {
                stats.totalReservations++;
                stats.totalReservedQuantity += reservation.quantity;
                stats.productsWithReservations.add(reservation.productId);
            }
        }
        return stats;
    }
}
// Create singleton instance
const stockService = new StockService();
// Clean up expired reservations every minute
setInterval(() => {
    stockService.cleanupExpiredReservations();
}, 60000);
exports.default = stockService;
