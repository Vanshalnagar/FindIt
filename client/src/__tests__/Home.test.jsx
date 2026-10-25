import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '../pages/Home.jsx';
import { api } from '../api/client.js';
import { renderWithProviders, sampleItem } from '../test/utils.jsx';

vi.mock('../api/client.js', () => ({ api: { listItems: vi.fn() } }));

const page = (items, extra = {}) => ({ items, page: 1, limit: 9, total: items.length, totalPages: 1, ...extra });

describe('Home', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches and renders listings', async () => {
    api.listItems.mockResolvedValue(page([sampleItem(), sampleItem({ id: 'i2', title: 'Red Umbrella' })]));
    renderWithProviders(<Home />);
    expect(screen.getByText('Loading listings...')).toBeInTheDocument();
    expect(await screen.findByText('Blue Backpack')).toBeInTheDocument();
    expect(screen.getByText('Red Umbrella')).toBeInTheDocument();
    expect(api.listItems).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 9 }));
  });

  it('shows empty state', async () => {
    api.listItems.mockResolvedValue(page([]));
    renderWithProviders(<Home />);
    expect(await screen.findByText('No items match your search')).toBeInTheDocument();
  });

  it('shows error state and retries', async () => {
    api.listItems.mockRejectedValueOnce(new Error('Boom')).mockResolvedValueOnce(page([sampleItem()]));
    renderWithProviders(<Home />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Boom');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Blue Backpack')).toBeInTheDocument();
  });

  it('refetches with the new filter when type changes', async () => {
    api.listItems.mockResolvedValue(page([sampleItem()]));
    renderWithProviders(<Home />);
    await screen.findByText('Blue Backpack');
    await userEvent.selectOptions(screen.getByLabelText('Type'), 'lost');
    await waitFor(() => expect(api.listItems).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'lost', page: 1 })));
  });

  it('searches on submit and paginates', async () => {
    api.listItems.mockResolvedValue(page([sampleItem()], { total: 20, totalPages: 3 }));
    renderWithProviders(<Home />);
    await screen.findByText('Blue Backpack');
    await userEvent.type(screen.getByLabelText('Search'), 'phone{enter}');
    await waitFor(() => expect(api.listItems).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'phone' })));
    await userEvent.click(await screen.findByRole('button', { name: 'Next' }));
    await waitFor(() => expect(api.listItems).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2, search: 'phone' })));
  });
});
