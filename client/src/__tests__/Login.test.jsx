import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../pages/Login.jsx';
import { renderWithProviders } from '../test/utils.jsx';

describe('Login', () => {
  it('shows validation errors and does not submit empty form', async () => {
    const { auth } = renderWithProviders(<Login />);
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('Password is required.')).toBeInTheDocument();
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('rejects malformed email', async () => {
    const { auth } = renderWithProviders(<Login />);
    await userEvent.type(screen.getByLabelText('Email'), 'nope');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('submits credentials', async () => {
    const login = vi.fn().mockResolvedValue({ id: '1' });
    renderWithProviders(<Login />, { auth: { login } });
    await userEvent.type(screen.getByLabelText('Email'), 'a@b.co');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));
    await waitFor(() => expect(login).toHaveBeenCalledWith('a@b.co', 'secret123'));
  });

  it('shows the server error on failure', async () => {
    const login = vi.fn().mockRejectedValue(new Error('Invalid email or password'));
    renderWithProviders(<Login />, { auth: { login } });
    await userEvent.type(screen.getByLabelText('Email'), 'a@b.co');
    await userEvent.type(screen.getByLabelText('Password'), 'wrongpass1');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
  });
});
