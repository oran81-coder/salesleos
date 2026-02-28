import { useEffect, useState } from 'react';
import { APIClient } from '../../api/client';

export function RepDashboard() {
  const [data, setData] = useState<any>(null);
  const [rankings, setRankings] = useState<any>(null);
  const [deals, setDeals] = useState<any[]>([]);
  const [month, setMonth] = useState('2024-03');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchRepData();
  }, [month]);

  const fetchRepData = async () => {
    setIsLoading(true);
    try {
      // In development/mock mode, we use the hardcoded repId 1
      const [bonusRes, rankRes, dealsRes] = await Promise.all([
        APIClient.get<any>(`/bonuses/monthly?month=${month}&repId=1`),
        APIClient.get<any>(`/kpis/rep-rankings?month=${month}&repId=1`),
        APIClient.get<any>(`/bonuses/deals?month=${month}&repId=1`)
      ]);
      setData(bonusRes.data);
      setRankings(rankRes.data);
      setDeals(dealsRes.data || []);
    } catch (err) {
      console.error('Failed to fetch rep data', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="dashboard">טוען...</div>;

  return (
    <div className="dashboard rep-view">
      <div className="dashboard-header">
        <h1>הדשבורד שלי</h1>
        <div className="header-actions">
          <input type="month" value={month} onChange={e => setMonth(e.target.value)} />
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="card kpi-card main-stats">
          <h2>סיכום ביצועים ({month})</h2>
          {data ? (
            <div className="kpi-grid">
              <div className="stat-box">
                <label>מכירות ברוטו</label>
                <div className="value">₪{Number(data.summary.total_sales_amount).toLocaleString()}</div>
                {rankings && (
                  <div className={`vs-avg ${data.summary.total_sales_amount >= rankings.averages.sales ? 'above' : 'below'}`}>
                    <span>{data.summary.total_sales_amount >= rankings.averages.sales ? '▲' : '▼'}</span>
                    מול ממוצע: ₪{Math.round(rankings.averages.sales).toLocaleString()}
                  </div>
                )}
              </div>
              <div className="stat-box collection">
                <label>גבייה בפועל</label>
                <div className="value">₪{Number(data.summary.total_collection_amount || 0).toLocaleString()}</div>
              </div>
              <div className="stat-box offset">
                <label>קיזוזים</label>
                <div className="value">₪{Number(data.summary.offset_amount || 0).toLocaleString()}</div>
              </div>
              <div className="stat-box payout">
                <label>בונוס נטו לתשלום</label>
                <div className="value highlight">₪{Math.round(data.payout).toLocaleString()}</div>
                {rankings && (
                  <div className={`vs-avg ${rankings.personal.bonus >= rankings.averages.bonus ? 'above' : 'below'}`}>
                    <span>{rankings.personal.bonus >= rankings.averages.bonus ? '▲' : '▼'}</span>
                    מול ממוצע: ₪{Math.round(rankings.averages.bonus).toLocaleString()}
                  </div>
                )}
              </div>
              <div className="stat-box tier">
                <label>אחוז עמלה</label>
                <div className="value">{(data.tier.percent * 100).toFixed(1)}%</div>
              </div>
            </div>
          ) : <p className="no-data">אין נתונים לחודש זה</p>}
        </section>

        <div className="dashboard-metrics-row">
          <section className="card kpi-card benchmarks-section">
            <h2>מדדי ביצוע מול ממוצע מחלקתי</h2>
            {rankings ? (
              <div className="benchmarks-container">
                <div className="benchmark-item">
                  <div className="benchmark-info">
                    <span className="label">סכום מכירות ממוצע</span>
                    <span className="values">
                      <span className="current">₪{rankings.personal.sales.toLocaleString()}</span>
                      <span className="separator">/</span>
                      <span className="avg">ממוצע: ₪{Math.round(rankings.averages.sales).toLocaleString()}</span>
                    </span>
                  </div>
                  <div className="progress-bar-wrapper">
                    <div className="progress-bar">
                      <div className="progress-fill sales" style={{ width: `${Math.min((rankings.personal.sales / (rankings.averages.sales || 1)) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="benchmark-item">
                  <div className="benchmark-info">
                    <span className="label">סכום גבייה ממוצע</span>
                    <span className="values">
                      <span className="current">₪{rankings.personal.collection.toLocaleString()}</span>
                      <span className="separator">/</span>
                      <span className="avg">ממוצע: ₪{Math.round(rankings.averages.collection).toLocaleString()}</span>
                    </span>
                  </div>
                  <div className="progress-bar-wrapper">
                    <div className="progress-bar">
                      <div className="progress-fill collection" style={{ width: `${Math.min((rankings.personal.collection / (rankings.averages.collection || 1)) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="benchmark-item">
                  <div className="benchmark-info">
                    <span className="label">כמות עסקאות ממוצע</span>
                    <span className="values">
                      <span className="current">{rankings.personal.deals}</span>
                      <span className="separator">/</span>
                      <span className="avg">ממוצע: {rankings.averages.deals.toFixed(1)}</span>
                    </span>
                  </div>
                  <div className="progress-bar-wrapper">
                    <div className="progress-bar">
                      <div className="progress-fill deals" style={{ width: `${Math.min((rankings.personal.deals / (rankings.averages.deals || 1)) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="benchmark-item new-vs-renewal">
                  <div className="benchmark-info">
                    <span className="label">חדשים מול חידושים</span>
                    <span className="values">
                      <span className="current">{rankings.personal.newDeals + rankings.personal.renewals}</span>
                    </span>
                  </div>
                  <div className="split-labels">
                    <span className="new">{rankings.personal.newDeals} חדשים</span>
                    <span className="renewal">{rankings.personal.renewals} חידושים</span>
                  </div>
                  <div className="split-bar">
                    <div className="segment new" style={{ width: `${(rankings.personal.newDeals / ((rankings.personal.newDeals + rankings.personal.renewals) || 1)) * 100}%` }}></div>
                    <div className="segment renewal" style={{ width: `${(rankings.personal.renewals / ((rankings.personal.newDeals + rankings.personal.renewals) || 1)) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            ) : <p className="no-data">אין נתונים זמינים</p>}
          </section>

          <section className="card kpi-card rankings-section">
            <h2 className="section-title">דירוג יחסי במחלקה</h2>
            {rankings ? (
              <div className="percentile-grid">
                <div className="percentile-item">
                  <label className="tooltip-container">
                    דירוג מכירות
                    <span className="tooltip-icon">i</span>
                    <span className="tooltip-text">
                      <strong>דירוג מכירות (אחוזון):</strong><br />
                      מדד זה משווה את סך המכירות ברוטו שלך לשאר הנציגים הפעילים במחלקה. אחוזון של 67% אומר שמכרת יותר מ-67% מהנציגים במחלקה באותו חודש.
                    </span>
                  </label>
                  <div className="circle-progress">
                    <svg viewBox="0 0 36 36">
                      <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className="circle" strokeDasharray={`${rankings.salesPercentile}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <text x="18" y="20.35" className="percentage">{rankings.salesPercentile}%</text>
                    </svg>
                  </div>
                </div>
                <div className="percentile-item">
                  <label className="tooltip-container">
                    דירוג בונוסים
                    <span className="tooltip-icon">i</span>
                    <span className="tooltip-text">
                      <strong>דירוג בונוסים (אחוזון):</strong><br />
                      מדד זה משווה את הבונוס נטו שלך (אחרי קיזוזים) לשאר המחלקה. הוא משקף את המיקום שלך מבחינת רווח סופי (כמה אנשים הרוויחו פחות ממך).
                    </span>
                  </label>
                  <div className="circle-progress">
                    <svg viewBox="0 0 36 36">
                      <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className="circle" strokeDasharray={`${rankings.bonusPercentile}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <text x="18" y="20.35" className="percentage">{rankings.bonusPercentile}%</text>
                    </svg>
                  </div>
                </div>
              </div>
            ) : <p className="no-data">אין דירוג זמין</p>}
          </section>
        </div>

        <section className="card kpi-card full-width">
          <h2>פירוט עסקאות מזכות ({month})</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>תאריך</th>
                  <th>מספר עסקה / מפתח</th>
                  <th>סכום עסקה</th>
                  <th>בונוס מבוקש (שיטס)</th>
                  <th>אושר שולם</th>
                  <th>סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {deals.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center' }}>אין עסקאות לחודש זה</td></tr> : deals.map(d => (
                  <tr key={d.id}>
                    <td>{d.deal_date || '-'}</td>
                    <td><code>{d.deal_id || d.legacy_key}</code></td>
                    <td className="amount">₪{Number(d.deal_amount).toLocaleString()}</td>
                    <td className="amount">₪{Number(d.bonus_requested).toLocaleString()}</td>
                    <td className="amount payout">₪{Number(d.total_approved).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${d.remaining_eligible === 0 ? 'fully-paid' : d.total_approved > 0 ? 'partial' : 'pending'}`}>
                        {d.remaining_eligible === 0 ? 'אושר במלואו' : d.total_approved > 0 ? 'חלקי' : 'ממתין'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
