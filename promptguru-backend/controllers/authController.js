import User from '../models/User.js';
import connectToDatabase from '../utils/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import admin from '../utils/firebaseAdmin.js';

const JWT_SECRET = process.env.JWT_SECRET;

// ==========================
// REGISTER
// ==========================
export async function register(req, res) {
  const { token, name, password } = req.body;

  if (!token || !name || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    await connectToDatabase();
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid, email } = decodedToken;

    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      return res.status(409).json({ message: 'User already exists in MongoDB' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email: email.toLowerCase(),
      passwordHash,
      isEmailVerified: false,
      firebaseUid: uid,
    });
    await user.save();

    return res.status(201).json({ message: 'User registered in MongoDB.' });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error during registration.' });
  }
}

// ==========================
// LOGIN
// ==========================
export async function login(req, res) {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Missing token' });
  }

  try {
    await connectToDatabase();
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { email, email_verified } = decodedToken;

    if (!email_verified) {
      return res.status(403).json({ message: 'EMAIL_NOT_VERIFIED' });
    }
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found in database.' });
    }
    
    const appToken = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.status(200).json({ token: appToken });

  } catch (error) {
    console.error('Login error:', error);
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ message: 'Token expired, please log in again.' });
    }
    return res.status(500).json({ message: 'Server error during login.' });
  }
}

// ==========================
// GOOGLE LOGIN
// ==========================
export async function googleLogin(req, res) {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'No token provided' });
  }

  try {
    await connectToDatabase();
    
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid, email, name, email_verified, picture } = decodedToken;

    if (!email_verified) {
      return res.status(403).json({ message: 'EMAIL_NOT_VERIFIED' });
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      user = new User({
        name,
        email: email.toLowerCase(),
        firebaseUid: uid,
        googleUser: true,
        avatar: picture,
        isEmailVerified: true,
      });
      await user.save();
    }

    const jwtToken = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Google login error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// ==========================
// VERIFY EMAIL STATUS
// ==========================
export async function verifyEmail(req, res) {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    await connectToDatabase();

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const firebaseUser = await admin.auth().getUser(user.firebaseUid);

    if (firebaseUser.emailVerified && !user.isEmailVerified) {
      user.isEmailVerified = true;
      await user.save();
    }
    
    if (user.isEmailVerified) {
        return res.status(200).json({ message: 'Email verified successfully' });
    } else {
        return res.status(403).json({ message: 'Email not verified yet' });
    }

  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}
