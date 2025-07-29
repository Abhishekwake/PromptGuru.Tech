import express from 'express';
import {
  register,
  login,
  googleLogin,
  verifyEmail,
} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/check-email-verified', verifyEmail);

export default router;
