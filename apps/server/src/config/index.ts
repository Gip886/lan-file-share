import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  jwtSecret: process.env.JWT_SECRET || 'default-secret',
  jwtExpiresIn: '7d',
  databaseUrl: process.env.DATABASE_URL || 'file:../../../data/database.db',
  staticDir: path.join(__dirname, '../../../data/static'),
  uploadDir: path.join(__dirname, '../../../data/uploads'),
  thumbnailDir: path.join(__dirname, '../../../data/thumbnails'),
};

export { prisma } from './database';