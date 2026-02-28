import { Router } from 'express';
import { AuthService } from '../services/auth.service.js';
import { authenticateJwt } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await AuthService.login(email, password);
        if (!result) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        res.json({ success: true, ...result });
    } catch (err) {
        next(err);
    }
});

router.get('/me', authenticateJwt, async (req, res, next) => {
    try {
        const user = await AuthService.getUserById(req.user!.userId);
        res.json({ success: true, user });
    } catch (err) {
        next(err);
    }
});

export default router;
