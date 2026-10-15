import { Router } from 'express';
import { signup, login } from '../controllers/authController';

const router = Router();

// POST /api/auth/signup - Register new user
router.post('/signup', signup);

// POST /api/auth/login - Authenticate existing user
router.post('/login', login);

export default router;
