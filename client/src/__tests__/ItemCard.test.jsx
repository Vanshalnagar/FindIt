import { screen } from '@testing-library/react';
import ItemCard from '../components/ItemCard.jsx';
import { renderWithProviders, sampleItem } from '../test/utils.jsx';

describe('ItemCard', () => {
  it('renders item details and links to the detail page', () => {
    renderWithProviders(<ItemCard item={sampleItem()} />);
    expect(screen.getByText('Blue Backpack')).toBeInTheDocument();
    expect(screen.getByText('Library')).toBeInTheDocument();
    expect(screen.getByText('Bags')).toBeInTheDocument();
    expect(screen.getByText('found')).toBeInTheDocument();
    expect(screen.getByText('open')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/items/i1');
  });

  it('shows the image when present', () => {
    const { container } = renderWithProviders(<ItemCard item={sampleItem({ imageUrl: '/uploads/a.png' })} />);
    expect(container.querySelector('img')).toHaveAttribute('src', '/uploads/a.png');
  });

  it('shows hidden badge for hidden items', () => {
    renderWithProviders(<ItemCard item={sampleItem({ hidden: true, type: 'lost' })} />);
    expect(screen.getByText('hidden')).toBeInTheDocument();
    expect(screen.getByText('lost')).toBeInTheDocument();
  });
});
