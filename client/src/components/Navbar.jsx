import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const linkClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-brand-100 text-brand-800' : 'text-slate-600 hover:bg-slate-100'}`;

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const onLogout = async () => {
    close();
    try { await logout(); } catch { /* session cleared regardless */ }
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="text-xl font-extrabold tracking-tight text-brand-700" onClick={close}>
          Find<span className="text-slate-900">It</span>
        </Link>
        <button
          type="button"
          className="btn-secondary btn-sm md:hidden"
          aria-expanded={open}
          aria-controls="main-nav"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? 'Close' : 'Menu'}
        </button>
        <nav
          id="main-nav"
          aria-label="Main"
          className={`${open ? 'flex' : 'hidden'} absolute left-0 right-0 top-full flex-col gap-1 border-b border-slate-200 bg-white p-4 md:static md:flex md:flex-row md:items-center md:border-0 md:bg-transparent md:p-0`}
        >
          <NavLink to="/" end className={linkClass} onClick={close}>Browse</NavLink>
          {!loading && user && (
            <>
              <NavLink to="/items/new" className={linkClass} onClick={close}>Report item</NavLink>
              <NavLink to="/dashboard" className={linkClass} onClick={close}>Dashboard</NavLink>
              {user.role === 'admin' && <NavLink to="/admin" className={linkClass} onClick={close}>Admin</NavLink>}
              <span className="px-3 py-2 text-sm text-slate-500">Hi, {user.name}</span>
              <button type="button" className="btn-secondary btn-sm" onClick={onLogout}>Log out</button>
            </>
          )}
          {!loading && !user && (
            <>
              <NavLink to="/login" className={linkClass} onClick={close}>Log in</NavLink>
              <Link to="/register" className="btn-primary btn-sm" onClick={close}>Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
