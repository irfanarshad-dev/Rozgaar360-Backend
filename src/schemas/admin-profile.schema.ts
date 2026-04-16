import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'adminprofiles' })
export class AdminProfile extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop()
  department?: string;
}

export const AdminProfileSchema = SchemaFactory.createForClass(AdminProfile);
AdminProfileSchema.index({ userId: 1 });
