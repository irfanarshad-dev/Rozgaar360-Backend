import { v2 as cloudinary } from 'cloudinary';

export const CloudinaryProvider = {
  provide: 'CLOUDINARY',
  useFactory: () => {
    return cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  },
};

// For local development without Cloudinary:
export const mockCloudinaryUpload = (file: Express.Multer.File) => {
  return Promise.resolve({
    secure_url: `http://localhost:3001/uploads/${Date.now()}_${file.originalname}`,
    public_id: `local_${Date.now()}`,
  });
};

// To use local mock, replace uploadToCloudinary call in verification.service.ts with:
// const frontUpload = await mockCloudinaryUpload(files.cnicFront[0]);
// const backUpload = await mockCloudinaryUpload(files.cnicBack[0]);