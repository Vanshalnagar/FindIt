import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClaimForm from '../components/ClaimForm.jsx';
import { api, ApiError } from '../api/client.js';

vi.mock('../api/client.js', async () => {
  const actual = await vi.importActual('../api/client.js');
  return { ...actual, api: { createClaim: vi.fn() } };
});

describe('ClaimForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('validates lengths before calling the API', async () => {
    render(<ClaimForm itemId="i1" />);
    await userEvent.type(screen.getByLabelText('Message to the finder'), 'short');
    await userEvent.click(screen.getByRole('button', { name: 'Submit claim' }));
    expect(screen.getByText('Message must be 10-500 characters.')).toBeInTheDocument();
    expect(screen.getByText('Proof must be 10-1000 characters.')).toBeInTheDocument();
    expect(api.createClaim).not.toHaveBeenCalled();
  });

  it('submits message and proof and notifies parent', async () => {
    const onSubmitted = vi.fn();
    api.createClaim.mockResolvedValue({ claim: { id: 'c1' } });
    render(<ClaimForm itemId="i1" onSubmitted={onSubmitted} />);
    await userEvent.type(screen.getByLabelText('Message to the finder'), 'This is my backpack, thanks!');
    await userEvent.type(screen.getByLabelText(/Proof of ownership/), 'Has a sticker of a cat inside.');
    await userEvent.click(screen.getByRole('button', { name: 'Submit claim' }));
    await waitFor(() => expect(api.createClaim).toHaveBeenCalledWith('i1', {
      message: 'This is my backpack, thanks!', proof: 'Has a sticker of a cat inside.',
    }));
    expect(onSubmitted).toHaveBeenCalledWith({ id: 'c1' });
  });

  it('shows server errors such as duplicate claims', async () => {
    api.createClaim.mockRejectedValue(new ApiError('You already claimed this item', 409));
    render(<ClaimForm itemId="i1" />);
    await userEvent.type(screen.getByLabelText('Message to the finder'), 'This is my backpack, thanks!');
    await userEvent.type(screen.getByLabelText(/Proof of ownership/), 'Has a sticker of a cat inside.');
    await userEvent.click(screen.getByRole('button', { name: 'Submit claim' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('You already claimed this item');
  });
});
