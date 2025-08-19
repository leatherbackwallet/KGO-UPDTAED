"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.personalizationService = void 0;
const userPreferences_model_1 = require("../models/userPreferences.model");
const products_model_1 = require("../models/products.model");
const orders_model_1 = require("../models/orders.model");
const users_model_1 = require("../models/users.model");
const subscriptions_model_1 = require("../models/subscriptions.model");
class PersonalizationService {
    async getRecommendations(userId, limit = 10) {
        try {
            const userPrefs = await userPreferences_model_1.UserPreferences.findOne({ userId });
            const user = await users_model_1.User.findById(userId);
            const subscription = await subscriptions_model_1.Subscription.findOne({ userId });
            if (!userPrefs) {
                return this.getDefaultRecommendations(limit);
            }
            const recommendations = [];
            const browsingRecs = await this.getBrowsingBasedRecommendations(userPrefs, limit);
            recommendations.push(...browsingRecs);
            const purchaseRecs = await this.getPurchaseBasedRecommendations(userPrefs, limit);
            recommendations.push(...purchaseRecs);
            const culturalRecs = await this.getCulturalRecommendations(userPrefs, user, limit);
            recommendations.push(...culturalRecs);
            const seasonalRecs = await this.getSeasonalRecommendations(userPrefs, limit);
            recommendations.push(...seasonalRecs);
            const collaborativeRecs = await this.getCollaborativeRecommendations(userId, limit);
            recommendations.push(...collaborativeRecs);
            if (subscription && subscription.tier !== subscriptions_model_1.SubscriptionTier.FREE) {
                const premiumRecs = await this.getPremiumRecommendations(subscription, limit);
                recommendations.push(...premiumRecs);
            }
            const uniqueRecs = this.deduplicateRecommendations(recommendations);
            return uniqueRecs.slice(0, limit);
        }
        catch (error) {
            console.error('Error getting recommendations:', error);
            return this.getDefaultRecommendations(limit);
        }
    }
    async getBrowsingBasedRecommendations(userPrefs, limit) {
        const recommendations = [];
        const recentCategories = userPrefs.browsingHistory.categories.slice(-5);
        for (const category of recentCategories) {
            const products = await products_model_1.Product.find({
                categories: { $in: [category] },
                isDeleted: false,
                stock: { $gt: 0 }
            })
                .populate('categories')
                .limit(limit)
                .sort({ isFeatured: -1, createdAt: -1 });
            if (products.length > 0) {
                recommendations.push({
                    products,
                    score: 0.8,
                    reason: `Based on your recent interest in ${category}`,
                    category: 'browsing'
                });
            }
        }
        return recommendations;
    }
    async getPurchaseBasedRecommendations(userPrefs, limit) {
        const recommendations = [];
        const purchasedProductIds = userPrefs.purchaseHistory.productIds;
        if (purchasedProductIds.length > 0) {
            const purchasedProducts = await products_model_1.Product.find({
                _id: { $in: purchasedProductIds.slice(-10) }
            }).populate('categories');
            for (const purchasedProduct of purchasedProducts) {
                const similarProducts = await products_model_1.Product.find({
                    categories: { $in: purchasedProduct.categories },
                    _id: { $nin: purchasedProductIds },
                    isDeleted: false,
                    stock: { $gt: 0 }
                })
                    .populate('categories')
                    .limit(3)
                    .sort({ isFeatured: -1 });
                if (similarProducts.length > 0) {
                    recommendations.push({
                        products: similarProducts,
                        score: 0.9,
                        reason: `Similar to ${purchasedProduct.name.en}`,
                        category: 'purchase'
                    });
                }
            }
        }
        return recommendations;
    }
    async getCulturalRecommendations(userPrefs, user, limit) {
        const recommendations = [];
        const currentMonth = new Date().getMonth() + 1;
        const festivals = this.getFestivalsByMonth(currentMonth);
        for (const festival of festivals) {
            const festivalProducts = await products_model_1.Product.find({
                occasions: festival,
                isDeleted: false,
                stock: { $gt: 0 }
            })
                .populate('categories')
                .limit(limit)
                .sort({ isFeatured: -1 });
            if (festivalProducts.length > 0) {
                recommendations.push({
                    products: festivalProducts,
                    score: 0.85,
                    reason: `Perfect for ${festival} celebrations`,
                    category: 'cultural'
                });
            }
        }
        if (userPrefs.culturalPreferences.languagePreference === 'ml') {
            const traditionalProducts = await products_model_1.Product.find({
                occasions: { $in: ['TRADITIONAL', 'ONAM', 'DIWALI'] },
                isDeleted: false,
                stock: { $gt: 0 }
            })
                .populate('categories')
                .limit(limit)
                .sort({ isFeatured: -1 });
            if (traditionalProducts.length > 0) {
                recommendations.push({
                    products: traditionalProducts,
                    score: 0.8,
                    reason: 'Traditional Kerala products',
                    category: 'cultural'
                });
            }
        }
        return recommendations;
    }
    async getSeasonalRecommendations(userPrefs, limit) {
        const recommendations = [];
        const currentMonth = new Date().getMonth() + 1;
        const seasonalPreferences = userPrefs.aiPreferences.seasonalPreferences
            .find(pref => pref.month === currentMonth);
        if (seasonalPreferences) {
            for (const preference of seasonalPreferences.preferences) {
                const seasonalProducts = await products_model_1.Product.find({
                    occasions: preference,
                    isDeleted: false,
                    stock: { $gt: 0 }
                })
                    .populate('categories')
                    .limit(limit)
                    .sort({ isFeatured: -1 });
                if (seasonalProducts.length > 0) {
                    recommendations.push({
                        products: seasonalProducts,
                        score: 0.75,
                        reason: `Seasonal favorites for ${preference}`,
                        category: 'seasonal'
                    });
                }
            }
        }
        return recommendations;
    }
    async getCollaborativeRecommendations(userId, limit) {
        const recommendations = [];
        try {
            const userPrefs = await userPreferences_model_1.UserPreferences.findOne({ userId });
            if (!userPrefs)
                return recommendations;
            const similarUsers = await userPreferences_model_1.UserPreferences.find({
                'purchaseHistory.productIds': {
                    $in: userPrefs.purchaseHistory.productIds
                },
                userId: { $ne: userId }
            }).limit(5);
            for (const similarUser of similarUsers) {
                const recommendedProductIds = similarUser.purchaseHistory.productIds
                    .filter(id => !userPrefs.purchaseHistory.productIds.includes(id))
                    .slice(0, 3);
                if (recommendedProductIds.length > 0) {
                    const products = await products_model_1.Product.find({
                        _id: { $in: recommendedProductIds },
                        isDeleted: false,
                        stock: { $gt: 0 }
                    })
                        .populate('categories');
                    if (products.length > 0) {
                        recommendations.push({
                            products,
                            score: 0.7,
                            reason: 'Popular among similar customers',
                            category: 'collaborative'
                        });
                    }
                }
            }
        }
        catch (error) {
            console.error('Error in collaborative filtering:', error);
        }
        return recommendations;
    }
    async getPremiumRecommendations(subscription, limit) {
        const recommendations = [];
        const premiumProducts = await products_model_1.Product.find({
            isFeatured: true,
            isDeleted: false,
            stock: { $gt: 0 }
        })
            .populate('categories')
            .limit(limit)
            .sort({ createdAt: -1 });
        if (premiumProducts.length > 0) {
            recommendations.push({
                products: premiumProducts,
                score: 0.9,
                reason: 'Exclusive premium products',
                category: 'browsing'
            });
        }
        return recommendations;
    }
    async getDefaultRecommendations(limit) {
        const featuredProducts = await products_model_1.Product.find({
            isFeatured: true,
            isDeleted: false,
            stock: { $gt: 0 }
        })
            .populate('categories')
            .limit(limit)
            .sort({ createdAt: -1 });
        return [{
                products: featuredProducts,
                score: 0.6,
                reason: 'Popular products',
                category: 'browsing'
            }];
    }
    async updateUserPreferences(userId, action, data) {
        try {
            let userPrefs = await userPreferences_model_1.UserPreferences.findOne({ userId });
            if (!userPrefs) {
                userPrefs = new userPreferences_model_1.UserPreferences({ userId });
            }
            switch (action) {
                case 'view_product':
                    this.updateBrowsingHistory(userPrefs, data);
                    break;
                case 'purchase':
                    this.updatePurchaseHistory(userPrefs, data);
                    break;
                case 'search':
                    this.updateSearchHistory(userPrefs, data);
                    break;
                case 'add_to_cart':
                    this.updateCartBehavior(userPrefs, data);
                    break;
            }
            await userPrefs.save();
        }
        catch (error) {
            console.error('Error updating user preferences:', error);
        }
    }
    async getUserInsights(userId) {
        try {
            const userPrefs = await userPreferences_model_1.UserPreferences.findOne({ userId });
            const orders = await orders_model_1.Order.find({ userId }).sort({ createdAt: -1 });
            if (!userPrefs) {
                return this.getDefaultInsights();
            }
            const totalSpent = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
            const averageOrderValue = orders.length > 0 ? totalSpent / orders.length : 0;
            const firstOrder = orders[orders.length - 1];
            const lastOrder = orders[0];
            const monthsActive = firstOrder && lastOrder
                ? (lastOrder.createdAt.getTime() - firstOrder.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
                : 1;
            const orderFrequency = monthsActive > 0 ? orders.length / monthsActive : 0;
            const lastOrderDate = lastOrder?.createdAt || new Date(0);
            const daysSinceLastOrder = (Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24);
            let churnRisk = 'low';
            if (daysSinceLastOrder > 90)
                churnRisk = 'high';
            else if (daysSinceLastOrder > 30)
                churnRisk = 'medium';
            return {
                preferences: {
                    categories: userPrefs.aiPreferences.preferredCategories,
                    priceRange: userPrefs.aiPreferences.preferredPriceRange,
                    occasions: userPrefs.aiPreferences.preferredOccasions,
                    culturalPreferences: userPrefs.culturalPreferences.festivalPreferences
                },
                behavior: {
                    averageOrderValue,
                    orderFrequency,
                    preferredDeliveryTime: 'afternoon',
                    cartAbandonmentRate: userPrefs.engagementMetrics.cartAbandonmentRate
                },
                engagement: {
                    totalVisits: userPrefs.engagementMetrics.totalVisits,
                    averageSessionDuration: userPrefs.engagementMetrics.averageSessionDuration,
                    lastEngagement: userPrefs.engagementMetrics.lastEngagement,
                    churnRisk
                }
            };
        }
        catch (error) {
            console.error('Error getting user insights:', error);
            return this.getDefaultInsights();
        }
    }
    getFestivalsByMonth(month) {
        const festivalMap = {
            1: ['NEW YEAR', 'PONGAL'],
            2: ['VALENTINES DAY'],
            3: ['HOLI'],
            4: ['EASTER'],
            5: ['MOTHERS DAY'],
            6: ['FATHERS DAY'],
            7: ['INDEPENDENCE DAY'],
            8: ['ONAM', 'RAKSHA BANDHAN'],
            9: ['GANESH CHATURTHI'],
            10: ['DIWALI', 'DUSSEHRA'],
            11: ['GURU NANAK JAYANTI'],
            12: ['CHRISTMAS', 'NEW YEAR']
        };
        return festivalMap[month] || [];
    }
    updateBrowsingHistory(userPrefs, data) {
        if (data.productId) {
            userPrefs.browsingHistory.productIds.push(data.productId);
            userPrefs.browsingHistory.productIds = userPrefs.browsingHistory.productIds.slice(-50);
        }
        if (data.category) {
            userPrefs.browsingHistory.categories.push(data.category);
            userPrefs.browsingHistory.categories = userPrefs.browsingHistory.categories.slice(-20);
        }
        userPrefs.browsingHistory.lastVisited = new Date();
        userPrefs.engagementMetrics.totalVisits += 1;
        userPrefs.engagementMetrics.lastEngagement = new Date();
    }
    updatePurchaseHistory(userPrefs, data) {
        if (data.productIds) {
            userPrefs.purchaseHistory.productIds.push(...data.productIds);
            userPrefs.purchaseHistory.productIds = userPrefs.purchaseHistory.productIds.slice(-100);
        }
        if (data.categories) {
            userPrefs.purchaseHistory.categories.push(...data.categories);
            userPrefs.purchaseHistory.categories = userPrefs.purchaseHistory.categories.slice(-50);
        }
        if (data.amount) {
            userPrefs.purchaseHistory.averageOrderValue =
                (userPrefs.purchaseHistory.averageOrderValue + data.amount) / 2;
        }
        userPrefs.engagementMetrics.totalVisits += 1;
        userPrefs.engagementMetrics.lastEngagement = new Date();
    }
    updateSearchHistory(userPrefs, data) {
        if (data.searchTerm) {
            userPrefs.browsingHistory.searchTerms.push(data.searchTerm);
            userPrefs.browsingHistory.searchTerms = userPrefs.browsingHistory.searchTerms.slice(-30);
        }
    }
    updateCartBehavior(userPrefs, data) {
        if (data.action === 'add') {
        }
        else if (data.action === 'remove') {
            userPrefs.engagementMetrics.cartAbandonmentRate =
                (userPrefs.engagementMetrics.cartAbandonmentRate + 0.1) / 2;
        }
    }
    deduplicateRecommendations(recommendations) {
        const seenProducts = new Set();
        const uniqueRecs = [];
        for (const rec of recommendations) {
            const uniqueProducts = rec.products.filter(product => {
                const productId = product._id.toString();
                if (seenProducts.has(productId)) {
                    return false;
                }
                seenProducts.add(productId);
                return true;
            });
            if (uniqueProducts.length > 0) {
                uniqueRecs.push({
                    ...rec,
                    products: uniqueProducts
                });
            }
        }
        return uniqueRecs.sort((a, b) => b.score - a.score);
    }
    getDefaultInsights() {
        return {
            preferences: {
                categories: [],
                priceRange: { min: 0, max: 100 },
                occasions: [],
                culturalPreferences: []
            },
            behavior: {
                averageOrderValue: 0,
                orderFrequency: 0,
                preferredDeliveryTime: 'afternoon',
                cartAbandonmentRate: 0
            },
            engagement: {
                totalVisits: 0,
                averageSessionDuration: 0,
                lastEngagement: new Date(),
                churnRisk: 'low'
            }
        };
    }
}
exports.personalizationService = new PersonalizationService();
//# sourceMappingURL=personalizationService.js.map