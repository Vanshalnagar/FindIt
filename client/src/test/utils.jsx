import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';

export function renderWithProviders(ui, { user = null, loading = false, route = '/', auth = {} } = {}) {
  const value = {
    user, loading,
    login: vi.fn(), register: vi.fn(), logout: vi.fn(),
    ...auth,
  };
  return {
    auth: value,
    ...render(
      <AuthContext.Provider value={value}>
        <MemoryRouter initialEntries={[route]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{ui}</MemoryRouter>
      </AuthContext.Provider>
    ),
  };
}

export const sampleItem = (over = {}) => ({
  id: 'i1', type: 'found', title: 'Blue Backpack', description: 'A blue backpack with a laptop inside.',
  category: 'bags', location: 'Library', date: '2026-01-10T00:00:00.000Z', imageUrl: null,
  status: 'open', hidden: false, owner: { id: 'u9', name: 'Olivia' }, createdAt: '2026-01-11T00:00:00.000Z',
  ...over,
});
