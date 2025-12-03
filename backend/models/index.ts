/**
 * Models Index - Central export for all database models
 * Optimized version - Essential models only
 */

// Core models
export { User, IUser } from './users.model';
export { Role, IRole } from './roles.model';

// Product and catalog models
export { Product, IProduct } from './products.model';
export { Category, ICategory } from './categories.model';
export { Occasion, IOccasion } from './occasions.model';
export { Attribute, IAttribute } from './attributes.model';
export { ProductAttribute, IProductAttribute } from './productAttributes.model';

// Order and fulfillment models
export { Order, IOrder } from './orders.model';
export { Shipment, IShipment } from './shipments.model';

// Cart and wishlist models
export { Cart, ICart } from './cart.model';
export { Wishlist, IWishlist } from './wishlists.model';

// Financial models
export { Transaction, ITransaction } from './transactions.model';

// System models
export { ActivityLog, IActivityLog } from './activityLogs.model'; 