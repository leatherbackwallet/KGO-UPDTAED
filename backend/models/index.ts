/**
 * Models Index - Central export for all database models
 * Version 3.0 - Enterprise-grade schema with promotions, shipments, and attributes
 */

// Core models
export { User, IUser } from './users.model';
export { Role, IRole } from './roles.model';

// Product and catalog models
export { Product, IProduct } from './products.model';
export { Category, ICategory } from './categories.model';
export { Attribute, IAttribute } from './attributes.model';
export { ProductAttribute, IProductAttribute } from './productAttributes.model';

// Order and fulfillment models
export { Order, IOrder } from './orders.model';
export { Shipment, IShipment } from './shipments.model';

// Promotions and marketing
export { Promotion, IPromotion } from './promotions.model';

// Vendor and marketplace models
export { Vendor, IVendor } from './vendors.model';
export { VendorProduct, IVendorProduct } from './vendorProducts.model';

// Logistics models
export { Hub, IHub } from './hubs.model';
export { DeliveryRun, IDeliveryRun } from './deliveryRuns.model';

// Customer service models
export { Return, IReturn } from './returns.model';
export { SupportTicket, ISupportTicket } from './supportTickets.model';

// Financial models
export { Transaction, ITransaction } from './transactions.model';
export { Payout, IPayout } from './payouts.model';
export { Ledger, ILedger } from './ledger.model';

// User engagement models
export { Review, IReview } from './reviews.model';
export { Wishlist, IWishlist } from './wishlists.model';
export { Notification, INotification } from './notifications.model';

// System models
export { ActivityLog, IActivityLog } from './activityLogs.model';
export { DailyStats, IDailyStats } from './dailyStats.model';
export { Page, IPage } from './pages.model';
export { VendorDocument, IVendorDocument } from './vendorDocuments.model';

// Strategic Enhancement Models
export { UserPreferences, IUserPreferences } from './userPreferences.model';
export { Subscription, ISubscription, SubscriptionTier, SubscriptionStatus } from './subscriptions.model';
export { Analytics, IAnalytics } from './analytics.model';
export { Content, IContent, ContentType, ContentStatus } from './content.model'; 