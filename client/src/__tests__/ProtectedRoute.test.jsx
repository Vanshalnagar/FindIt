import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import { renderWithProviders } from '../test/utils.jsx';

const tree = (adminOnly = false) => (
  <Routes>
    <Route path="/login" element={<div>Login page</div>} />
    <Route path="/" element={<div>Home page</div>} />
    <Route path="/secret" element={<ProtectedRoute adminOnly={adminOnly}><div>Secret content</div></ProtectedRoute>} />
  </Routes>
);

describe('ProtectedRoute', () => {
  it('redirects anonymous users to /login', () => {
    renderWithProviders(tree(), { route: '/secret' });
    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Secret content')).not.toBeInTheDocument();
  });

  it('shows a loading state while the session is checked', () => {
    renderWithProviders(tree(), { route: '/secret', loading: true });
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
  });

  it('renders children for authenticated users', () => {
    renderWithProviders(tree(), { route: '/secret', user: { id: '1', name: 'A', role: 'student' } });
    expect(screen.getByText('Secret content')).toBeInTheDocument();
  });

  it('blocks non-admins from admin routes', () => {
    renderWithProviders(tree(true), { route: '/secret', user: { id: '1', name: 'A', role: 'student' } });
    expect(screen.getByText('Home page')).toBeInTheDocument();
  });

  it('allows admins on admin routes', () => {
    renderWithProviders(tree(true), { route: '/secret', user: { id: '1', name: 'A', role: 'admin' } });
    expect(screen.getByText('Secret content')).toBeInTheDocument();
  });
});
