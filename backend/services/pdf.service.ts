/**
 * PDF Generation Service
 * Handles generation of order receipts and invoices as PDF documents
 */

import puppeteer from 'puppeteer';
import { IOrder } from '../models/orders.model';

export interface OrderReceiptData {
  order: IOrder;
  companyInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
  };
}

class PDFService {
  private companyInfo = {
    name: 'OnYourBehlf - Kerala Gifts Online',
    address: 'Kerala, India',
    phone: '+91-XXXXXXXXXX',
    email: 'info@keralgiftsonline.in',
    website: 'https://keralgiftsonline.in'
  };

  /**
   * Generate order receipt as PDF
   */
  async generateOrderReceipt(orderData: OrderReceiptData): Promise<Buffer> {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
      });

      try {
        const page = await browser.newPage();
        
        // Generate HTML content for the receipt
        const htmlContent = this.generateReceiptHTML(orderData);
        
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        // Generate PDF
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: {
            top: '20mm',
            right: '20mm',
            bottom: '20mm',
            left: '20mm'
          }
        });

        return Buffer.from(pdfBuffer);
      } finally {
        await browser.close();
      }
    } catch (error) {
      console.error('Puppeteer PDF generation failed, falling back to HTML receipt:', error);
      // Fallback: return HTML content as a simple text-based receipt
      return this.generateFallbackReceipt(orderData);
    }
  }

  /**
   * Generate HTML content for the receipt
   */
  private generateReceiptHTML(data: OrderReceiptData): string {
    const { order, companyInfo } = data;
    const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const totalAmount = order.totalPrice || 0;
    const taxRate = 0.18; // 18% GST
    const taxAmount = totalAmount * taxRate;
    const subtotal = totalAmount - taxAmount;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Receipt - ${order.orderId}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
          }
          
          .receipt-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          
          .header {
            text-align: center;
            border-bottom: 3px solid #059669;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          
          .company-name {
            font-size: 28px;
            font-weight: bold;
            color: #059669;
            margin-bottom: 10px;
          }
          
          .company-tagline {
            font-size: 14px;
            color: #666;
            margin-bottom: 15px;
          }
          
          .company-details {
            font-size: 12px;
            color: #888;
            line-height: 1.4;
          }
          
          .receipt-title {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 20px;
            text-align: center;
          }
          
          .order-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
          }
          
          .order-details, .shipping-details {
            flex: 1;
          }
          
          .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
            border-bottom: 2px solid #059669;
            padding-bottom: 5px;
          }
          
          .info-row {
            margin-bottom: 8px;
            font-size: 14px;
          }
          
          .info-label {
            font-weight: bold;
            color: #555;
            display: inline-block;
            width: 120px;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            background: #fff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .items-table th {
            background: #059669;
            color: white;
            padding: 15px 10px;
            text-align: left;
            font-weight: bold;
          }
          
          .items-table td {
            padding: 12px 10px;
            border-bottom: 1px solid #eee;
          }
          
          .items-table tr:nth-child(even) {
            background: #f8f9fa;
          }
          
          .product-name {
            font-weight: bold;
            color: #333;
          }
          
          .product-category {
            font-size: 12px;
            color: #666;
            margin-top: 4px;
          }
          
          .text-right {
            text-align: right;
          }
          
          .text-center {
            text-align: center;
          }
          
          .totals-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 14px;
          }
          
          .total-row.final {
            font-size: 18px;
            font-weight: bold;
            color: #059669;
            border-top: 2px solid #059669;
            padding-top: 10px;
            margin-top: 10px;
          }
          
          .payment-info {
            background: #e8f5e8;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          
          .payment-status {
            color: #059669;
            font-weight: bold;
            font-size: 16px;
          }
          
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #eee;
            color: #666;
            font-size: 12px;
          }
          
          .thank-you {
            font-size: 18px;
            color: #059669;
            font-weight: bold;
            margin-bottom: 10px;
          }
          
          .delivery-note {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
          }
          
          .delivery-note h4 {
            color: #856404;
            margin-bottom: 8px;
          }
          
          .delivery-note p {
            color: #856404;
            font-size: 14px;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <!-- Header -->
          <div class="header">
            <div class="company-name">${companyInfo.name}</div>
            <div class="company-tagline">Authentic Kerala Gifts & Souvenirs</div>
            <div class="company-details">
              ${companyInfo.address} | ${companyInfo.phone}<br>
              ${companyInfo.email} | ${companyInfo.website}
            </div>
          </div>

          <!-- Receipt Title -->
          <div class="receipt-title">Order Receipt</div>

          <!-- Order Information -->
          <div class="order-info">
            <div class="order-details">
              <div class="section-title">Order Details</div>
              <div class="info-row">
                <span class="info-label">Order ID:</span>
                <span>${order.orderId}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Order Date:</span>
                <span>${orderDate}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Status:</span>
                <span style="color: #059669; font-weight: bold;">${order.orderStatus?.replace('_', ' ').toUpperCase()}</span>
              </div>
              ${order.razorpayPaymentId ? `
              <div class="info-row">
                <span class="info-label">Payment ID:</span>
                <span>${order.razorpayPaymentId}</span>
              </div>
              ` : ''}
            </div>
            
            <div class="shipping-details">
              <div class="section-title">Delivery Address</div>
              ${order.shippingDetails ? `
                <div class="info-row">
                  <span class="info-label">Name:</span>
                  <span>${order.shippingDetails.recipientName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Phone:</span>
                  <span>${order.shippingDetails.recipientPhone}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Address:</span>
                  <span>
                    ${order.shippingDetails.address.streetName} ${order.shippingDetails.address.houseNumber}<br>
                    ${order.shippingDetails.address.city} - ${order.shippingDetails.address.postalCode}<br>
                    ${order.shippingDetails.address.countryCode}
                  </span>
                </div>
                ${order.shippingDetails.specialInstructions ? `
                <div class="info-row">
                  <span class="info-label">Instructions:</span>
                  <span>${order.shippingDetails.specialInstructions}</span>
                </div>
                ` : ''}
              ` : '<div class="info-row">No shipping details available</div>'}
            </div>
          </div>

          <!-- Order Items -->
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.orderItems?.map(item => `
                <tr>
                  <td>
                    <div class="product-name">${(item.productId as any)?.name?.en || 'Product'}</div>
                    ${(item.productId as any)?.description?.en ? `<div class="product-category">${(item.productId as any).description.en}</div>` : ''}
                  </td>
                  <td>
                    ${(item.productId as any)?.categories?.[0]?.name?.en || 'General'}
                  </td>
                  <td class="text-center">${item.quantity}</td>
                  <td class="text-right">₹${item.price?.toFixed(2) || '0.00'}</td>
                  <td class="text-right">₹${((item.price || 0) * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('') || '<tr><td colspan="5" class="text-center">No items found</td></tr>'}
            </tbody>
          </table>

          <!-- Payment Information -->
          <div class="payment-info">
            <div class="payment-status">✓ Payment Successful</div>
            <div style="margin-top: 8px; font-size: 14px;">
              Payment Method: Razorpay | Status: ${order.paymentStatus || 'Captured'}
              ${order.paymentDate ? ` | Date: ${new Date(order.paymentDate).toLocaleDateString('en-IN')}` : ''}
            </div>
          </div>

          <!-- Totals -->
          <div class="totals-section">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>₹${subtotal.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>GST (18%):</span>
              <span>₹${taxAmount.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Shipping:</span>
              <span>FREE</span>
            </div>
            <div class="total-row final">
              <span>Total Amount:</span>
              <span>₹${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <!-- Delivery Note -->
          <div class="delivery-note">
            <h4>📦 Delivery Information</h4>
            <p>
              Your order will be processed and shipped within 1-2 business days. 
              You will receive tracking information via email once your order is dispatched.
              Expected delivery: 3-7 business days.
            </p>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div class="thank-you">Thank you for your order!</div>
            <p>
              For any queries or support, please contact us at ${companyInfo.email} or ${companyInfo.phone}
            </p>
            <p style="margin-top: 10px;">
              Visit us at ${companyInfo.website} for more authentic Kerala gifts
            </p>
            <p style="margin-top: 15px; font-size: 10px; color: #999;">
              This is a computer-generated receipt. No signature required.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate a simple text-based receipt as fallback when PDF generation fails
   */
  private generateFallbackReceipt(data: OrderReceiptData): Buffer {
    const { order, companyInfo } = data;
    const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const totalAmount = order.totalPrice || 0;
    const taxRate = 0.18; // 18% GST
    const taxAmount = totalAmount * taxRate;
    const subtotal = totalAmount - taxAmount;

    const receiptText = `
${companyInfo.name}
${companyInfo.address}
Phone: ${companyInfo.phone}
Email: ${companyInfo.email}
Website: ${companyInfo.website}

========================================
ORDER RECEIPT
========================================

Order ID: ${order.orderId}
Date: ${orderDate}
Status: ${(order as any).status || 'N/A'}

Customer Details:
${order.shippingDetails?.recipientName || 'N/A'}
${order.shippingDetails?.recipientPhone || 'N/A'}
${order.shippingDetails?.address?.streetName || 'N/A'}
${order.shippingDetails?.address?.city || 'N/A'}, ${(order.shippingDetails?.address as any)?.state || 'N/A'} ${order.shippingDetails?.address?.postalCode || 'N/A'}

Order Items:
${order.orderItems?.map((item: any) => 
  `${item.productId?.name || 'Product'} x ${item.quantity} = ₹${(item.price * item.quantity).toFixed(2)}`
).join('\n') || 'No items'}

========================================
PRICING BREAKDOWN
========================================

Subtotal: ₹${subtotal.toFixed(2)}
GST (18%): ₹${taxAmount.toFixed(2)}
Total: ₹${totalAmount.toFixed(2)}

Payment Method: ${order.paymentMethod || 'N/A'}
Payment Status: ${order.paymentStatus || 'N/A'}

========================================
Thank you for your order!

For any queries or support, please contact us at:
${companyInfo.email} or ${companyInfo.phone}

Visit us at ${companyInfo.website} for more authentic Kerala gifts

This is a computer-generated receipt. No signature required.
    `.trim();

    return Buffer.from(receiptText, 'utf-8');
  }
}

export default new PDFService();
