"use strict";
/**
 * Models Index - Central export for all database models
 * Version 3.0 - Enterprise-grade schema with promotions, shipments, and attributes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentStatus = exports.ContentType = exports.Content = exports.Analytics = exports.SubscriptionStatus = exports.SubscriptionTier = exports.Subscription = exports.UserPreferences = exports.VendorDocument = exports.Page = exports.DailyStats = exports.ActivityLog = exports.Notification = exports.Wishlist = exports.Review = exports.Ledger = exports.Payout = exports.Transaction = exports.SupportTicket = exports.Return = exports.DeliveryRun = exports.Hub = exports.VendorProduct = exports.Vendor = exports.Promotion = exports.Shipment = exports.Order = exports.ProductAttribute = exports.Attribute = exports.Category = exports.Product = exports.Role = exports.User = void 0;
// Core models
var users_model_1 = require("./users.model");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return users_model_1.User; } });
var roles_model_1 = require("./roles.model");
Object.defineProperty(exports, "Role", { enumerable: true, get: function () { return roles_model_1.Role; } });
// Product and catalog models
var products_model_1 = require("./products.model");
Object.defineProperty(exports, "Product", { enumerable: true, get: function () { return products_model_1.Product; } });
var categories_model_1 = require("./categories.model");
Object.defineProperty(exports, "Category", { enumerable: true, get: function () { return categories_model_1.Category; } });
var attributes_model_1 = require("./attributes.model");
Object.defineProperty(exports, "Attribute", { enumerable: true, get: function () { return attributes_model_1.Attribute; } });
var productAttributes_model_1 = require("./productAttributes.model");
Object.defineProperty(exports, "ProductAttribute", { enumerable: true, get: function () { return productAttributes_model_1.ProductAttribute; } });
// Order and fulfillment models
var orders_model_1 = require("./orders.model");
Object.defineProperty(exports, "Order", { enumerable: true, get: function () { return orders_model_1.Order; } });
var shipments_model_1 = require("./shipments.model");
Object.defineProperty(exports, "Shipment", { enumerable: true, get: function () { return shipments_model_1.Shipment; } });
// Promotions and marketing
var promotions_model_1 = require("./promotions.model");
Object.defineProperty(exports, "Promotion", { enumerable: true, get: function () { return promotions_model_1.Promotion; } });
// Vendor and marketplace models
var vendors_model_1 = require("./vendors.model");
Object.defineProperty(exports, "Vendor", { enumerable: true, get: function () { return vendors_model_1.Vendor; } });
var vendorProducts_model_1 = require("./vendorProducts.model");
Object.defineProperty(exports, "VendorProduct", { enumerable: true, get: function () { return vendorProducts_model_1.VendorProduct; } });
// Logistics models
var hubs_model_1 = require("./hubs.model");
Object.defineProperty(exports, "Hub", { enumerable: true, get: function () { return hubs_model_1.Hub; } });
var deliveryRuns_model_1 = require("./deliveryRuns.model");
Object.defineProperty(exports, "DeliveryRun", { enumerable: true, get: function () { return deliveryRuns_model_1.DeliveryRun; } });
// Customer service models
var returns_model_1 = require("./returns.model");
Object.defineProperty(exports, "Return", { enumerable: true, get: function () { return returns_model_1.Return; } });
var supportTickets_model_1 = require("./supportTickets.model");
Object.defineProperty(exports, "SupportTicket", { enumerable: true, get: function () { return supportTickets_model_1.SupportTicket; } });
// Financial models
var transactions_model_1 = require("./transactions.model");
Object.defineProperty(exports, "Transaction", { enumerable: true, get: function () { return transactions_model_1.Transaction; } });
var payouts_model_1 = require("./payouts.model");
Object.defineProperty(exports, "Payout", { enumerable: true, get: function () { return payouts_model_1.Payout; } });
var ledger_model_1 = require("./ledger.model");
Object.defineProperty(exports, "Ledger", { enumerable: true, get: function () { return ledger_model_1.Ledger; } });
// User engagement models
var reviews_model_1 = require("./reviews.model");
Object.defineProperty(exports, "Review", { enumerable: true, get: function () { return reviews_model_1.Review; } });
var wishlists_model_1 = require("./wishlists.model");
Object.defineProperty(exports, "Wishlist", { enumerable: true, get: function () { return wishlists_model_1.Wishlist; } });
var notifications_model_1 = require("./notifications.model");
Object.defineProperty(exports, "Notification", { enumerable: true, get: function () { return notifications_model_1.Notification; } });
// System models
var activityLogs_model_1 = require("./activityLogs.model");
Object.defineProperty(exports, "ActivityLog", { enumerable: true, get: function () { return activityLogs_model_1.ActivityLog; } });
var dailyStats_model_1 = require("./dailyStats.model");
Object.defineProperty(exports, "DailyStats", { enumerable: true, get: function () { return dailyStats_model_1.DailyStats; } });
var pages_model_1 = require("./pages.model");
Object.defineProperty(exports, "Page", { enumerable: true, get: function () { return pages_model_1.Page; } });
var vendorDocuments_model_1 = require("./vendorDocuments.model");
Object.defineProperty(exports, "VendorDocument", { enumerable: true, get: function () { return vendorDocuments_model_1.VendorDocument; } });
// Strategic Enhancement Models
var userPreferences_model_1 = require("./userPreferences.model");
Object.defineProperty(exports, "UserPreferences", { enumerable: true, get: function () { return userPreferences_model_1.UserPreferences; } });
var subscriptions_model_1 = require("./subscriptions.model");
Object.defineProperty(exports, "Subscription", { enumerable: true, get: function () { return subscriptions_model_1.Subscription; } });
Object.defineProperty(exports, "SubscriptionTier", { enumerable: true, get: function () { return subscriptions_model_1.SubscriptionTier; } });
Object.defineProperty(exports, "SubscriptionStatus", { enumerable: true, get: function () { return subscriptions_model_1.SubscriptionStatus; } });
var analytics_model_1 = require("./analytics.model");
Object.defineProperty(exports, "Analytics", { enumerable: true, get: function () { return analytics_model_1.Analytics; } });
var content_model_1 = require("./content.model");
Object.defineProperty(exports, "Content", { enumerable: true, get: function () { return content_model_1.Content; } });
Object.defineProperty(exports, "ContentType", { enumerable: true, get: function () { return content_model_1.ContentType; } });
Object.defineProperty(exports, "ContentStatus", { enumerable: true, get: function () { return content_model_1.ContentStatus; } });
