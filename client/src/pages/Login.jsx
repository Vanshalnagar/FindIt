import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';
  if (user) return <Navigate to={from} replace />;

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!EMAIL_RE.test(email.trim())) errs.email = 'Enter a valid email address.';
    if (!password) errs.password = 'Password is required.';
    setErrors(errs);
    setFormError('');
    if (Object.keys(errs).length) return;
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setFormError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-2xl font-bold text-slate-900">Log in</h1>
      <form onSubmit={submit} noValidate className="card grid gap-4 p-6">
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" autoComplete="email" className={`input ${errors.email ? 'input-error' : ''}`} value={email} onChange={(e) => setEmail(e.target.value)}
            aria-invalid={errors.email ? 'true' : undefined} aria-describedby={errors.email ? 'email-err' : undefined} />
          {errors.email && <p id="email-err" className="field-error">{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input id="password" type="password" autoComplete="current-password" className={`input ${errors.password ? 'input-error' : ''}`} value={password} onChange={(e) => setPassword(e.target.value)}
            aria-invalid={errors.password ? 'true' : undefined} aria-describedby={errors.password ? 'password-err' : undefined} />
          {errors.password && <p id="password-err" className="field-error">{errors.password}</p>}
        </div>
        {formError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
        <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Logging in...' : 'Log in'}</button>
      </form>
      <p className="mt-4 text-sm text-slate-600">New here? <Link to="/register" className="font-semibold text-brand-700 underline">Create an account</Link></p>
    </div>
  );
}
