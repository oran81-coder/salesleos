import { Router } from 'express';
import { TierService } from '../services/tier.service.js';
import { authenticateJwt } from '../middleware/auth.middleware.js';
import { authorizeRole } from '../middleware/role.middleware.js';

const router = Router();

router.get('/', authenticateJwt, async (req, res) => {
    try {
        const tiers = await TierService.getActiveTiers();
        res.json({ success: true, data: tiers });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/version', authenticateJwt, authorizeRole(['manager']), async (req, res) => {
    try {
        const { effectiveFrom, tiers } = req.body;
        const versionId = await TierService.createNewVersion({ effectiveFrom, tiers });
        res.json({ success: true, versionId });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;
