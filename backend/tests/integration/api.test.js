const request = require('supertest');
const app = require('../../src/app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('API Integration Tests', () => {
  let authToken;
  let testUserId;
  let testArticleId;
  let testCommentId;

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

  describe('Authentication Flow', () => {
    test('POST /api/auth/register - should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
        role: 'STAFF',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.token).toBeDefined();

      authToken = response.body.data.token;
      testUserId = response.body.data.user.id;
    });

    test('POST /api/auth/login - should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.token).toBeDefined();
    });

    test('GET /api/auth/profile - should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.email).toBe('test@example.com');
    });
  });

  describe('Articles Flow', () => {
    test('POST /api/articles - should create a new article', async () => {
      const articleData = {
        title: 'Test Article',
        content: 'This is a test article content.',
        excerpt: 'Test excerpt',
      };

      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(articleData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.title).toBe(articleData.title);
      expect(response.body.data.status).toBe('DRAFT');

      testArticleId = response.body.data.id;
    });

    test('GET /api/articles - should list articles', async () => {
      const response = await request(app)
        .get('/api/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.items).toBeInstanceOf(Array);
      expect(response.body.data.items.length).toBeGreaterThan(0);
    });

    test('GET /api/articles/:id - should get specific article', async () => {
      const response = await request(app)
        .get(`/api/articles/${testArticleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.id).toBe(testArticleId);
    });

    test('PUT /api/articles/:id - should update article', async () => {
      const updateData = {
        title: 'Updated Test Article',
        content: 'Updated content',
      };

      const response = await request(app)
        .put(`/api/articles/${testArticleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.title).toBe(updateData.title);
    });
  });

  describe('Comments Flow', () => {
    test('POST /api/comments - should create a comment', async () => {
      const commentData = {
        articleId: testArticleId,
        content: 'This is a test comment.',
      };

      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.content).toBe(commentData.content);
      expect(response.body.data.isApproved).toBe(false);

      testCommentId = response.body.data.id;
    });

    test('GET /api/comments - should list comments', async () => {
      const response = await request(app)
        .get(`/api/comments?articleId=${testArticleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.items).toBeInstanceOf(Array);
    });
  });

  describe('Tags Flow', () => {
    test('POST /api/tags - should create a tag', async () => {
      const tagData = {
        name: 'Test Tag',
        description: 'A test tag',
        color: '#ff0000',
      };

      const response = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tagData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.name).toBe(tagData.name);
    });

    test('GET /api/tags - should list tags', async () => {
      const response = await request(app)
        .get('/api/tags')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.items).toBeInstanceOf(Array);
    });
  });

  describe('Categories Flow', () => {
    test('POST /api/categories - should create a category', async () => {
      const categoryData = {
        name: 'Test Category',
        description: 'A test category',
      };

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.name).toBe(categoryData.name);
    });

    test('GET /api/categories - should list categories', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.items).toBeInstanceOf(Array);
    });
  });

  describe('Error Handling', () => {
    test('POST /api/auth/login - should fail with invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.status).toBe('error');
    });

    test('GET /api/auth/profile - should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.status).toBe('error');
    });

    test('POST /api/articles - should fail without authentication', async () => {
      const articleData = {
        title: 'Unauthorized Article',
        content: 'This should fail',
      };

      const response = await request(app)
        .post('/api/articles')
        .send(articleData)
        .expect(401);

      expect(response.body.status).toBe('error');
    });
  });

  describe('Cleanup', () => {
    test('DELETE /api/articles/:id - should delete article', async () => {
      // First promote user to Editor-in-Chief for delete permission
      await prisma.user.update({
        where: { id: testUserId },
        data: { role: 'EDITOR_IN_CHIEF' },
      });

      const response = await request(app)
        .delete(`/api/articles/${testArticleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
    });
  });
});
