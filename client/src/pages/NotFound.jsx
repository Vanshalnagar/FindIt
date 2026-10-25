import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <p className="text-5xl font-extrabold text-brand-600">404</p>
      <h1 className="mt-2 text-xl font-semibold text-slate-900">Page not found</h1>
      <p className="mt-1 text-slate-600">The page you are looking for does not exist.</p>
      <Link to="/" className="btn-primary mt-5">Back to home</Link>
    </div>
  );
}
