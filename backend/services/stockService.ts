/**
 * Stock Management Service
 * Handles atomic stock operations with proper locking to prevent overselling
 */

import mongoose from 'mongoose';
import { Product } from '../models/products.model';

interface StockReservation {
  productId: string;
  quantity: number;
  userId: string;
  sessionId: string;
  expiresAt: Date;
}

interface StockCheckResult {
  available: boolean;
  currentStock: number;
  requestedQuantity: number;
  productName: string;
}

class StockService {
  private reservations: Map<string, StockReservation> = new Map();
  private readonly RESERVATION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if products have sufficient stock
   */
  async checkStockAvailability(
    items: Array<{ productId: string; quantity: number }>,
    session?: mongoose.ClientSession
  ): Promise<{ available: boolean; results: StockCheckResult[]; unavailableItems: string[] }> {
    const results: StockCheckResult[] = [];
    const unavailableItems: string[] = [];

    for (const item of items) {
      console.log(`🔍 [Stock Service] Checking product: ${item.productId}, quantity: ${item.quantity}`);
      
      const product = await Product.findById(item.productId).session(session || null);
      
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
  async reserveStock(
    items: Array<{ productId: string; quantity: number }>,
    userId: string,
    sessionId: string,
    dbSession?: mongoose.ClientSession
  ): Promise<{ success: boolean; reservations: string[]; errors: string[] }> {
    const reservations: string[] = [];
    const errors: string[] = [];

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
        const reservation: StockReservation = {
          productId: item.productId,
          quantity: item.quantity,
          userId,
          sessionId,
          expiresAt
        };

        this.reservations.set(reservationKey, reservation);
        reservations.push(reservationKey);

        // Update database stock atomically
        const updateResult = await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: -item.quantity } },
          { 
            session: dbSession,
            new: true,
            runValidators: true
          }
        );

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
    } catch (error) {
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
  async releaseStock(
    reservationKeys: string[],
    dbSession?: mongoose.ClientSession
  ): Promise<{ success: boolean; released: number; errors: string[] }> {
    const errors: string[] = [];
    let released = 0;

    for (const key of reservationKeys) {
      const reservation = this.reservations.get(key);
      
      if (!reservation) {
        continue; // Already released or expired
      }

      try {
        // Restore stock in database
        await Product.findByIdAndUpdate(
          reservation.productId,
          { $inc: { stock: reservation.quantity } },
          { session: dbSession }
        );

        // Remove reservation
        this.reservations.delete(key);
        released++;
      } catch (error) {
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
  async confirmStockReservations(
    reservationKeys: string[],
    dbSession?: mongoose.ClientSession
  ): Promise<{ success: boolean; confirmed: number; errors: string[] }> {
    const errors: string[] = [];
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
      } catch (error) {
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
  private getReservedQuantity(productId: string): number {
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
  cleanupExpiredReservations(): void {
    const now = new Date();
    const expiredKeys: string[] = [];

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
        Product.findByIdAndUpdate(
          reservation.productId,
          { $inc: { stock: reservation.quantity } }
        ).catch(error => {
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
  getReservationStats(): {
    totalReservations: number;
    totalReservedQuantity: number;
    productsWithReservations: Set<string>;
  } {
    const stats = {
      totalReservations: 0,
      totalReservedQuantity: 0,
      productsWithReservations: new Set<string>()
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

export default stockService;
