import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import { Payment } from '../schemas/payment.schema';
import { Booking } from '../schemas/booking.schema';

@Injectable()
export class PaymentService {
  private readonly JAZZCASH_MERCHANT_ID = process.env.JAZZCASH_MERCHANT_ID || 'MC12345';
  private readonly JAZZCASH_PASSWORD = process.env.JAZZCASH_PASSWORD || 'password123';
  private readonly JAZZCASH_INTEGRITY_SALT = process.env.JAZZCASH_INTEGRITY_SALT || 'salt123';
  private readonly JAZZCASH_RETURN_URL = process.env.JAZZCASH_RETURN_URL || 'http://localhost:3000/payment/callback';

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    @InjectModel(Booking.name) private bookingModel: Model<Booking>,
  ) {}

  // Create Payment
  async createPayment(bookingId: string, paymentMethod: string) {
    const booking = await this.bookingModel.findById(bookingId)
      .populate('customerId')
      .populate('workerId');

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    // Calculate amount (you can add your pricing logic here)
    const amount = this.calculateAmount(booking);

    const payment = await this.paymentModel.create({
      bookingId: booking._id,
      customerId: booking.customerId,
      workerId: booking.workerId,
      amount,
      paymentMethod,
      status: ['cod', 'bank_transfer'].includes(paymentMethod) ? 'pending' : 'processing',
    });

    if (paymentMethod === 'jazzcash') {
      return this.initiateJazzCashPayment(payment);
    }

    if (paymentMethod === 'bank_transfer') {
      return {
        paymentId: payment._id,
        status: 'pending',
        message: 'Bank Transfer - Please transfer amount and upload proof',
        bankDetails: {
          accountTitle: 'Rozgaar360',
          accountNumber: '1234567890',
          bankName: 'HBL',
          iban: 'PK36HABB0000001234567890',
        },
      };
    }

    return {
      paymentId: payment._id,
      status: 'pending',
      message: 'Cash on Delivery - Pay when service is completed',
    };
  }

  // JazzCash Payment Initiation
  private async initiateJazzCashPayment(payment: any) {
    const txnRefNo = `T${Date.now()}`;
    const amount = payment.amount * 100; // Convert to paisa
    const txnDateTime = this.getJazzCashDateTime();
    const expiryDateTime = this.getJazzCashExpiryDateTime();

    const postData = {
      pp_Version: '1.1',
      pp_TxnType: 'MWALLET',
      pp_Language: 'EN',
      pp_MerchantID: this.JAZZCASH_MERCHANT_ID,
      pp_SubMerchantID: '',
      pp_Password: this.JAZZCASH_PASSWORD,
      pp_TxnRefNo: txnRefNo,
      pp_Amount: amount.toString(),
      pp_TxnCurrency: 'PKR',
      pp_TxnDateTime: txnDateTime,
      pp_BillReference: payment._id.toString(),
      pp_Description: `Payment for Booking ${payment.bookingId}`,
      pp_TxnExpiryDateTime: expiryDateTime,
      pp_ReturnURL: this.JAZZCASH_RETURN_URL,
      ppmpf_1: '',
      ppmpf_2: '',
      ppmpf_3: '',
      ppmpf_4: '',
      ppmpf_5: '',
    };

    // Generate secure hash
    const sortedString = this.getSortedString(postData);
    const secureHash = this.generateHash(sortedString);
    postData['pp_SecureHash'] = secureHash;

    // Update payment with transaction reference
    await this.paymentModel.updateOne(
      { _id: payment._id },
      { jazzCashTxnRefNo: txnRefNo, metadata: postData }
    );

    return {
      paymentId: payment._id,
      jazzCashUrl: 'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/',
      postData,
      message: 'Redirect to JazzCash for payment',
    };
  }

  // JazzCash Callback Handler
  async handleJazzCashCallback(callbackData: any) {
    const payment = await this.paymentModel.findOne({
      jazzCashTxnRefNo: callbackData.pp_TxnRefNo,
    });

    if (!payment) {
      throw new BadRequestException('Payment not found');
    }

    // Verify secure hash
    const receivedHash = callbackData.pp_SecureHash;
    delete callbackData.pp_SecureHash;
    const sortedString = this.getSortedString(callbackData);
    const calculatedHash = this.generateHash(sortedString);

    if (receivedHash !== calculatedHash) {
      throw new BadRequestException('Invalid secure hash');
    }

    // Update payment status
    const status = callbackData.pp_ResponseCode === '000' ? 'completed' : 'failed';
    await this.paymentModel.updateOne(
      { _id: payment._id },
      {
        status,
        transactionId: callbackData.pp_TxnRefNo,
        responseCode: callbackData.pp_ResponseCode,
        responseMessage: callbackData.pp_ResponseMessage,
      }
    );

    // Update booking payment status
    await this.bookingModel.updateOne(
      { _id: payment.bookingId },
      { paymentStatus: status }
    );

    return {
      success: status === 'completed',
      message: callbackData.pp_ResponseMessage,
      paymentId: payment._id,
    };
  }

  // Mark COD as Paid
  async markCODPaid(paymentId: string) {
    const payment = await this.paymentModel.findById(paymentId);

    if (!payment || !['cod', 'bank_transfer'].includes(payment.paymentMethod)) {
      throw new BadRequestException('Invalid payment');
    }

    await this.paymentModel.updateOne(
      { _id: paymentId },
      { status: 'completed' }
    );

    await this.bookingModel.updateOne(
      { _id: payment.bookingId },
      { paymentStatus: 'completed' }
    );

    return { message: 'Payment marked as completed' };
  }

  // Get Payment Details
  async getPayment(paymentId: string) {
    return this.paymentModel.findById(paymentId)
      .populate('bookingId')
      .populate('customerId', 'name phone email')
      .populate('workerId', 'name phone email');
  }

  // Get Payments by Booking
  async getPaymentsByBooking(bookingId: string) {
    return this.paymentModel.find({ bookingId });
  }

  // Helper: Calculate Amount
  private calculateAmount(booking: any): number {
    // Use estimated cost if set by worker, otherwise use base price
    if (booking.estimatedCost && booking.estimatedCost > 0) {
      return booking.estimatedCost;
    }
    // Default base price
    return 500;
  }

  // Helper: Generate JazzCash DateTime
  private getJazzCashDateTime(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  // Helper: Generate Expiry DateTime (1 hour from now)
  private getJazzCashExpiryDateTime(): string {
    const expiry = new Date(Date.now() + 60 * 60 * 1000);
    const year = expiry.getFullYear();
    const month = String(expiry.getMonth() + 1).padStart(2, '0');
    const day = String(expiry.getDate()).padStart(2, '0');
    const hours = String(expiry.getHours()).padStart(2, '0');
    const minutes = String(expiry.getMinutes()).padStart(2, '0');
    const seconds = String(expiry.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  // Helper: Sort Object Keys
  private getSortedString(data: any): string {
    const sorted = Object.keys(data)
      .sort()
      .map(key => data[key])
      .join('&');
    return `${this.JAZZCASH_INTEGRITY_SALT}&${sorted}`;
  }

  // Helper: Generate HMAC SHA256 Hash
  private generateHash(data: string): string {
    return crypto
      .createHmac('sha256', this.JAZZCASH_INTEGRITY_SALT)
      .update(data)
      .digest('hex');
  }
}
