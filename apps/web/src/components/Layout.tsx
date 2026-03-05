import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo">Leos Media</div>
        <nav className="nav">
          <NavLink to="/" className="nav-item">
            דשבורד מנהל
          </NavLink>
          <NavLink to="/rep" className="nav-item">
            דשבורד נציג
          </NavLink>
        </nav>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="topbar-title">Sales Performance Panel</div>
        </header>
        <section className="content">{children}</section>
      </main>
    </div>
  );
}

