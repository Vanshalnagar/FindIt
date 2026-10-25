export const CATEGORIES = [
  { value: 'electronics', label: 'Electronics' },
  { value: 'books', label: 'Books' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'id-cards', label: 'ID cards' },
  { value: 'keys', label: 'Keys' },
  { value: 'bags', label: 'Bags' },
  { value: 'other', label: 'Other' },
];
export const STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];
export const categoryLabel = (v) => CATEGORIES.find((c) => c.value === v)?.label || v;
export const formatDate = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? '' : dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};
