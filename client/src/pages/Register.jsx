import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters.';
    if (!EMAIL_RE.test(form.email.trim())) errs.email = 'Enter a valid email address.';
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      errs.password = 'Password must be at least 8 characters with a letter and a digit.';
    }
    setErrors(errs);
    setFormError('');
    if (Object.keys(errs).length) return;
    setSubmitting(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const fe = {};
      (err.details || []).forEach((d) => { fe[d.field] = d.message; });
      setErrors(fe);
      setFormError(err.message);
      setSubmitting(false);
    }
  };

  const fields = [
    ['name', 'Full name', 'text', 'name'],
    ['email', 'Email', 'email', 'email'],
    ['password', 'Password', 'password', 'new-password'],
  ];

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-2xl font-bold text-slate-900">Create your account</h1>
      <form onSubmit={submit} noValidate className="card grid gap-4 p-6">
        {fields.map(([k, label, type, ac]) => (
          <div key={k}>
            <label htmlFor={`reg-${k}`} className="label">{label}</label>
            <input id={`reg-${k}`} type={type} autoComplete={ac} value={form[k]} onChange={set(k)} className={`input ${errors[k] ? 'input-error' : ''}`}
              aria-invalid={errors[k] ? 'true' : undefined} aria-describedby={errors[k] ? `reg-${k}-err` : undefined} />
            {errors[k] && <p id={`reg-${k}-err`} className="field-error">{errors[k]}</p>}
          </div>
        ))}
        {formError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
        <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Creating...' : 'Sign up'}</button>
      </form>
      <p className="mt-4 text-sm text-slate-600">Already registered? <Link to="/login" className="font-semibold text-brand-700 underline">Log in</Link></p>
    </div>
  );
}
