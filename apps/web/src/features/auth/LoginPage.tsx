import { useState } from 'react';
import { APIClient } from '../../api/client';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await APIClient.post<any>('/auth/login', { email, password });
      if (response.success) {
        APIClient.setToken(response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        window.location.href = response.user.role === 'manager' ? '/' : '/rep';
      }
    } catch (err: any) {
      alert(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <form className="card" onSubmit={handleSubmit}>
        <h1 className="card-title">כניסה למערכת</h1>
        <label className="field">
          <span className="field-label">אימייל</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span className="field-label">סיסמה</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button className="button primary" type="submit" disabled={isLoading}>
          {isLoading ? 'מתחבר…' : 'כניסה'}
        </button>
      </form>
    </div>
  );
}

