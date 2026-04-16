import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Payment extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Booking', required: true })
  bookingId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  customerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  workerId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ enum: ['jazzcash', 'easypaisa', 'cod', 'bank_transfer'], required: true })
  paymentMethod: string;

  @Prop({ enum: ['pending', 'processing', 'completed', 'failed', 'refunded'], default: 'pending' })
  status: string;

  @Prop()
  transactionId?: string;

  @Prop()
  bankTransferProof?: string;

  @Prop()
  jazzCashTxnRefNo?: string;

  @Prop()
  responseCode?: string;

  @Prop()
  responseMessage?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
