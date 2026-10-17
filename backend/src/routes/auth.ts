import { Router } from 'express';
import { signup, login, googleLogin } from '../controllers/authController';

const router = Router();

// POST /api/auth/signup - Register new user
router.post('/signup', signup);

// POST /api/auth/login - Authenticate existing user
router.post('/login', login);

// POST /api/auth/google - Verify Google ID token and issue an app JWT
router.post('/google', googleLogin);

export default router;
