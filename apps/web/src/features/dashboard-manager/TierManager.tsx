import { useEffect, useState } from 'react';
import { APIClient } from '../../api/client';

export function TierManager() {
    const [tiers, setTiers] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchTiers();
    }, []);

    const fetchTiers = async () => {
        try {
            const res = await APIClient.get<any>('/tiers');
            setTiers(res.data || []);
        } catch (err) {
            console.error('Failed to fetch tiers', err);
        }
    };

    const handleLevelChange = (index: number, field: string, value: any) => {
        const newTiers = [...tiers];
        newTiers[index] = { ...newTiers[index], [field]: value };
        setTiers(newTiers);
    };

    const addTier = () => {
        const lastTier = tiers[tiers.length - 1];
        setTiers([...tiers, {
            level: tiers.length + 1,
            from: lastTier ? lastTier.to : 0,
            to: null,
            percent: 0
        }]);
    };

    const removeTier = (index: number) => {
        setTiers(tiers.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            await APIClient.post('/tiers/version', {
                effectiveFrom: today,
                tiers: tiers.map(t => ({
                    level: t.level,
                    from: Number(t.from),
                    to: t.to === null || t.to === '' ? null : Number(t.to),
                    percent: Number(t.percent)
                }))
            });
            alert('גרסה חדשה נשמרה בהצלחה');
        } catch (err: any) {
            alert('שמירה נכשלה: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <section className="card tier-manager">
            <h2>ניהול מדרגות עמלה</h2>
            <div className="tier-header-actions">
                <button className="button primary" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'שומר...' : 'שמור כגרסה חדשה'}
                </button>
            </div>

            <table className="tier-table">
                <thead>
                    <tr>
                        <th>רמה</th>
                        <th>מ‑(₪)</th>
                        <th>עד‑(₪)</th>
                        <th>אחוז עמלה</th>
                        <th>פעולות</th>
                    </tr>
                </thead>
                <tbody>
                    {tiers.map((t, i) => (
                        <tr key={i}>
                            <td>{t.level}</td>
                            <td>
                                <input type="number" value={t.from} onChange={e => handleLevelChange(i, 'from', e.target.value)} />
                            </td>
                            <td>
                                <input type="number" value={t.to || ''} placeholder="ללא הגבלה" onChange={e => handleLevelChange(i, 'to', e.target.value)} />
                            </td>
                            <td>
                                <input type="number" step="0.001" value={t.percent} onChange={e => handleLevelChange(i, 'percent', e.target.value)} />
                            </td>
                            <td>
                                <button className="button danger small" onClick={() => removeTier(i)}>מחק</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button className="button secondary" onClick={addTier}>+ הוסף מדרגה</button>
        </section>
    );
}
