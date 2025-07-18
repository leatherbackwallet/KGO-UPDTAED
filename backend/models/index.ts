/**
 * Models Index - Central export for all Mongoose models
 * Provides easy access to all database models and their TypeScript interfaces
 */

// Core Collections
export { User, IUser, UserRole } from './users.model';
export { Category, ICategory } from './categories.model';
export { Product, IProduct, IPersonalizationOption } from './products.model';

// Vendor & Marketplace Collections
export { Vendor, IVendor, VendorStatus, IVendorAddress } from './vendors.model';
export { VendorProduct, IVendorProduct } from './vendorProducts.model';
export { VendorDocument, IVendorDocument, DocumentType, DocumentStatus } from './vendorDocuments.model';

// Order & Transaction Collections
export { Order, IOrder, OrderStatus, ItemStatus, IShippingDetails, IOrderItem, ITaxDetails, IPaymentDetails } from './orders.model';
export { Review, IReview, ReviewType, IReply } from './reviews.model';

// Financial & Marketing Collections
export { Coupon, ICoupon, CouponType } from './coupons.model';
export { Transaction, ITransaction, TransactionType, TransactionStatus } from './transactions.model';
export { Payout, IPayout, PayoutStatus } from './payouts.model';
export { Ledger, ILedger, LedgerType, LedgerCategory, IRelatedDocument } from './ledger.model';

// User Engagement & Support Collections
export { Wishlist, IWishlist } from './wishlists.model';
export { Notification, INotification } from './notifications.model';
export { SupportTicket, ISupportTicket, TicketStatus, IConversationMessage } from './supportTickets.model';

// Admin & Analytics Collections
export { Page, IPage, PageStatus } from './pages.model';
export { ActivityLog, IActivityLog, ITarget } from './activityLogs.model';
export { DailyStats, IDailyStats, ITopSellingProduct, ITopPerformingVendor } from './dailyStats.model'; 