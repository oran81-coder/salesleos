import { Router } from 'express';
import { KPIService } from '../services/kpi.service.js';
import { authenticateJwt } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/leaderboard', authenticateJwt, async (req, res, next) => {
    try {
        const { month, departmentId } = req.query;
        if (!month) {
            return res.status(400).json({ success: false, message: 'Month is required' });
        }
        const data = await KPIService.getLeaderboard(
            departmentId ? Number(departmentId) : null,
            month as string
        );
        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
});

router.get('/rep-rankings', authenticateJwt, async (req, res, next) => {
    try {
        const { month, repId } = req.query;
        const targetRepId = req.user!.role === 'manager' && repId ? Number(repId) : req.user!.userId;

        if (!month) {
            return res.status(400).json({ success: false, message: 'Month is required' });
        }
        const data = await KPIService.getRepRankings(targetRepId, month as string);
        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
});

router.get('/department-summary', authenticateJwt, async (req, res, next) => {
    try {
        const { month, departmentId } = req.query;
        if (!month) {
            return res.status(400).json({ success: false, message: 'Month is required' });
        }
        const data = await KPIService.getDepartmentSummary(
            departmentId ? Number(departmentId) : null,
            month as string
        );
        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
});

router.get('/monthly-target', authenticateJwt, async (req, res, next) => {
    try {
        const { month } = req.query;
        if (!month) {
            return res.status(400).json({ success: false, message: 'Month is required' });
        }
        const target = await KPIService.getMonthlyTarget(month as string);
        res.json({ success: true, target });
    } catch (err) {
        next(err);
    }
});

router.post('/monthly-target', authenticateJwt, async (req, res, next) => {
    try {
        if (req.user!.role !== 'manager') {
            return res.status(403).json({ success: false, message: 'Only managers can set targets' });
        }
        const { month, target } = req.body;
        if (!month || target === undefined) {
            return res.status(400).json({ success: false, message: 'Month and target are required' });
        }
        await KPIService.setMonthlyTarget(month, Number(target));
        res.json({ success: true, message: 'Target updated successfully' });
    } catch (err) {
        next(err);
    }
});

export default router;
