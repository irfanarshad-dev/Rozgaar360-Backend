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

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check for the new email
    const newUser = await User.findOne({ email: 'sigMadev24@gmail.com' });
    if (newUser) {
      console.log('User with new email found:', {
        name: newUser.name,
        phone: newUser.phone,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive,
      });
    } else {
      console.log('No user found with email sigMadev24@gmail.com');
    }

    // Check for the old email
    const oldUser = await User.findOne({ email: 'ahad@gmail.com' });
    if (oldUser) {
      console.log('User with old email still exists:', {
        name: oldUser.name,
        phone: oldUser.phone,
        email: oldUser.email,
        role: oldUser.role,
        isActive: oldUser.isActive,
      });
    } else {
      console.log('No user found with email ahad@gmail.com');
    }

    // List all users with emails
    const allUsers = await User.find({ email: { $exists: true } }, 'name phone email role isActive');
    console.log('All users with emails:');
    allUsers.forEach(user => {
      console.log(`- ${user.name}: ${user.email} (${user.role}) active: ${user.isActive}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkUser();