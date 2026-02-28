import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { authMiddleware } from '../src/middleware/auth.middleware';
import jwt from 'jsonwebtoken';

// Mock express app for testing middleware
const app = express();
app.use(express.json());
app.get('/test-auth', authMiddleware, (req, res) => {
    res.status(200).json({ user: (req as any).user });
});

describe('API Auth Middleware', () => {
    it('should fail if no token provided', async () => {
        const response = await request(app).get('/test-auth');
        expect(response.status).toBe(401);
    });

    it('should fail if invalid token provided', async () => {
        const response = await request(app)
            .get('/test-auth')
            .set('Authorization', 'Bearer invalid-token');
        expect(response.status).toBe(401);
    });

    it('should pass if valid token provided', async () => {
        const payload = { id: 1, email: 'test@laos.com', role: 'manager' };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'test_secret');

        const response = await request(app)
            .get('/test-auth')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.user.email).toBe('test@laos.com');
    });
});
