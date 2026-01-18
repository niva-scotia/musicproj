import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserPayload } from '../middleware/auth';
import { redisDb } from '../config'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-me';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateTokens = (user: UserPayload) => {
  const accessToken = jwt.sign(user, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  const refreshToken = jwt.sign({ id: user.id, type: 'refresh' }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });

  return { accessToken, refreshToken };
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET) as { id: string; type: string };
};

export const blacklistToken = async (token: string, expiresIn: number) => {
  // Store in Redis until token would have expired anyway
  await redisDb.set(`blacklist:${token}`, 'true', expiresIn);
};