import { useEffect, useState } from 'react';
import { APIClient } from '../../api/client';

export function SettingsManager() {
    const DEFAULT_MAPPING = {
        deals: { dealDate: 0, isRenewal: 10, dealId: 2, repName: 3, customerName: 4, dealAmount: 5, bonus: 8, collectionAmount: 8 },
        summary: { repName: 13, totalSalesAmount: 14, bonusBaseRaw: 16, offsetAmount: 17, targetAmount: 14, totalCollectionAmount: 14, numberOfDeals: 14, averageDealSize: 14 }
    };
    const [mapping, setMapping] = useState<any>(DEFAULT_MAPPING);
    const [headers, setHeaders] = useState<{ deals: string[], summary: string[] }>({ deals: [], summary: [] });
    const [tabs, setTabs] = useState<string[]>([]);
    const [selectedTab, setSelectedTab] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<{ ok: boolean; message: string } | null>(null);

    useEffect(() => {
        // Load tabs list first, then settings
        (async () => {
            setIsLoading(true);
            try {
                const tabsRes = await APIClient.get<any>('/sync/tabs');
                const tabList: string[] = tabsRes?.data || [];
                setTabs(tabList);
                const latestTab = tabList[0] || '';
                setSelectedTab(latestTab);

                const settingsRes = await APIClient.get<any>('/sync/settings');
                if (settingsRes?.data) setMapping(settingsRes.data.mapping);

                if (latestTab) {
                    try {
                        const headersRes = await APIClient.get<any>(`/sync/headers?month=${encodeURIComponent(latestTab)}`);
                        if (headersRes?.data) setHeaders(headersRes.data);
                    } catch { setHeaders({ deals: [], summary: [] }); }
                }
            } catch (err) {
                console.error('Failed to load settings', err);
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    const handleTabChange = async (tab: string) => {
        setSelectedTab(tab);
        if (!tab) return;
        try {
            const headersRes = await APIClient.get<any>(`/sync/headers?month=${encodeURIComponent(tab)}`);
            if (headersRes?.data) setHeaders(headersRes.data);
        } catch { setHeaders({ deals: [], summary: [] }); }
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

    const handleSync = async () => {
        setIsSyncing(true);
        setSyncResult(null);
        try {
            await APIClient.post('/sync/trigger', { month: selectedTab });
            setSyncResult({ ok: true, message: `סנכרון עבור "${selectedTab}" הושלם בהצלחה` });
        } catch (err: any) {
            setSyncResult({ ok: false, message: `שגיאה בסנכרון: ${err.message}` });
        } finally {
            setIsSyncing(false);
        }
    };

    if (isLoading) return <div className="loading-state">טוען הגדרות וכותרות מהגליון...</div>;

    const renderSelect = (section: 'deals' | 'summary', field: string, label: string, optional = false) => {
        const options = section === 'deals' ? headers.deals : headers.summary;
        const currentVal = mapping[section]?.[field] ?? -1;
        return (
            <div className="field">
                <label className="field-label">
                    {label}
                    {optional && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginInlineStart: '0.4rem' }}>(אופציונלי)</span>}
                </label>
                <select
                    value={currentVal}
                    onChange={e => {
                        const val = Number(e.target.value);
                        const updated = { ...mapping[section] };
                        if (val === -1) {
                            delete updated[field];
                        } else {
                            updated[field] = val;
                        }
                        setMapping({ ...mapping, [section]: updated });
                    }}
                >
                    <option value="-1">{optional ? '-- לא ממופה --' : '-- בחר עמודה --'}</option>
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
                <div className="month-selector" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>לשונית גיליון לטעינת כותרות:</label>
                    <select
                        value={selectedTab}
                        onChange={e => handleTabChange(e.target.value)}
                        style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', minWidth: '200px' }}
                    >
                        {tabs.length === 0 && <option value="">טוען לשוניות...</option>}
                        {tabs.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>

            <p className="muted">בחר את העמודה המתאימה מתוך רשימת הכותרות שנסרקו מהגליון.</p>

            <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1.5rem' }}>
                <div className="settings-group">
                    <h3>עסקאות (Deals)</h3>
                    {renderSelect('deals', 'repName', 'שם נציג')}
                    {renderSelect('deals', 'customerName', 'שם עסק')}
                    {renderSelect('deals', 'dealAmount', 'סכום עסקה')}
                    {renderSelect('deals', 'bonus', 'בונוס מבוקש')}
                    {renderSelect('deals', 'dealId', 'מזהה עסקה (ID)')}
                    {renderSelect('deals', 'dealDate', 'תאריך עסקה')}
                    {renderSelect('deals', 'collectionAmount', 'סך גביה (בונוס בשיט)')}
                    {renderSelect('deals', 'isRenewal', 'חידוש / לקוח חדש', true)}
                    {renderSelect('deals', 'legacyKey', 'מפתח ישן (Legacy Key)', true)}
                </div>

                <div className="settings-group">
                    <h3>סיכום (Summary)</h3>
                    {renderSelect('summary', 'repName', 'שם נציג')}
                    {renderSelect('summary', 'totalSalesAmount', 'סך מכירות')}
                    {renderSelect('summary', 'bonusBaseRaw', 'בונוס גולמי (Bonus Base)')}
                    {renderSelect('summary', 'offsetAmount', 'קיזוז (Offset)')}
                    {renderSelect('summary', 'targetAmount', 'יעד מכירות')}
                    {renderSelect('summary', 'totalCollectionAmount', 'סך גביה בפועל', true)}
                    {renderSelect('summary', 'numberOfDeals', 'מספר עסקאות', true)}
                    {renderSelect('summary', 'averageDealSize', 'ממוצע עסקה', true)}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <button className="button primary" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'שומר...' : 'שמור הגדרות מיפוי'}
                </button>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', borderInlineStart: '1px solid var(--border)', paddingInlineStart: '1rem' }}>
                    <select
                        value={selectedTab}
                        onChange={e => setSelectedTab(e.target.value)}
                        style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', minWidth: '160px' }}
                    >
                        {tabs.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button
                        className="button"
                        onClick={handleSync}
                        disabled={isSyncing || !selectedTab}
                        style={{ background: 'var(--accent-green, #22c55e)', color: '#fff', border: 'none' }}
                    >
                        {isSyncing ? '⏳ מסנכרן...' : '🔄 הפעל סנכרון'}
                    </button>
                </div>
            </div>

            {syncResult && (
                <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    background: syncResult.ok ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                    color: syncResult.ok ? '#22c55e' : '#ef4444',
                    border: `1px solid ${syncResult.ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    fontSize: '0.9rem'
                }}>
                    {syncResult.ok ? '✅' : '❌'} {syncResult.message}
                </div>
            )}
        </section>
    );
}
