import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'customerprofiles' })
export class CustomerProfile extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop()
  address?: string;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
  })
  location?: {
    type: string;
    coordinates: number[];
  };

  @Prop()
  locationUpdatedAt?: Date;

  @Prop({ default: 0 })
  totalJobsPosted: number;

  @Prop({ default: 0 })
  totalSpent: number;
}

export const CustomerProfileSchema = SchemaFactory.createForClass(CustomerProfile);
CustomerProfileSchema.index({ userId: 1 });
CustomerProfileSchema.index({ location: '2dsphere' });
