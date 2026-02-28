import { Router } from 'express';
import { BonusService } from '../services/bonus.service.js';
import { authenticateJwt } from '../middleware/auth.middleware.js';
import { authorizeRole } from '../middleware/role.middleware.js';

const router = Router();

// Rep can view own monthly bonus
router.get('/monthly', authenticateJwt, async (req, res, next) => {
    try {
        const { month, repId } = req.query;

        // Security: Restrict rep to only their own ID
        const targetRepId = req.user!.role === 'manager' ? Number(repId) : req.user!.userId;

        if (!month || isNaN(targetRepId)) {
            return res.status(400).json({ success: false, message: 'Missing month or repId' });
        }

        const result = await BonusService.getMonthlyBonus(targetRepId, month as string);
        res.json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
});

// Get deals for a specific month and rep
router.get('/deals', authenticateJwt, async (req, res, next) => {
    try {
        const { month, repId } = req.query;
        const targetRepId = req.user!.role === 'manager' && repId ? Number(repId) : req.user!.userId;

        if (!month) {
            return res.status(400).json({ success: false, message: 'Month is required' });
        }

        const result = await BonusService.getRepDeals(targetRepId, month as string);
        res.json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
});

// Get deferred bonuses for a rep
router.get('/deferred', authenticateJwt, async (req, res, next) => {
    try {
        const { repId } = req.query;
        const targetRepId = req.user!.role === 'manager' && repId ? Number(repId) : req.user!.userId;

        const result = await BonusService.getDeferredBonuses(targetRepId);
        res.json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
});

// Manager can approve bonuses
router.post('/approve', authenticateJwt, authorizeRole(['manager']), async (req, res, next) => {
    try {
        const approvalId = await BonusService.approveBonus({
            ...req.body,
            approvedByUserId: req.user!.userId
        });
        res.json({ success: true, approvalId });
    } catch (err: any) {
        res.status(400).json({ success: false, message: err.message });
    }
});

export default router;
