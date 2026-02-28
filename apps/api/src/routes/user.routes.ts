import { Router } from 'express';
import { UserService } from '../services/user.service.js';
import { authenticateJwt } from '../middleware/auth.middleware.js';
import { authorizeRole } from '../middleware/role.middleware.js';

const router = Router();

router.get('/', authenticateJwt, authorizeRole(['manager']), async (req, res, next) => {
    try {
        const users = await UserService.getAllUsers();
        res.json({ success: true, data: users });
    } catch (err) {
        next(err);
    }
});

router.patch('/:id/status', authenticateJwt, authorizeRole(['manager']), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        await UserService.toggleUserStatus(Number(id), isActive);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

router.get('/departments', authenticateJwt, async (req, res) => {
    try {
        const depts = await UserService.getDepartments();
        res.json({ success: true, data: depts });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/', authenticateJwt, authorizeRole(['manager']), async (req, res) => {
    try {
        const userId = await UserService.createUser(req.body);
        res.json({ success: true, userId });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.patch('/:id', authenticateJwt, authorizeRole(['manager']), async (req, res) => {
    try {
        await UserService.updateUser(Number(req.params.id), req.body);
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;
