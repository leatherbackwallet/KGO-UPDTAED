Please generate the complete Mongoose schema files in TypeScript for the following database structure. Ensure you use best practices:

Generate a TypeScript interface for each model's document.

Use ref for all ObjectId relationships.

Add index: true where specified for performance.

Enable timestamps ({ timestamps: true }) for all schemas.

Use enums for fields with a fixed set of values.

Provide the code for each schema in a separate, well-commented file (e.g., user.model.ts).

Core Collections
1. users.model.ts

firstName: String, required.

lastName: String, required.

email: String, required, unique, index.

password: String, required.

role: String, enum: ['customer', 'vendor', 'admin', 'support_agent'], required.

phone: String.

2. categories.model.ts

name: String, required, unique.

slug: String, required, unique.

parentCategory: ObjectId, ref: 'Category'.

image: String.

3. products.model.ts (Product Templates)

name: String, required, unique.

slug: String, required, unique.

description: String, required.

category: ObjectId, ref: 'Category', required.

defaultImage: String.

tags: Array of String, index.

personalizationOptions: Array of objects ({ type: String, label: String }).

isActive: Boolean, default: true.

Vendor & Marketplace Collections
4. vendors.model.ts

ownerId: ObjectId, ref: 'User', required.

storeName: String, required, unique.

status: String, enum: ['active', 'inactive', 'pending_approval', 'rejected'], required.

address: Embedded object with street, city, state, postalCode.

serviceablePincodes: Array of String, required, index.

averageRating: Number, default: 0.

5. vendorProducts.model.ts (Vendor-Specific Pricing & Tax)

vendorId: ObjectId, ref: 'Vendor', required, index.

productId: ObjectId, ref: 'Product', required, index.

price: Number, required.

hsnCode: String, required (for GST).

taxRate: Number, required (e.g., 5, 12, 18).

isActive: Boolean, default: true.

Instruction: Create a compound index on vendorId and productId.

6. vendorDocuments.model.ts (Vendor Verification)

vendorId: ObjectId, ref: 'Vendor', required.

documentType: String, enum: ['GSTIN', 'FSSAI', 'PAN', 'BANK_ACCOUNT'].

fileUrl: String, required.

status: String, enum: ['pending', 'approved', 'rejected'], required.

rejectionReason: String.

Order & Transaction Collections
7. orders.model.ts (With GST Details)

orderId: String, unique, required, index.

userId: ObjectId, ref: 'User', required.

shippingDetails: Embedded object.

orderItems: Array of embedded objects ({ productId, name, price, quantity, vendorId, itemStatus }).

personalizationData: Map of String to String.

taxDetails: Embedded object ({ taxableAmount: Number, cgst: Number, sgst: Number, igst: Number }), required.

discountAmount: Number.

appliedCouponCode: String.

totalPrice: Number, required.

orderStatus: String, enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'].

paymentDetails: Embedded object ({ paymentId: String, method: String, status: String }).

8. reviews.model.ts (Product & Vendor Reviews)

reviewType: String, enum: ['product', 'vendor'], required.

productId: ObjectId, ref: 'Product'.

vendorId: ObjectId, ref: 'Vendor'.

userId: ObjectId, ref: 'User', required.

orderId: ObjectId, ref: 'Order', required.

rating: Number, required.

comment: String.

reply: Embedded object ({ userId: ObjectId, comment: String, createdAt: Date }).

Financial & Marketing Collections
9. coupons.model.ts

code: String, required, unique.

description: String.

type: String, enum: ['percentage', 'fixed_amount', 'free_shipping'].

value: Number.

minOrderAmount: Number.

validUntil: Date.

isActive: Boolean.

10. transactions.model.ts (Payment Gateway Transactions)

orderId: ObjectId, ref: 'Order'.

userId: ObjectId, ref: 'User'.

amount: Number.

gatewayTransactionId: String.

type: String, enum: ['capture', 'refund'].

status: String, enum: ['success', 'failed'].

11. payouts.model.ts (Vendor Payouts)

vendorId: ObjectId, ref: 'Vendor', required.

amount: Number, required.

periodStartDate: Date.

periodEndDate: Date.

orderIds: Array of ObjectId, ref: 'Order'.

status: String, enum: ['pending', 'completed', 'failed'].

transactionReference: String.

12. ledger.model.ts (The Financial Core)

date: Date, required, index.

type: String, enum: ['income', 'expense'], required, index.

category: String, enum: ['sales_revenue', 'delivery_fee', 'vendor_payout', 'payment_gateway_fee', 'marketing', 'refund', 'salaries', 'other'], required.

description: String.

amount: Number, required.

relatedDocument: { modelName: String, docId: ObjectId }.

recordedBy: ObjectId, ref: 'User'.

User Engagement & Support Collections
13. wishlists.model.ts

userId: ObjectId, ref: 'User', required, unique.

products: Array of ObjectId, ref: 'Product'.

14. notifications.model.ts

recipientId: ObjectId, ref: 'User', required.

title: String, required.

message: String.

link: String.

isRead: Boolean, default: false.

15. supportTickets.model.ts

userId: ObjectId, ref: 'User', required.

orderId: ObjectId, ref: 'Order'.

issue: String, required.

description: String.

status: String, enum: ['open', 'in_progress', 'closed'].

assignedTo: ObjectId, ref: 'User'.

conversation: Array of ({ byUser: ObjectId, message: String, timestamp: Date }).

Admin & Analytics Collections
16. pages.model.ts (Simple CMS)

title: String, required.

slug: String, required, unique.

body: String, required.

status: String, enum: ['published', 'draft'].

17. activityLogs.model.ts (Audit Trail)

actorId: ObjectId, ref: 'User'.

actionType: String, required.

target: { type: String, id: ObjectId }.

details: Object.

18. dailyStats.model.ts (BI Reporting)

date: Date, required, unique.

totalSales: Number.

totalOrders: Number.

newUsers: Number.

topSellingProducts: Array of ({ productId: ObjectId, name: String, unitsSold: Number }).

topPerformingVendors: Array of ({ vendorId: ObjectId, storeName: String, totalRevenue: Number }).