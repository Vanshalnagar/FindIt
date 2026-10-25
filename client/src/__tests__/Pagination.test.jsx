import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pagination from '../components/Pagination.jsx';

describe('Pagination', () => {
  it('renders nothing for a single page', () => {
    const { container } = render(<Pagination page={1} totalPages={1} onPageChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('disables Previous on first page and Next on last page', () => {
    const { rerender } = render(<Pagination page={1} totalPages={3} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
    rerender(<Pagination page={3} totalPages={3} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('calls onPageChange for next, previous and numbered pages', async () => {
    const fn = vi.fn();
    render(<Pagination page={2} totalPages={3} onPageChange={fn} />);
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(fn).toHaveBeenLastCalledWith(3);
    await userEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(fn).toHaveBeenLastCalledWith(1);
    await userEvent.click(screen.getByRole('button', { name: 'Page 3' }));
    expect(fn).toHaveBeenLastCalledWith(3);
  });

  it('marks the current page', () => {
    render(<Pagination page={2} totalPages={3} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
  });
});
