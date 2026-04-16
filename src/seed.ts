import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './schemas/user.schema';
import { WorkerProfile } from './schemas/worker-profile.schema';
import { CustomerProfile } from './schemas/customer-profile.schema';

// Pakistan major cities coordinates
const CITY_COORDS = {
  Lahore: [74.3587, 31.5204],
  Karachi: [67.0011, 24.8607],
  Islamabad: [73.0479, 33.6844],
  Rawalpindi: [73.0479, 33.5651],
  Faisalabad: [73.0479, 31.4504],
  Multan: [71.5249, 30.1575],
  Peshawar: [71.5249, 34.0151],
  Quetta: [66.9750, 30.1798],
};

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const workerProfileModel = app.get<Model<WorkerProfile>>(getModelToken(WorkerProfile.name));
  const customerProfileModel = app.get<Model<CustomerProfile>>(getModelToken(CustomerProfile.name));

  await userModel.deleteMany({});
  await workerProfileModel.deleteMany({});
  await customerProfileModel.deleteMany({});

  const adminPassword = await bcrypt.hash('admin123', 10);
  await userModel.create({
    name: 'Admin User',
    phone: '03001234567',
    password: adminPassword,
    role: 'admin',
    city: 'Lahore',
  });

  const workerPassword = await bcrypt.hash('worker123', 10);
  
  const workers = [
    { name: 'Ali Khan', phone: '03011234567', password: workerPassword, role: 'worker', city: 'Lahore' },
    { name: 'Ahmed Hassan', phone: '03021234567', password: workerPassword, role: 'worker', city: 'Karachi' },
    { name: 'Muhammad Usman', phone: '03031234567', password: workerPassword, role: 'worker', city: 'Lahore' },
    { name: 'Tariq Mahmood', phone: '03041234567', password: workerPassword, role: 'worker', city: 'Islamabad' },
    { name: 'Shahid Afridi', phone: '03051234567', password: workerPassword, role: 'worker', city: 'Lahore' },
  ];

  const createdWorkers = await userModel.insertMany(workers);

  const workerProfiles = [
    { 
      userId: createdWorkers[0]._id, 
      skill: 'Electrician', 
      experience: 5, 
      rating: 4.8, 
      reviewCount: 23, 
      verified: true, 
      verificationStatus: 'approved',
      location: { type: 'Point', coordinates: CITY_COORDS.Lahore }
    },
    { 
      userId: createdWorkers[1]._id, 
      skill: 'Plumber', 
      experience: 3, 
      rating: 4.2, 
      reviewCount: 15, 
      verified: true, 
      verificationStatus: 'approved',
      location: { type: 'Point', coordinates: CITY_COORDS.Karachi }
    },
    { 
      userId: createdWorkers[2]._id, 
      skill: 'Carpenter', 
      experience: 7, 
      rating: 4.9, 
      reviewCount: 31, 
      verified: true, 
      verificationStatus: 'approved',
      location: { type: 'Point', coordinates: CITY_COORDS.Lahore }
    },
    { 
      userId: createdWorkers[3]._id, 
      skill: 'Electrician', 
      experience: 2, 
      rating: 3.8, 
      reviewCount: 8, 
      verified: true, 
      verificationStatus: 'approved',
      location: { type: 'Point', coordinates: CITY_COORDS.Islamabad }
    },
    { 
      userId: createdWorkers[4]._id, 
      skill: 'Painter', 
      experience: 4, 
      rating: 4.5, 
      reviewCount: 19, 
      verified: true, 
      verificationStatus: 'approved',
      location: { type: 'Point', coordinates: CITY_COORDS.Lahore }
    },
  ];

  await workerProfileModel.insertMany(workerProfiles);

  const customerPassword = await bcrypt.hash('customer123', 10);
  const customers = [
    { name: 'Sara Ahmed', phone: '03061234567', password: customerPassword, role: 'customer', city: 'Lahore' },
    { name: 'Fatima Khan', phone: '03071234567', password: customerPassword, role: 'customer', city: 'Karachi' },
  ];

  const createdCustomers = await userModel.insertMany(customers);

  const customerProfiles = [
    { userId: createdCustomers[0]._id, address: 'DHA Phase 5, Lahore' },
    { userId: createdCustomers[1]._id, address: 'Gulshan-e-Iqbal, Karachi' },
  ];

  await customerProfileModel.insertMany(customerProfiles);

  console.log('Seed data with locations created successfully!');
  console.log('Admin: phone=03001234567, password=admin123');
  console.log('Worker: phone=03011234567, password=worker123');
  console.log('Customer: phone=03061234567, password=customer123');

  await app.close();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
