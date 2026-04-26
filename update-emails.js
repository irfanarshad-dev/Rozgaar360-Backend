require('dotenv').config();
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  password: String,
  role: String,
  city: String,
  profilePicture: String,
  isActive: Boolean,
}, { timestamps: true });

const User = mongoose.model('User', userSchema, 'users');

async function updateEmails() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update all emails to lowercase
    const result = await User.updateMany(
      { email: { $exists: true } },
      [{ $set: { email: { $toLower: '$email' } } }]
    );

    console.log(`Updated ${result.modifiedCount} user emails to lowercase`);

    // Also update password reset emails
    const passwordResetSchema = new mongoose.Schema({
      email: String,
      token: String,
      expiresAt: Date,
    });
    const PasswordReset = mongoose.model('PasswordReset', passwordResetSchema, 'passwordresets');

    const resetResult = await PasswordReset.updateMany(
      { email: { $exists: true } },
      [{ $set: { email: { $toLower: '$email' } } }]
    );

    console.log(`Updated ${resetResult.modifiedCount} password reset emails to lowercase`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

updateEmails();