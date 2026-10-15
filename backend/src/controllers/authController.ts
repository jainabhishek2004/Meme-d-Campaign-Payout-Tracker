import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AppError } from '../middleware/errorHandler';

const EMAIL_PATTERN = /^(?!\.)(?!.*\.\.)[A-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,63}$/i;
const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_BYTES = 72;
const MAX_NAME_LENGTH = 100;

const normalizeEmail = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) return null;
  return email;
};

const validatePassword = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length >= MIN_PASSWORD_LENGTH &&
  Buffer.byteLength(value, 'utf8') <= MAX_PASSWORD_BYTES;

const generateToken = (id: string, role: string, email: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError('Server configuration error: JWT_SECRET is missing', 500);
  }
  const expiresIn = (process.env.JWT_EXPIRES_IN as any) || '7d';
  return jwt.sign({ id, role, email }, secret, { expiresIn });
};

/**
 * Register a new user (brand or creator)
 * POST /api/auth/signup
 */
export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name: rawName, email: rawEmail, password, role } = req.body ?? {};

    if (rawName === undefined || rawEmail === undefined || password === undefined || role === undefined) {
      throw new AppError('Please provide name, email, password, and role', 400);
    }

    if (typeof rawName !== 'string' || !rawName.trim() || rawName.trim().length > MAX_NAME_LENGTH) {
      throw new AppError(`name must be a non-empty string of at most ${MAX_NAME_LENGTH} characters`, 400);
    }

    const email = normalizeEmail(rawEmail);
    if (!email) {
      throw new AppError('email must be a valid email address of at most 254 characters', 400);
    }

    if (!validatePassword(password)) {
      throw new AppError(
        `password must be at least ${MIN_PASSWORD_LENGTH} characters and no more than ${MAX_PASSWORD_BYTES} UTF-8 bytes`,
        400
      );
    }

    if (!['brand', 'creator'].includes(role)) {
      throw new AppError('Role must be either "brand" or "creator"', 400);
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new AppError('An account with this email already exists', 400);
    }

    const user = await User.create({
      name: rawName.trim(),
      email,
      password,
      role,
    });

    const token = generateToken(user._id.toString(), user.role, user.email);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Authenticate existing user & return token
 * POST /api/auth/login
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email: rawEmail, password } = req.body ?? {};

    if (rawEmail === undefined || password === undefined) {
      throw new AppError('Please provide email and password', 400);
    }

    const email = normalizeEmail(rawEmail);
    if (!email) {
      throw new AppError('email must be a valid email address of at most 254 characters', 400);
    }

    if (!validatePassword(password)) {
      throw new AppError(
        `password must be at least ${MIN_PASSWORD_LENGTH} characters and no more than ${MAX_PASSWORD_BYTES} UTF-8 bytes`,
        400
      );
    }

    const user = await User.findOne({ email });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = generateToken(user._id.toString(), user.role, user.email);

    res.status(200).json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};
