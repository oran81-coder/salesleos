import { Router } from 'express';
import { SyncService } from '../services/sync.service.js';
import { authenticateJwt } from '../middleware/auth.middleware.js';
import { authorizeRole } from '../middleware/role.middleware.js';

const router = Router();

router.post('/trigger', authenticateJwt, authorizeRole(['manager']), async (req, res, next) => {
    try {
        const { month } = req.body;
        console.log(`[SyncRoutes] Triggering sync for month: ${month}`);
        if (!month) {
            console.error('[SyncRoutes] Sync failed: Month required');
            return res.status(400).json({ success: false, message: 'Month required' });
        }
        const result = await SyncService.triggerSync(month);
        console.log('[SyncRoutes] Sync completed successfully:', result);
        res.json({ success: true, ...result });
    } catch (err: any) {
        console.error('[SyncRoutes] Sync trigger error:', err);
        // Ensure we send a JSON response even on crash
        res.status(500).json({ success: false, message: `סנכרון נכשל: ${err.message || 'שגיאת שרת פנימית'}` });
    }
});

router.get('/runs', authenticateJwt, authorizeRole(['manager']), async (req, res, next) => {
    try {
        const data = await SyncService.getSyncRuns();
        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
});

router.get('/errors', authenticateJwt, authorizeRole(['manager']), async (req, res, next) => {
    try {
        const data = await SyncService.getDataErrors();
        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
});

router.get('/settings', authenticateJwt, authorizeRole(['manager']), async (req, res, next) => {
    try {
        const data = await SyncService.getSettings();
        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
});

router.post('/settings', authenticateJwt, authorizeRole(['manager']), async (req, res, next) => {
    try {
        await SyncService.updateSettings(req.body);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

router.get('/tabs', authenticateJwt, authorizeRole(['manager']), async (req, res, next) => {
    try {
        const data = await SyncService.getSheetTabs();
        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
});

router.get('/debug-run-sync', async (req, res, next) => {
    try {
        const { month } = req.query;
        if (!month) return res.status(400).json({ success: false, message: 'Month required' });
        const result = await SyncService.triggerSync(String(month));
        res.json({ success: true, result });
    } catch (err) {
        next(err);
    }
});

router.get('/debug-sheet', async (req, res, next) => {
    try {
        const { month } = req.query;
        if (!month) return res.status(400).json({ success: false, message: 'Month required' });
        const { KPIService } = await import('../services/kpi.service.js');
        const leaderboard = await KPIService.getLeaderboard(null, String(month));
        res.json({ success: true, leaderboard });
    } catch (err) {
        next(err);
    }
});

router.get('/headers', authenticateJwt, authorizeRole(['manager']), async (req, res, next) => {
    try {
        const { month } = req.query;
        if (!month) return res.status(400).json({ success: false, message: 'Month required' });
        const data = await SyncService.getSheetHeaders(String(month));
        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
});

export default router;
