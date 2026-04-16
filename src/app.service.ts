import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Test } from './schemas/test.schema';

@Injectable()
export class AppService {
  constructor(
    @InjectModel(Test.name) private testModel: Model<Test>,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async testDatabase() {
    const testDoc = new this.testModel({
      message: 'Hello from MongoDB Atlas!',
    });
    
    const saved = await testDoc.save();
    return {
      success: true,
      message: 'Successfully connected to MongoDB Atlas!',
      data: saved,
    };
  }
}
