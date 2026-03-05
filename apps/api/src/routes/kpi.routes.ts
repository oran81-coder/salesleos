import { Router } from 'express';
import { KPIService } from '../services/kpi.service.js';
import { authenticateJwt } from '../middleware/auth.middleware.js';
import { PdfService } from '../services/pdf.service.js';

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

router.get('/accounting-report', authenticateJwt, async (req, res, next) => {
    const { month, departmentId } = req.query;
    console.log(`[KPIRoutes] Generating accounting report for month: ${month}, departmentId: ${departmentId}`);
    try {
        if (!month) {
            console.error('[KPIRoutes] PDF generation failed: Month is required');
            return res.status(400).json({ success: false, message: 'Month is required' });
        }

        console.log('[KPIRoutes] Fetching report data...');
        const data = await KPIService.getAccountingReportData(
            departmentId ? Number(departmentId) : null,
            month as string
        );

        console.log('[KPIRoutes] Data fetched successfully. Generating HTML...');
        const html = generateAccountingReportHtml(data);

        console.log('[KPIRoutes] HTML generated. Calling PdfService...');
        const pdfBuffer = await PdfService.generatePdf(html);

        console.log(`[KPIRoutes] PDF generated successfully. Buffer size: ${pdfBuffer.length} bytes`);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=accounting_report_${month}.pdf`);
        res.send(pdfBuffer);
    } catch (err: any) {
        console.error('[KPIRoutes] PDF Generation Error:', err);
        // Ensure we send a JSON response if we haven't started sending the PDF yet
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: `הפקת דוח נכשלה: ${err.message}` });
        } else {
            next(err);
        }
    }
});

function generateAccountingReportHtml(data: any) {
    const { summary, leaderboard, deals, monthLabel } = data;

    return `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Arial', sans-serif; margin: 0; padding: 20px; color: #333; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #00d4ff; padding-bottom: 10px; margin-bottom: 30px; }
            .company-info h1 { margin: 0; color: #00d4ff; font-size: 24px; }
            .company-info p { margin: 5px 0; color: #666; }
            .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
            .summary-box { background: #f9f9f9; border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; }
            .summary-box label { display: block; font-size: 14px; color: #666; margin-bottom: 5px; }
            .summary-box .value { font-size: 18px; font-weight: bold; color: #333; }
            .summary-box .value.collection { color: #2ecc71; }
            .summary-box .value.offset { color: #e74c3c; }
            
            h2 { border-right: 4px solid #00d4ff; padding-right: 10px; margin: 30px 0 15px; color: #2c3e50; font-size: 18px; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #eee; padding: 10px; text-align: right; font-size: 12px; }
            th { background: #f4f7f6; font-weight: bold; }
            
            .payroll-table .highlight { background: #fffcf0; font-weight: bold; }
            .amount { white-space: nowrap; }
            
            .sub-summary { display: flex; justify-content: center; gap: 40px; margin-top: -20px; margin-bottom: 30px; font-size: 14px; color: #555; background: #f0f4f8; padding: 10px; border-radius: 4px; }
            .sub-summary span { font-weight: bold; color: #333; margin-right: 5px; }
            
            @media print {
                .page-break { page-break-before: always; }
            }
        </style>
    </head>
    <body>
        <div class="header" style="text-align: center; border-bottom: 2px solid #00d4ff; padding-bottom: 15px;">
            <div class="company-info" style="width: 100%;">
                <h1>לאוס מדיה ואינטראקטיב</h1>
                <p>מחלקת מכירות - סיכום חודש ${monthLabel}</p>
            </div>
        </div>

        <div class="summary-grid">
            <div class="summary-box">
                <label>סך מכירות</label>
                <div class="value">₪${summary.totalSales.toLocaleString()}</div>
            </div>
            <div class="summary-box">
                <label>גבייה כוללת</label>
                <div class="value collection">₪${summary.totalCollection.toLocaleString()}</div>
            </div>
            <div class="summary-box">
                <label>סך קיזוזים</label>
                <div class="value offset">₪${summary.totalOffset.toLocaleString()}</div>
            </div>
            <div class="summary-box">
                <label>בונוסים לתשלום</label>
                <div class="value">₪${leaderboard.reduce((acc: number, r: any) => acc + (r.FinalBonusPayout || 0), 0).toLocaleString()}</div>
            </div>
        </div>

        <div class="sub-summary">
            <div>כמות עסקאות: <span>${summary.totalDeals}</span></div>
            <div>חדשים מול חידושים: <span>${summary.newDeals}</span> חדשים | <span>${summary.renewals}</span> חידושים</div>
        </div>

        <h2>טבלת ריכוז נציגים (Payroll Summary)</h2>
        <table class="payroll-table">
            <thead>
                <tr>
                    <th>שם נציג</th>
                    <th>סך מכירות ברוטו</th>
                    <th>סכום גבייה</th>
                    <th>סכום קיזוז</th>
                    <th>בונוס (נטו) לתשלום</th>
                </tr>
            </thead>
            <tbody>
                ${leaderboard.map((r: any) => `
                    <tr>
                        <td>${r.repName}</td>
                        <td class="amount">₪${Number(r.TotalSales).toLocaleString()}</td>
                        <td class="amount">₪${Number(r.ActualCollection).toLocaleString()}</td>
                        <td class="amount">₪${Number(r.Offset).toLocaleString()}</td>
                        <td class="amount highlight">₪${Math.round(Number(r.FinalBonusPayout)).toLocaleString()}</td>
                    </tr>
                `).join('')}
            </tbody>
            <tfoot>
                <tr style="background: #eee; font-weight: bold;">
                    <td>סה"כ</td>
                    <td>₪${leaderboard.reduce((acc: number, r: any) => acc + Number(r.TotalSales), 0).toLocaleString()}</td>
                    <td>₪${leaderboard.reduce((acc: number, r: any) => acc + Number(r.ActualCollection), 0).toLocaleString()}</td>
                    <td>₪${leaderboard.reduce((acc: number, r: any) => acc + Number(r.Offset), 0).toLocaleString()}</td>
                    <td>₪${Math.round(leaderboard.reduce((acc: number, r: any) => acc + Number(r.FinalBonusPayout), 0)).toLocaleString()}</td>
                </tr>
            </tfoot>
        </table>

        <div class="page-break"></div>
        
        <h2>פירוט עסקאות (Detailed Log)</h2>
        <table>
            <thead>
                <tr>
                    <th>תאריך</th>
                    <th>שם עסק</th>
                    <th>נציג</th>
                    <th>גבייה עד כה</th>
                    <th>סכום עסקה</th>
                    <th>סטטוס</th>
                    <th>בונוס (שיטס)</th>
                </tr>
            </thead>
            <tbody>
                ${deals.map((d: any) => `
                    <tr>
                        <td>${d.deal_date ? new Date(d.deal_date).toLocaleDateString('he-IL') : '-'}</td>
                        <td>${d.customer_name || '-'}</td>
                        <td>${d.repName}</td>
                        <td class="amount">₪${Number(d.cumulativeCollection || d.bonus_requested).toLocaleString()}</td>
                        <td class="amount">₪${Number(d.deal_amount).toLocaleString()}</td>
                        <td>${d.is_renewal ? 'חידוש' : 'חדש'}</td>
                        <td class="amount">₪${Number(d.bonus_requested).toLocaleString()}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="footer">
            דוח זה הופק באופן אוטומטי על ידי מערכת לאוס מדיה | תאריך הפקה: ${new Date().toLocaleDateString('he-IL')}
        </div>
    </body>
    </html>
    `;
}

export default router;
