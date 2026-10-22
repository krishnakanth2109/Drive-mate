import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay instance safely
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_placeholder',
});

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    if (!amount || isNaN(Number(amount))) {
      res.status(400).json({ success: false, message: 'Valid amount is required' });
      return;
    }

    const options = {
      amount: Math.round(Number(amount) * 100), // Amount in paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      res.status(500).json({ success: false, message: 'Some error occurred with Razorpay order creation' });
      return;
    }

    res.json({ success: true, order });
  } catch (error: any) {
    console.error('Create Razorpay order error:', error);
    res.status(500).json({ success: false, message: error.message || 'Payment creation failed' });
  }
};

export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({ success: false, message: 'Missing required payment verification details' });
      return;
    }

    const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_placeholder')
      .update(sign)
      .digest('hex');

    if (razorpay_signature === expectedSign) {
      res.status(200).json({ success: true, message: 'Payment verified successfully' });
      return;
    } else {
      res.status(400).json({ success: false, message: 'Invalid signature sent!' });
      return;
    }
  } catch (error: any) {
    console.error('Verify Razorpay payment error:', error);
    res.status(500).json({ success: false, message: error.message || 'Payment verification failed' });
  }
};
