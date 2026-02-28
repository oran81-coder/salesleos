import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoginPage } from './features/auth/LoginPage';
import { ManagerDashboard } from './features/dashboard-manager/ManagerDashboard';
import { RepDashboard } from './features/dashboard-rep/RepDashboard';

export function App() {
  return (
    <div dir="rtl">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <Layout>
              <ManagerDashboard />
            </Layout>
          }
        />
        <Route
          path="/rep"
          element={
            <Layout>
              <RepDashboard />
            </Layout>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

