import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'rozgaar_tests' })
export class Test extends Document {
  @Prop({ required: true })
  message: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const TestSchema = SchemaFactory.createForClass(Test);