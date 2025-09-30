/**
 * Payment Service - Razorpay integration
 * Handles payment processing and verification
 */

import crypto from 'crypto';
import Razorpay from 'razorpay';

class PaymentService {
  private razorpay: Razorpay;

  constructor() {
    console.log('🔍 [Payment Service] Initializing Razorpay...');
    console.log('🔍 [Payment Service] Key ID:', process.env.RAZORPAY_KEY_ID);
    console.log('🔍 [Payment Service] Key Secret:', process.env.RAZORPAY_KEY_SECRET ? 'SET' : 'NOT SET');
    console.log('🔍 [Payment Service] Webhook Secret:', process.env.RAZORPAY_WEBHOOK_SECRET ? 'SET' : 'NOT SET');
    
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('❌ [Payment Service] Missing Razorpay credentials');
      throw new Error('Razorpay credentials not configured');
    }
    
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      console.warn('⚠️  [Payment Service] RAZORPAY_WEBHOOK_SECRET not set - webhook signature verification will fail!');
      console.warn('⚠️  [Payment Service] Please set RAZORPAY_WEBHOOK_SECRET environment variable for production use');
    }
    
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!
    });
    
    console.log('✅ [Payment Service] Razorpay initialized successfully');
  }

  /**
   * Create a Razorpay order
   */
  async createOrder(amount: number, currency: string, receipt?: string): Promise<any> {
    try {
      console.log('🔍 [Payment Service] Creating Razorpay order...');
      console.log('🔍 [Payment Service] Amount:', amount);
      console.log('🔍 [Payment Service] Currency:', currency);
      console.log('🔍 [Payment Service] Key ID:', process.env.RAZORPAY_KEY_ID);
      console.log('🔍 [Payment Service] Key Secret:', process.env.RAZORPAY_KEY_SECRET ? 'SET' : 'NOT SET');
      
      // Ensure amount is a valid number and convert to paise
      const amountInPaise = Math.round(amount * 100);
      console.log('🔍 [Payment Service] Amount in paise:', amountInPaise);
      
      const options = {
        amount: amountInPaise, // Razorpay expects amount in paise
        currency: currency || 'INR',
        receipt: receipt || `receipt_${Date.now()}`,
        notes: {
          source: 'OnYourBehlf - Kerala Gifts Online',
          timestamp: new Date().toISOString()
        }
      };

      console.log('🔍 [Payment Service] Order options:', options);
      const order = await this.razorpay.orders.create(options);
      console.log('✅ [Payment Service] Order created successfully:', order.id);
      console.log('✅ [Payment Service] Order details:', JSON.stringify(order, null, 2));
      return order;
    } catch (error: any) {
      console.error('❌ [Payment Service] Error creating Razorpay order:', error);
      console.error('❌ [Payment Service] Error details:', error.message);
      console.error('❌ [Payment Service] Error response:', error.response?.data);
      console.error('❌ [Payment Service] Error stack:', error.stack);
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
