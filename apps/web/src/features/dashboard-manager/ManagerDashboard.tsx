import { useEffect, useState } from 'react';
import { APIClient } from '../../api/client';
import { TierManager } from './TierManager';
import { UserManager } from './UserManager';
import { SettingsManager } from './SettingsManager';
import { BonusApprovalModal } from './BonusApprovalModal';

export function ManagerDashboard() {
  const [view, setView] = useState<'leaderboard' | 'tiers' | 'users' | 'settings'>('leaderboard');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [departmentSummary, setDepartmentSummary] = useState<any>(null);
  const [errors, setErrors] = useState<any[]>([]);
  const [month, setMonth] = useState('2024-03'); // Example default
  const [isLoading, setIsLoading] = useState(false);

  // Drill-down state
  const [selectedRep, setSelectedRep] = useState<any>(null);
  const [repDeals, setRepDeals] = useState<any[]>([]);
  const [isDealsLoading, setIsDealsLoading] = useState(false);

  // Modal state
  const [approvalDeal, setApprovalDeal] = useState<any>(null);

  useEffect(() => {
    if (view === 'leaderboard') {
      fetchData();
    }
  }, [view, month]);

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
      alert('סנכרון הופעל בהצלחה');
    } catch (err: any) {
      alert('סנכרון נכשל: ' + err.message);
    }
  };

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
            <input type="month" value={month} onChange={e => setMonth(e.target.value)} />
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
                    <h2>סיכום מחלקתי ({month})</h2>
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

                <section className="card kpi-card">
                  <h2>לוח נציגים ({month})</h2>
                  {isLoading ? <p>טוען...</p> : (
                    <table>
                      <thead>
                        <tr>
                          <th>דירוג</th>
                          <th>נציג</th>
                          <th>עסקאות</th>
                          <th>מכירות (ברוטו)</th>
                          <th>גבייה בפועל</th>
                          <th>קיזוזים</th>
                          <th>עמידה ביעד</th>
                          <th>ממוצע לעסקה</th>
                          <th>בונוס (נטו)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.map(r => (
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
                          <th>מספר עסקה / מפתח</th>
                          <th>סכום עסקה</th>
                          <th>בונוס מבוקש (שיטס)</th>
                          <th>אושר עד כה</th>
                          <th>נותר לאישור</th>
                          <th>סטטוס</th>
                          <th>פעולות</th>
                        </tr>
                      </thead>
                      <tbody>
                        {repDeals.length === 0 ? <tr><td colSpan={8} style={{ textAlign: 'center' }}>אין עסקאות לחודש זה</td></tr> : repDeals.map(d => (
                          <tr key={d.id}>
                            <td>{d.deal_date || '-'}</td>
                            <td><code>{d.deal_id || d.legacy_key}</code></td>
                            <td className="amount">₪{Number(d.deal_amount).toLocaleString()}</td>
                            <td className="amount">₪{Number(d.bonus_requested).toLocaleString()}</td>
                            <td className="amount">₪{Number(d.total_approved).toLocaleString()}</td>
                            <td className="amount highlight">₪{Number(d.remaining_eligible).toLocaleString()}</td>
                            <td>
                              <span className={`badge ${d.remaining_eligible === 0 ? 'fully-paid' : d.total_approved > 0 ? 'partial' : 'pending'}`}>
                                {d.remaining_eligible === 0 ? 'אושר במלואו' : d.total_approved > 0 ? 'חלקי' : 'ממתין'}
                              </span>
                            </td>
                            <td>
                              <button
                                className="button primary small"
                                disabled={d.remaining_eligible === 0}
                                onClick={() => setApprovalDeal(d)}
                              >
                                אישור
                              </button>
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

      {approvalDeal && (
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
      )}
    </div>
  );
}
