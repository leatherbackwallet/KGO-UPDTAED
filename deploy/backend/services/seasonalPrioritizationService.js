"use strict";
/**
 * Seasonal Prioritization Service
 * Handles product prioritization based on occasion date ranges and current date
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.seasonalPrioritizationService = void 0;
const occasions_model_1 = require("../models/occasions.model");
const products_model_1 = require("../models/products.model");
class SeasonalPrioritizationService {
    /**
     * Calculate occasion boost for a product based on current date
     */
    calculateOccasionBoost(product, currentDate = new Date()) {
        if (!product.occasions || product.occasions.length === 0) {
            return 1.0;
        }
        let totalBoost = 1.0;
        const activeOccasions = [];
        for (const occasionId of product.occasions) {
            // This would need to be populated in the actual implementation
            // For now, we'll assume occasions are populated
            const occasion = product.populatedOccasions?.find((occ) => occ._id.toString() === occasionId.toString());
            if (occasion) {
                const relevance = this.calculateDateRelevance(occasion, currentDate);
                if (relevance > 0) {
                    const boost = 1 + (relevance * occasion.priority.boostMultiplier);
                    totalBoost *= boost;
                    activeOccasions.push(occasion.name);
                }
            }
        }
        // Cap the boost at 3.0x
        return Math.min(totalBoost, 3.0);
    }
    /**
     * Calculate how relevant an occasion is to the current date
     * Returns a value between 0 and 1
     */
    calculateDateRelevance(occasion, currentDate) {
        const { startMonth, startDay, endMonth, endDay, isRecurring, specificYear } = occasion.dateRange;
        // Check if it's a one-time event and we're not in the right year
        if (!isRecurring && specificYear && currentDate.getFullYear() !== specificYear) {
            return 0;
        }
        const currentMonth = currentDate.getMonth() + 1;
        const currentDay = currentDate.getDate();
        // Create dates for comparison
        const year = specificYear || currentDate.getFullYear();
        const startDate = new Date(year, startMonth - 1, startDay);
        const endDate = new Date(year, endMonth - 1, endDay);
        // Handle year rollover (e.g., Dec 25 to Jan 5)
        if (endDate < startDate) {
            endDate.setFullYear(year + 1);
        }
        const current = new Date(year, currentMonth - 1, currentDay);
        // Check if current date is within the occasion range
        if (current < startDate || current > endDate) {
            return 0;
        }
        // Calculate relevance based on proximity to start/end dates
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const daysFromStart = Math.ceil((current.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        // Peak relevance in the middle of the occasion period
        const midPoint = totalDays / 2;
        const distanceFromMid = Math.abs(daysFromStart - midPoint);
        const relevance = Math.max(0, 1 - (distanceFromMid / midPoint));
        return relevance;
    }
    /**
     * Get seasonal recommendations with prioritized products
     */
    async getSeasonalRecommendations(limit = 10, currentDate = new Date()) {
        try {
            // Get currently active occasions
            const activeOccasions = await this.getActiveOccasions(currentDate);
            // Get upcoming occasions (next 30 days)
            const upcomingOccasions = await this.getUpcomingOccasions(currentDate, 30);
            // Get all products with occasions
            const products = await products_model_1.Product.find({
                occasions: { $exists: true, $ne: [] },
                isDeleted: false,
                isActive: true
            }).populate('occasions');
            // Prioritize products
            const prioritizedProducts = products
                .map(product => {
                const occasionBoost = this.calculateOccasionBoost(product, currentDate);
                const activeOccasionNames = this.getActiveOccasionNames(product, activeOccasions);
                const seasonalScore = this.calculateSeasonalScore(product, activeOccasions, currentDate);
                return {
                    product,
                    occasionBoost,
                    activeOccasions: activeOccasionNames,
                    seasonalScore,
                    reason: this.generateReason(activeOccasionNames, occasionBoost)
                };
            })
                .filter(p => p.occasionBoost > 1.0) // Only include products with occasion boost
                .sort((a, b) => (b.occasionBoost * b.seasonalScore) - (a.occasionBoost * a.seasonalScore))
                .slice(0, limit);
            // Determine seasonal context
            const isPeakSeason = activeOccasions.some(occ => occ.priority.level === 'peak');
            const nextOccasion = upcomingOccasions[0];
            return {
                products: prioritizedProducts,
                activeOccasions,
                upcomingOccasions,
                seasonalContext: {
                    currentMonth: currentDate.getMonth() + 1,
                    currentDay: currentDate.getDate(),
                    isPeakSeason,
                    nextOccasion
                }
            };
        }
        catch (error) {
            console.error('Error getting seasonal recommendations:', error);
            throw error;
        }
    }
    /**
     * Get currently active occasions
     */
    async getActiveOccasions(currentDate) {
        const occasions = await occasions_model_1.Occasion.find({
            isActive: true,
            isDeleted: false
        });
        return occasions.filter(occasion => this.isOccasionActive(occasion, currentDate));
    }
    /**
     * Get upcoming occasions within specified days
     */
    async getUpcomingOccasions(currentDate, days) {
        const occasions = await occasions_model_1.Occasion.find({
            isActive: true,
            isDeleted: false
        });
        const futureDate = new Date(currentDate.getTime() + days * 24 * 60 * 60 * 1000);
        return occasions.filter(occasion => {
            const { startMonth, startDay, isRecurring, specificYear } = occasion.dateRange;
            const year = specificYear || currentDate.getFullYear();
            const occasionStartDate = new Date(year, startMonth - 1, startDay);
            // Handle year rollover for recurring events
            if (isRecurring && occasionStartDate < currentDate) {
                occasionStartDate.setFullYear(year + 1);
            }
            return occasionStartDate >= currentDate && occasionStartDate <= futureDate;
        }).sort((a, b) => {
            const aStart = new Date(2024, a.dateRange.startMonth - 1, a.dateRange.startDay);
            const bStart = new Date(2024, b.dateRange.startMonth - 1, b.dateRange.startDay);
            return aStart.getTime() - bStart.getTime();
        });
    }
    /**
     * Check if an occasion is currently active
     */
    isOccasionActive(occasion, currentDate) {
        const { startMonth, startDay, endMonth, endDay, isRecurring, specificYear } = occasion.dateRange;
        if (!isRecurring && specificYear && currentDate.getFullYear() !== specificYear) {
            return false;
        }
        const currentMonth = currentDate.getMonth() + 1;
        const currentDay = currentDate.getDate();
        const year = specificYear || currentDate.getFullYear();
        const startDate = new Date(year, startMonth - 1, startDay);
        const endDate = new Date(year, endMonth - 1, endDay);
        if (endDate < startDate) {
            endDate.setFullYear(year + 1);
        }
        const current = new Date(year, currentMonth - 1, currentDay);
        return current >= startDate && current <= endDate;
    }
    /**
     * Get active occasion names for a product
     */
    getActiveOccasionNames(product, activeOccasions) {
        if (!product.occasions)
            return [];
        return product.occasions
            .filter((occasionId) => activeOccasions.some(activeOcc => activeOcc._id.toString() === occasionId.toString()))
            .map((occasionId) => {
            const occasion = activeOccasions.find(activeOcc => activeOcc._id.toString() === occasionId.toString());
            return occasion?.name || '';
        })
            .filter(Boolean);
    }
    /**
     * Calculate seasonal score based on occasion types and current context
     */
    calculateSeasonalScore(product, activeOccasions, currentDate) {
        let score = 1.0;
        // Boost for festival occasions during their active period
        const festivalOccasions = activeOccasions.filter(occ => occ.seasonalFlags.isFestival);
        if (festivalOccasions.length > 0) {
            score += 0.5;
        }
        // Boost for peak priority occasions
        const peakOccasions = activeOccasions.filter(occ => occ.priority.level === 'peak');
        if (peakOccasions.length > 0) {
            score += 0.3;
        }
        // Boost for products with multiple active occasions
        const productActiveOccasions = this.getActiveOccasionNames(product, activeOccasions);
        if (productActiveOccasions.length > 1) {
            score += 0.2 * (productActiveOccasions.length - 1);
        }
        return Math.min(score, 2.0); // Cap at 2.0
    }
    /**
     * Generate human-readable reason for recommendation
     */
    generateReason(activeOccasions, boost) {
        if (activeOccasions.length === 0) {
            return 'General recommendation';
        }
        if (activeOccasions.length === 1) {
            return `Perfect for ${activeOccasions[0]} (${boost.toFixed(1)}x boost)`;
        }
        return `Great for ${activeOccasions.join(', ')} (${boost.toFixed(1)}x boost)`;
    }
    /**
     * Get occasion insights for analytics
     */
    async getOccasionInsights() {
        const allOccasions = await occasions_model_1.Occasion.find({ isDeleted: false });
        const activeOccasions = await this.getActiveOccasions(new Date());
        const upcomingOccasions = await this.getUpcomingOccasions(new Date(), 30);
        const occasionDistribution = allOccasions.reduce((acc, occasion) => {
            const type = occasion.seasonalFlags.isFestival ? 'Festival' :
                occasion.seasonalFlags.isHoliday ? 'Holiday' :
                    occasion.seasonalFlags.isPersonal ? 'Personal' :
                        occasion.seasonalFlags.isSeasonal ? 'Seasonal' : 'Other';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});
        return {
            totalOccasions: allOccasions.length,
            activeOccasions: activeOccasions.length,
            upcomingOccasions: upcomingOccasions.length,
            peakSeasonOccasions: activeOccasions.filter(occ => occ.priority.level === 'peak').length,
            occasionDistribution
        };
    }
}
exports.seasonalPrioritizationService = new SeasonalPrioritizationService();
