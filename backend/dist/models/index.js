"use strict";
/**
 * Models Index - Central export for all database models
 * Optimized version - Essential models only
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityLog = exports.Transaction = exports.Wishlist = exports.Cart = exports.Shipment = exports.Order = exports.ProductAttribute = exports.Attribute = exports.Occasion = exports.Category = exports.Product = exports.Role = exports.User = void 0;
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
var occasions_model_1 = require("./occasions.model");
Object.defineProperty(exports, "Occasion", { enumerable: true, get: function () { return occasions_model_1.Occasion; } });
var attributes_model_1 = require("./attributes.model");
Object.defineProperty(exports, "Attribute", { enumerable: true, get: function () { return attributes_model_1.Attribute; } });
var productAttributes_model_1 = require("./productAttributes.model");
Object.defineProperty(exports, "ProductAttribute", { enumerable: true, get: function () { return productAttributes_model_1.ProductAttribute; } });
// Order and fulfillment models
var orders_model_1 = require("./orders.model");
Object.defineProperty(exports, "Order", { enumerable: true, get: function () { return orders_model_1.Order; } });
var shipments_model_1 = require("./shipments.model");
Object.defineProperty(exports, "Shipment", { enumerable: true, get: function () { return shipments_model_1.Shipment; } });
// Cart and wishlist models
var cart_model_1 = require("./cart.model");
Object.defineProperty(exports, "Cart", { enumerable: true, get: function () { return cart_model_1.Cart; } });
var wishlists_model_1 = require("./wishlists.model");
Object.defineProperty(exports, "Wishlist", { enumerable: true, get: function () { return wishlists_model_1.Wishlist; } });
// Financial models
var transactions_model_1 = require("./transactions.model");
Object.defineProperty(exports, "Transaction", { enumerable: true, get: function () { return transactions_model_1.Transaction; } });
// System models
var activityLogs_model_1 = require("./activityLogs.model");
Object.defineProperty(exports, "ActivityLog", { enumerable: true, get: function () { return activityLogs_model_1.ActivityLog; } });
