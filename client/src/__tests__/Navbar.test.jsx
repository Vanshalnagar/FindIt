import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from '../components/Navbar.jsx';
import { renderWithProviders } from '../test/utils.jsx';

describe('Navbar', () => {
  it('shows login and sign up for anonymous users', () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByRole('link', { name: 'Log in' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign up' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Dashboard' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Log out' })).not.toBeInTheDocument();
  });

  it('shows user links and logout for students, without Admin', () => {
    renderWithProviders(<Navbar />, { user: { id: '1', name: 'Sam', role: 'student' } });
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Report item' })).toBeInTheDocument();
    expect(screen.getByText('Hi, Sam')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument();
  });

  it('shows Admin link for admins', () => {
    renderWithProviders(<Navbar />, { user: { id: '1', name: 'Ann', role: 'admin' } });
    expect(screen.getByRole('link', { name: 'Admin' })).toBeInTheDocument();
  });

  it('calls logout when clicking Log out', async () => {
    const logout = vi.fn().mockResolvedValue();
    renderWithProviders(<Navbar />, { user: { id: '1', name: 'Sam', role: 'student' }, auth: { logout } });
    await userEvent.click(screen.getByRole('button', { name: 'Log out' }));
    await waitFor(() => expect(logout).toHaveBeenCalled());
  });

  it('hides auth links while loading', () => {
    renderWithProviders(<Navbar />, { loading: true });
    expect(screen.queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument();
  });
});
