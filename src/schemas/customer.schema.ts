import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'customers' })
export class Customer extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  phone: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: 'customer' })
  role: string;

  @Prop({ required: true })
  city: string;

  @Prop()
  address?: string;

  @Prop({ default: '/user.png' })
  profilePicture?: string;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
