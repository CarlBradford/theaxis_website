// Test environment setup
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://theaxis_user:theaxis_password@localhost:5432/theaxis_test?schema=public';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.PORT = '3001';
process.env.LOG_LEVEL = 'error';
process.env.API_DOCS_ENABLED = 'false';

// Mock path module for dotenv
const path = require('path');
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  resolve: jest.fn((...args) => args.join('/')),
}));

// Setup test database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

beforeAll(async () => {
  // Clean up test data
  await prisma.auditLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.editorialNote.deleteMany();
  await prisma.article.deleteMany();
  await prisma.user.deleteMany({ where: { email: { contains: 'test@' } } });
});

afterAll(async () => {
  await prisma.$disconnect();
});

// Global test timeout
jest.setTimeout(30000);