import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'categories' })
export class Category extends Document {
  @Prop({ required: true, trim: true, unique: true })
  name: string;

  @Prop({ trim: true })
  icon?: string;

  @Prop({ trim: true })
  description?: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
CategorySchema.index({ name: 1 }, { unique: true });