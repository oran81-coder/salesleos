import puppeteer from 'puppeteer';

export class PdfService {
    /**
     * Generates a PDF from HTML content
     */
    static async generatePdf(htmlContent: string): Promise<Buffer> {
        let browser;
        console.log('[PdfService] Starting PDF generation...');
        try {
            console.log('[PdfService] Launching browser...');
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            });
            console.log('[PdfService] Browser launched. Opening new page...');
            const page = await browser.newPage();

            console.log('[PdfService] Setting content...');
            // Set content and wait for network to be idle
            await page.setContent(htmlContent, {
                waitUntil: 'networkidle0',
                timeout: 30000
            });

            console.log('[PdfService] Generating PDF...');
            // Generate PDF
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20mm',
                    right: '10mm',
                    bottom: '20mm',
                    left: '10mm',
                },
            });

            return Buffer.from(pdfBuffer);
        } catch (error) {
            console.error('[PdfService] Error generating PDF:', error);
            throw error;
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }
}
