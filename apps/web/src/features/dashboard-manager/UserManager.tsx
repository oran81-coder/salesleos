import { useEffect, useState } from 'react';
import { APIClient } from '../../api/client';

export function UserManager() {
    const [users, setUsers] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [formData, setFormData] = useState({
        full_name: '',
        sheet_name: '',
        email: '',
        role: 'rep',
        department_id: 1,
        password: 'password123'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [uRes, dRes] = await Promise.all([
                APIClient.get<any>('/users'),
                APIClient.get<any>('/users/departments')
            ]);
            setUsers(uRes.success ? uRes.data : []);
            setDepartments(dRes.success ? dRes.data : []);
        } catch (err) {
            console.error('Failed to fetch user data', err);
        }
    };

    const handleToggleStatus = async (user: any) => {
        try {
            await APIClient.patch(`/users/${user.id}/status`, { isActive: !user.is_active });
            fetchData();
        } catch (err: any) {
            alert('עדכון סטטוס נכשל');
        }
    };

    const startEdit = (user: any) => {
        setEditingUser(user);
        setFormData({
            full_name: user.full_name,
            sheet_name: user.sheet_name || '',
            email: user.email,
            role: user.role,
            department_id: user.department_id,
            password: '' // Don't show password on edit
        });
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingUser(null);
        setFormData({
            full_name: '',
            sheet_name: '',
            email: '',
            role: 'rep',
            department_id: departments[0]?.id || 1,
            password: 'password123'
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingUser) {
                await APIClient.patch(`/users/${editingUser.id}`, formData);
            } else {
                await APIClient.post('/users', formData);
            }
            closeForm();
            fetchData();
        } catch (err) {
            alert(editingUser ? 'עדכון משתמש נכשל' : 'הוספת משתמש נכשלה');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="card user-manager">
            <div className="card-header-actions">
                <h2>ניהול משתמשים</h2>
                <button className="button primary small" onClick={() => (showForm ? closeForm() : setShowForm(true))}>
                    {showForm ? 'ביטול' : 'משתמש חדש +'}
                </button>
            </div>

            {showForm && (
                <form className="user-form" onSubmit={handleSubmit}>
                    <h3>{editingUser ? `עריכת משתמש: ${editingUser.full_name}` : 'הוספת משתמש חדש'}</h3>
                    <div className="form-grid" style={{ marginBottom: '1rem' }}>
                        <div className="field">
                            <label className="field-label">שם מלא</label>
                            <input
                                type="text"
                                required
                                value={formData.full_name}
                                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                            />
                        </div>
                        <div className="field">
                            <label className="field-label">שם בגליון (Google Sheets)</label>
                            <input
                                type="text"
                                placeholder="למשל: Nancy"
                                value={formData.sheet_name}
                                onChange={e => setFormData({ ...formData, sheet_name: e.target.value })}
                            />
                        </div>
                        <div className="field">
                            <label className="field-label">אימייל</label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="field">
                            <label className="field-label">תפקיד</label>
                            <select
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="rep">נציג מכירות</option>
                                <option value="manager">מנהל</option>
                            </select>
                        </div>
                        <div className="field">
                            <label className="field-label">מחלקה</label>
                            <select
                                value={formData.department_id}
                                onChange={e => setFormData({ ...formData, department_id: Number(e.target.value) })}
                            >
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button type="submit" className="button primary" disabled={loading}>
                        {loading ? 'שומר...' : (editingUser ? 'עדכן משתמש' : 'צור משתמש')}
                    </button>
                </form>
            )}

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>שם מלא</th>
                            <th>שם בשיטס</th>
                            <th>אימייל</th>
                            <th>תפקיד</th>
                            <th>מחלקה</th>
                            <th>סטטוס</th>
                            <th>פעולות</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id}>
                                <td>{u.full_name}</td>
                                <td><code style={{ fontSize: '0.8rem', color: '#60a5fa' }}>{u.sheet_name || '-'}</code></td>
                                <td>{u.email}</td>
                                <td>
                                    <span className={`badge ${u.role}`}>
                                        {u.role === 'manager' ? 'מנהל' : 'נציג'}
                                    </span>
                                </td>
                                <td>{u.department_id === 1 ? 'מכירות' : u.department_id}</td>
                                <td>
                                    <span className={`status-dot ${u.is_active ? 'active' : 'inactive'}`}></span>
                                    {u.is_active ? 'פעיל' : 'לא פעיל'}
                                </td>
                                <td>
                                    <div className="action-buttons" style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="button secondary small" onClick={() => startEdit(u)}>
                                            ערוך
                                        </button>
                                        <button className="button secondary small outline" onClick={() => handleToggleStatus(u)}>
                                            {u.is_active ? 'השבת' : 'הפעל'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
