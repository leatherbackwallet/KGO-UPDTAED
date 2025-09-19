/**
 * Payment Service - Razorpay integration
 * Handles payment processing and verification
 */

import crypto from 'crypto';
import Razorpay from 'razorpay';

class PaymentService {
  private razorpay: Razorpay;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!
    });
  }

  /**
   * Create a Razorpay order
   */
  async createOrder(amount: number, currency: string, receipt?: string): Promise<any> {
    try {
      const options = {
        amount: amount * 100, // Razorpay expects amount in paise
        currency,
        receipt: receipt || `receipt_${Date.now()}`,
        notes: {
          source: 'OnYourBehlf - Kerala Gifts Online'
        }
      };

      const order = await this.razorpay.orders.create(options);
      return order;
    } catch (error: any) {
      console.error('Error creating Razorpay order:', error);
      throw new Error(`Failed to create payment order: ${error.message}`);
    }
  }

  /**
   * Verify payment signature
   */
  verifyPayment(orderId: string, paymentId: string, signature: string): boolean {
    try {
      const body = orderId + '|' + paymentId;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(body.toString())
        .digest('hex');

      return expectedSignature === signature;
    } catch (error: any) {
      console.error('Error verifying payment signature:', error);
      return false;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(body: string, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
        .update(body)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error: any) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Get payment details
   */
  async getPaymentDetails(paymentId: string): Promise<any> {
    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      return payment;
    } catch (error: any) {
      console.error('Error fetching payment details:', error);
      throw new Error(`Failed to fetch payment details: ${error.message}`);
    }
  }

  /**
   * Get order details
   */
  async getOrderDetails(orderId: string): Promise<any> {
    try {
      const order = await this.razorpay.orders.fetch(orderId);
      return order;
    } catch (error: any) {
      console.error('Error fetching order details:', error);
      throw new Error(`Failed to fetch order details: ${error.message}`);
    }
  }

  /**
   * Capture payment
   */
  async capturePayment(paymentId: string, amount: number, currency: string): Promise<any> {
    try {
      const capture = await this.razorpay.payments.capture(paymentId, amount * 100, currency);
      return capture;
    } catch (error: any) {
      console.error('Error capturing payment:', error);
      throw new Error(`Failed to capture payment: ${error.message}`);
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentId: string, amount?: number, notes?: any): Promise<any> {
    try {
      const refundOptions: any = {
        payment_id: paymentId,
        notes: notes || { reason: 'Customer requested refund' }
      };

      if (amount) {
        refundOptions.amount = amount * 100; // Convert to paise
      }

      const refund = await this.razorpay.payments.refund(paymentId, refundOptions);
      return refund;
    } catch (error: any) {
      console.error('Error processing refund:', error);
      throw new Error(`Failed to process refund: ${error.message}`);
    }
  }
}

export default new PaymentService();
