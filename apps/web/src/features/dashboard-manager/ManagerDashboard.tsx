import { useEffect, useState } from 'react';
import { APIClient } from '../../api/client';
import { TierManager } from './TierManager';
import { UserManager } from './UserManager';
import { SettingsManager } from './SettingsManager';
// import { BonusApprovalModal } from './BonusApprovalModal'; // Remove manual approval modal

export function ManagerDashboard() {
  const [view, setView] = useState<'leaderboard' | 'tiers' | 'users' | 'settings'>('leaderboard');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [departmentSummary, setDepartmentSummary] = useState<any>(null);
  const [errors, setErrors] = useState<any[]>([]);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [isLoading, setIsLoading] = useState(false);

  const [selectedRep, setSelectedRep] = useState<any>(null);
  const [repDeals, setRepDeals] = useState<any[]>([]);
  const [isDealsLoading, setIsDealsLoading] = useState(false);

  const [target, setTarget] = useState<number>(100000);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [newTarget, setNewTarget] = useState<string>('100000');

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({
    key: 'TotalSales',
    direction: 'desc'
  });

  // Modal state
  // const [approvalDeal, setApprovalDeal] = useState<any>(null); // Removed

  useEffect(() => {
    if (view === 'leaderboard') {
      fetchData();
      fetchMonthlyTarget();
    }
  }, [view, month]);

  const fetchMonthlyTarget = async () => {
    try {
      const res = await APIClient.get<{ target: number }>(`/kpis/monthly-target?month=${month}`);
      setTarget(res.data.target);
      setNewTarget(String(res.data.target));
    } catch (err) {
      console.error('Failed to fetch monthly target', err);
    }
  };

  const handleSaveTarget = async () => {
    try {
      const targetNum = Number(newTarget);
      if (isNaN(targetNum)) return;
      await APIClient.post('/kpis/monthly-target', { month, target: targetNum });
      setTarget(targetNum);
      setIsEditingTarget(false);
      // Refresh leaderboard to show new target achievements
      fetchData();
    } catch (err) {
      console.error('Failed to save monthly target', err);
      alert('שגיאה בעדכון היעד');
    }
  };

  const handlePrevMonth = () => {
    const [year, m] = month.split('-').map(Number);
    const date = new Date(year, m - 2, 1);
    setMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`);
  };

  const handleNextMonth = () => {
    const [year, m] = month.split('-').map(Number);
    const date = new Date(year, m, 1);
    setMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [lbRes, summaryRes, errRes] = await Promise.all([
        APIClient.get<any>(`/kpis/leaderboard?month=${month}`),
        APIClient.get<any>(`/kpis/department-summary?month=${month}`),
        APIClient.get<any>('/sync/errors')
      ]);
      setLeaderboard(lbRes.data || []);
      setDepartmentSummary(summaryRes.data || null);
      setErrors(errRes.data || []);
    } catch (err) {
      console.error('Failed to fetch manager data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRepDeals = async (rep: any) => {
    setSelectedRep(rep);
    setIsDealsLoading(true);
    try {
      const res = await APIClient.get<any>(`/bonuses/deals?month=${month}&repId=${rep.repId}`);
      setRepDeals(res.data || []);
    } catch (err) {
      console.error('Failed to fetch rep deals', err);
    } finally {
      setIsDealsLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      await APIClient.post('/sync/trigger', { month });
      alert(`סנכרון עבור ${month} הופעל בהצלחה`);
      fetchData();
    } catch (err: any) {
      alert('סנכרון נכשל: ' + err.message);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setIsLoading(true);
      const blob = await APIClient.getBlob(`/kpis/accounting-report?month=${month}`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `accounting_report_${month}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Failed to generate report', err);
      alert('הפקת דוח נכשלה: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;

    let aVal = a[key];
    let bVal = b[key];

    // Handle numeric values
    if (typeof aVal === 'string' && !isNaN(parseFloat(aVal))) aVal = parseFloat(aVal);
    if (typeof bVal === 'string' && !isNaN(parseFloat(bVal))) bVal = parseFloat(bVal);

    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>דשבורד מנהל</h1>
        <div className="header-nav">
          <button className={`button ${view === 'leaderboard' ? 'primary' : 'secondary'}`} onClick={() => { setView('leaderboard'); setSelectedRep(null); }}>לוח נציגים</button>
          <button className={`button ${view === 'tiers' ? 'primary' : 'secondary'}`} onClick={() => setView('tiers')}>ניהול עמלות</button>
          <button className={`button ${view === 'users' ? 'primary' : 'secondary'}`} onClick={() => setView('users')}>ניהול משתמשים</button>
          <button className={`button ${view === 'settings' ? 'primary' : 'secondary'}`} onClick={() => setView('settings')}>הגדרות מיפוי</button>
        </div>
        {view === 'leaderboard' && !selectedRep && (
          <div className="header-actions">
            <div className="month-selector" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <button className="button secondary small" onClick={handlePrevMonth} style={{ padding: '4px 10px', minWidth: 'auto' }} title="חודש קודם">&lt;</button>
              <input
                type="month"
                value={month.slice(0, 7)}
                onChange={e => setMonth(e.target.value + '-01')}
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', padding: '0 4px' }}
              />
              <button className="button secondary small" onClick={handleNextMonth} style={{ padding: '4px 10px', minWidth: 'auto' }} title="חודש הבא">&gt;</button>
            </div>
            <button className="button primary" onClick={handleGenerateReport} disabled={isLoading}>הפק דוח חודשי</button>
            <button className="button secondary" onClick={handleSync}>סנכרן עכשיו</button>
          </div>
        )}
        {selectedRep && (
          <div className="header-actions">
            <button className="button secondary small" onClick={() => setSelectedRep(null)}>&larr; חזרה ללוח</button>
          </div>
        )}
      </div>

      <div className="dashboard-grid">
        {view === 'leaderboard' ? (
          <>
            {!selectedRep ? (
              <>
                <div className="dashboard-top-row">
                  <section className="card kpi-card dept-summary">
                    <h2>סיכום מחלקתי ({month.slice(0, 7)})</h2>
                    {departmentSummary ? (
                      <div className="dept-stats-grid">
                        <div className="dept-stat-item">
                          <label>כמות עסקאות</label>
                          <div className="value">{departmentSummary.totalDeals}</div>
                        </div>
                        <div className="dept-stat-item">
                          <label>סכום גבייה מעודכן</label>
                          <div className="value collection">₪{departmentSummary.totalCollection.toLocaleString()}</div>
                        </div>
                        <div className="dept-stat-item">
                          <label>סך קיזוזים</label>
                          <div className="value offset">₪{departmentSummary.totalOffset.toLocaleString()}</div>
                        </div>
                        <div className="dept-stat-item">
                          <label>סכום מכירות</label>
                          <div className="value">₪{departmentSummary.totalSales.toLocaleString()}</div>
                        </div>
                        <div className="dept-stat-item new-vs-renewal-mini">
                          <label>חדשים מול חידושים</label>
                          <div className="split-info">
                            <span>חדשים: {departmentSummary.newDeals}</span>
                            <span className="separator">|</span>
                            <span>חידושים: {departmentSummary.renewals}</span>
                          </div>
                          <div className="split-bar-mini">
                            <div className="segment new" style={{ width: `${(departmentSummary.newDeals / (departmentSummary.totalDeals || 1)) * 100}%` }}></div>
                            <div className="segment renewal" style={{ width: `${(departmentSummary.renewals / (departmentSummary.totalDeals || 1)) * 100}%` }}></div>
                          </div>
                        </div>
                      </div>
                    ) : <p>טוען נתונים...</p>}
                  </section>

                  <section className="card kpi-card sync-errors">
                    <h2>שגיאות סנכרון</h2>
                    <div className="scroll-area">
                      {errors.length === 0 ? <p>אין שגיאות</p> : errors.map(e => (
                        <div key={e.id} className="error-item">
                          <strong>{e.sheet_tab_name} (שורה {e.sheet_row_number})</strong>: {e.error_message}
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="target-management-bar card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>יעד מחלקתי ({month.slice(0, 7)}):</span>
                    {isEditingTarget ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="number"
                          value={newTarget}
                          onChange={(e) => setNewTarget(e.target.value)}
                          className="input-field"
                          style={{ width: '120px', padding: '0.4rem', border: '1px solid #444', background: '#1a1a1a', color: '#fff', borderRadius: '4px' }}
                        />
                        <button onClick={handleSaveTarget} className="button primary small" style={{ padding: '0.4rem 1rem' }}>שמור</button>
                        <button onClick={() => { setIsEditingTarget(false); setNewTarget(String(target)); }} className="button secondary small" style={{ padding: '0.4rem 1rem' }}>ביטול</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <span style={{ fontSize: '1.2rem', color: '#00d4ff', fontWeight: 700 }}>₪{target.toLocaleString()}</span>
                        <button onClick={() => setIsEditingTarget(true)} className="button secondary small" style={{ padding: '0.2rem 0.8rem', fontSize: '0.85rem' }}>ערוך יעד</button>
                      </div>
                    )}
                  </div>
                  <div style={{ opacity: 0.7, fontSize: '0.9rem' }}>
                    * היעד משפיע על חישוב אחוזי העמידה ביעד של כל הנציגים
                  </div>
                </div>

                <section className="card kpi-card">
                  <h2>לוח נציגים ({month})</h2>
                  {isLoading ? <p>טוען...</p> : (
                    <table>
                      <thead>
                        <tr>
                          <th className={`sortable-header ${sortConfig?.key === 'rank' ? `sort-${sortConfig.direction}` : ''}`} onClick={() => requestSort('rank')}>דירוג</th>
                          <th className={`sortable-header ${sortConfig?.key === 'repName' ? `sort-${sortConfig.direction}` : ''}`} onClick={() => requestSort('repName')}>נציג</th>
                          <th className={`sortable-header ${sortConfig?.key === 'DealsCount' ? `sort-${sortConfig.direction}` : ''}`} onClick={() => requestSort('DealsCount')}>עסקאות</th>
                          <th className={`sortable-header ${sortConfig?.key === 'TotalSales' ? `sort-${sortConfig.direction}` : ''}`} onClick={() => requestSort('TotalSales')}>מכירות (ברוטו)</th>
                          <th className={`sortable-header ${sortConfig?.key === 'ActualCollection' ? `sort-${sortConfig.direction}` : ''}`} onClick={() => requestSort('ActualCollection')}>גבייה בפועל</th>
                          <th className={`sortable-header ${sortConfig?.key === 'Offset' ? `sort-${sortConfig.direction}` : ''}`} onClick={() => requestSort('Offset')}>קיזוזים</th>
                          <th className={`sortable-header ${sortConfig?.key === 'TargetAchievement' ? `sort-${sortConfig.direction}` : ''}`} onClick={() => requestSort('TargetAchievement')}>עמידה ביעד</th>
                          <th className={`sortable-header ${sortConfig?.key === 'AvgDealSize' ? `sort-${sortConfig.direction}` : ''}`} onClick={() => requestSort('AvgDealSize')}>ממוצע לעסקה</th>
                          <th className={`sortable-header ${sortConfig?.key === 'FinalBonusPayout' ? `sort-${sortConfig.direction}` : ''}`} onClick={() => requestSort('FinalBonusPayout')}>בונוס (נטו)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedLeaderboard.map(r => (
                          <tr key={r.repId} className="hoverable" onClick={() => fetchRepDeals(r)} style={{ cursor: 'pointer' }}>
                            <td>
                              <span className={`rank-badge rank-${r.rank}`}>
                                {r.rank}
                              </span>
                            </td>
                            <td className="rep-name">{r.repName}</td>
                            <td>{r.DealsCount}</td>
                            <td className="amount">₪{Number(r.TotalSales).toLocaleString()}</td>
                            <td className="amount collection">₪{Number(r.ActualCollection).toLocaleString()}</td>
                            <td className="amount offset">₪{Number(r.Offset).toLocaleString()}</td>
                            <td>
                              <div className="achievement-cell">
                                <div className="progress-bar">
                                  <div className="progress-fill" style={{ width: `${Math.min(r.TargetAchievement, 100)}%` }}></div>
                                </div>
                                <span className="percent">{Math.round(r.TargetAchievement)}%</span>
                              </div>
                            </td>
                            <td className="amount">₪{Math.round(Number(r.AvgDealSize)).toLocaleString()}</td>
                            <td className="payout">₪{Math.round(Number(r.FinalBonusPayout)).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </section>
              </>
            ) : (
              <section className="card kpi-card drill-down">
                <div className="drill-down-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div>
                    <h2>פירוט עסקאות: {selectedRep.repName}</h2>
                    <p className="subtitle">חודש {month}</p>
                  </div>
                  <div className="rep-summary-mini" style={{ display: 'flex', gap: '2rem' }}>
                    <div className="stat">
                      <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7 }}>סה"כ מכירות</label>
                      <strong>₪{Number(selectedRep.TotalSales).toLocaleString()}</strong>
                    </div>
                    <div className="stat">
                      <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7 }}>סך גבייה</label>
                      <strong className="collection">₪{Number(selectedRep.ActualCollection).toLocaleString()}</strong>
                    </div>
                    <div className="stat">
                      <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7 }}>בונוס מחושב</label>
                      <strong className="payout">₪{Number(selectedRep.FinalBonusPayout).toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                {isDealsLoading ? <p>טוען עסקאות...</p> : (
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>תאריך</th>
                          <th>שם עסק</th>
                          <th>מספר עסקה / מפתח</th>
                          <th>סכום עסקה</th>
                          <th>בונוס מבוקש (שיטס)</th>
                          <th>סטטוס גבייה</th>
                        </tr>
                      </thead>
                      <tbody>
                        {repDeals.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center' }}>אין עסקאות לחודש זה</td></tr> : repDeals.map(d => (
                          <tr key={d.id}>
                            <td>{d.deal_date ? new Date(d.deal_date).toLocaleDateString('he-IL') : '-'}</td>
                            <td className="customer-name"><strong>{d.customer_name || 'לא צוין'}</strong></td>
                            <td><code>{d.deal_id || d.legacy_key || '-'}</code></td>
                            <td className="amount">₪{Number(d.deal_amount).toLocaleString()}</td>
                            <td className="amount payout">₪{Number(d.bonus_requested).toLocaleString()}</td>
                            <td>
                              <div className="collection-status-cell">
                                <span className={`badge ${d.is_completed ? 'fully-paid' : 'partial'}`}>
                                  {d.is_completed ? 'גבייה מלאה' : 'גבייה חלקית'}
                                </span>
                                <div className="status-label-mini">{d.status_label}</div>
                                <div className="progress-bar-mini">
                                  <div
                                    className="progress-fill"
                                    style={{ width: `${Math.min((d.total_paid / (d.deal_amount || 1)) * 100, 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
          </>
        ) : view === 'tiers' ? (
          <TierManager />
        ) : view === 'users' ? (
          <UserManager />
        ) : (
          <SettingsManager />
        )}
      </div>

      {/* {approvalDeal && (
        <BonusApprovalModal
          deal={approvalDeal}
          month={month}
          onClose={() => setApprovalDeal(null)}
          onSuccess={() => {
            setApprovalDeal(null);
            fetchRepDeals(selectedRep);
            fetchData(); // Refresh summary values on leaderboard too
          }}
        />
      )} */}
    </div >
  );
}
