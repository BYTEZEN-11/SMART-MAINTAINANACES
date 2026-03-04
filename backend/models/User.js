const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const BCRYPT_COST = 12; 

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },

firebaseUid: {
    type: String,
    index: true,
    sparse: true,
    unique: true,
  },

authProvider: {
    type: String,
    enum: ['local', 'firebase'],
    default: 'local',
  },

emailVerified: {
    type: Boolean,
    default: false,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },

needsRehash: {
    type: Boolean,
    default: false,
    select: false,
  },
  fcmToken: {
    type: String,
    select: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, BCRYPT_COST);
  this.needsRehash = false;
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.detectNeedsRehash = function() {
  if (!this.password || typeof this.password !== 'string') return false;
  if (!this.password.startsWith('$2')) return false; 
  const rounds = bcrypt.getRounds(this.password);
  return rounds < BCRYPT_COST;
};

userSchema.methods.rehashPassword = async function(newPlaintext) {
  this.password = await bcrypt.hash(newPlaintext, BCRYPT_COST);
  this.needsRehash = false;
  return this.save();
};

userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);
