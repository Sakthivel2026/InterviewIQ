import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

const signupSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  name: z.string().min(2, 'Name must be at least 2 characters long'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

const resetRequestSchema = z.object({
  email: z.string().email('Invalid email address format'),
});

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = signupSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Validation Error', details: parseResult.error.errors });
      return;
    }

    const { email, password, name } = parseResult.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: 'Conflict', message: 'An account with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
      },
    });

    const tokenPayload = { userId: user.id, email: user.email };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      message: 'Account created successfully.',
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
      accessToken,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal Error', message: 'Failed to create account.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Validation Error', details: parseResult.error.errors });
      return;
    }

    const { email, password } = parseResult.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid email or password.' });
      return;
    }

    const tokenPayload = { userId: user.id, email: user.email };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: 'Logged in successfully.',
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
      accessToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal Error', message: 'Login failed.' });
  }
};

export const logout = (req: Request, res: Response): void => {
  res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'lax' });
  res.status(200).json({ message: 'Logged out successfully.' });
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      res.status(401).json({ error: 'Unauthorized', message: 'Refresh token cookie missing.' });
      return;
    }

    const payload = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user) {
      res.status(401).json({ error: 'Unauthorized', message: 'User no longer exists.' });
      return;
    }

    const newTokenPayload = { userId: user.id, email: user.email };
    const newAccessToken = signAccessToken(newTokenPayload);

    res.status(200).json({
      accessToken: newAccessToken,
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
    });
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired refresh token.' });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) {
      res.status(404).json({ error: 'Not Found', message: 'User not found.' });
      return;
    }

    res.status(200).json({
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Error' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = resetRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Validation Error', details: parseResult.error.errors });
      return;
    }

    const { email } = parseResult.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const resetToken = signAccessToken({ userId: user.id, email: user.email });
      console.log(`\n======================================================`);
      console.log(`[PASSWORD RESET SIMULATION LOG]`);
      console.log(`To: ${email}`);
      console.log(`Reset Token: ${resetToken}`);
      console.log(`Link: http://localhost:5173/auth?mode=reset&token=${resetToken}`);
      console.log(`======================================================\n`);
    }

    // Always return success to prevent email enumeration attacks
    res.status(200).json({
      message: 'If an account exists for this email, password reset instructions have been sent.',
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Error' });
  }
};
