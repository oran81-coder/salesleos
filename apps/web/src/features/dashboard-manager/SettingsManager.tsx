import { useEffect, useState } from 'react';
import { APIClient } from '../../api/client';

export function SettingsManager() {
    const [mapping, setMapping] = useState<any>(null);
    const [headers, setHeaders] = useState<{ deals: string[], summary: string[] }>({ deals: [], summary: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [month, setMonth] = useState('2024-03');

    useEffect(() => {
        loadData();
    }, [month]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const settingsRes = await APIClient.get<any>('/sync/settings');
            if (settingsRes && settingsRes.data) {
                setMapping(settingsRes.data.mapping);
            }

            try {
                const headersRes = await APIClient.get<any>(`/sync/headers?month=${month}`);
                if (headersRes && headersRes.data) {
                    setHeaders(headersRes.data);
                }
            } catch (hErr) {
                console.warn('Failed to load headers, using empty list', hErr);
                setHeaders({ deals: [], summary: [] });
            }
        } catch (err) {
            console.error('CRITICAL: Failed to load mapping settings', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await APIClient.post('/sync/settings', { mapping });
            alert('הגדרות נשמרו בהצלחה');
        } catch (err: any) {
            alert('שמירה נכשלה: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="loading-state">טוען הגדרות וכותרות מהגליון...</div>;
    if (!mapping) return <div className="error-state">לא ניתן היה לטעון את הגדרות המיפוי.</div>;

    const renderSelect = (section: 'deals' | 'summary', field: string, label: string) => {
        const options = section === 'deals' ? headers.deals : headers.summary;
        return (
            <div className="field">
                <label className="field-label">{label}</label>
                <select
                    value={mapping[section][field]}
                    onChange={e => setMapping({
                        ...mapping,
                        [section]: { ...mapping[section], [field]: Number(e.target.value) }
                    })}
                >
                    <option value="-1">-- בחר עמודה --</option>
                    {options.map((h, idx) => (
                        <option key={idx} value={idx}>{h || `עמודה ${idx + 1}`}</option>
                    ))}
                </select>
            </div>
        );
    };

    return (
        <section className="card settings-manager">
            <div className="card-header-actions">
                <h2>הגדרות מיפוי עמודות</h2>
                <div className="month-selector">
                    <label>טען כותרות מחודש: </label>
                    <input type="month" value={month} onChange={e => setMonth(e.target.value)} />
                </div>
            </div>

            <p className="muted">בחר את העמודה המתאימה מתוך רשימת הכותרות שנסרקו מהגליון.</p>

            <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1.5rem' }}>
                <div className="settings-group">
                    <h3>עסקאות (Deals)</h3>
                    {renderSelect('deals', 'repName', 'שם נציג')}
                    {renderSelect('deals', 'dealAmount', 'סכום עסקה')}
                    {renderSelect('deals', 'bonus', 'בונוס מבוקש')}
                    {renderSelect('deals', 'dealId', 'מזהה עסקה (ID)')}
                    {renderSelect('deals', 'dealDate', 'תאריך עסקה')}
                </div>

                <div className="settings-group">
                    <h3>סיכום (Summary)</h3>
                    {renderSelect('summary', 'repName', 'שם נציג')}
                    {renderSelect('summary', 'totalSalesAmount', 'סך מכירות')}
                    {renderSelect('summary', 'bonusBaseRaw', 'בונוס גולמי (Bonus Base)')}
                    {renderSelect('summary', 'offsetAmount', 'קיזוז (Offset)')}
                    {renderSelect('summary', 'targetAmount', 'יעד מכירות')}
                </div>
            </div>

            <button className="button primary" onClick={handleSave} disabled={isSaving} style={{ marginTop: '2rem' }}>
                {isSaving ? 'שומר...' : 'שמור הגדרות מיפוי'}
            </button>
        </section>
    );
}
