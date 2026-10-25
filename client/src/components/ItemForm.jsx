import { useEffect, useState } from 'react';
import { CATEGORIES } from '../lib/constants.js';

const MAX_IMAGE = 2 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function validateItem(v, file) {
  const e = {};
  if (!['lost', 'found'].includes(v.type)) e.type = 'Choose lost or found.';
  const title = v.title.trim();
  if (title.length < 3 || title.length > 100) e.title = 'Title must be 3-100 characters.';
  const desc = v.description.trim();
  if (desc.length < 10 || desc.length > 1000) e.description = 'Description must be 10-1000 characters.';
  if (!CATEGORIES.some((c) => c.value === v.category)) e.category = 'Choose a category.';
  const loc = v.location.trim();
  if (loc.length < 2 || loc.length > 120) e.location = 'Location must be 2-120 characters.';
  if (!v.date) e.date = 'Date is required.';
  else if (new Date(v.date) > new Date()) e.date = 'Date cannot be in the future.';
  if (file) {
    if (!IMAGE_TYPES.includes(file.type)) e.image = 'Image must be JPEG, PNG or WebP.';
    else if (file.size > MAX_IMAGE) e.image = 'Image must be 2MB or smaller.';
  }
  return e;
}

const today = () => new Date().toISOString().slice(0, 10);

export default function ItemForm({ initial, onSubmit, submitting = false, submitLabel = 'Submit', serverErrors = {}, lockType = false }) {
  const [values, setValues] = useState({
    type: initial?.type || 'lost',
    title: initial?.title || '',
    description: initial?.description || '',
    category: initial?.category || '',
    location: initial?.location || '',
    date: initial?.date ? String(initial.date).slice(0, 10) : '',
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(initial?.imageUrl || null);
  const [errors, setErrors] = useState({});

  useEffect(() => () => { if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview); }, [preview]);

  const all = { ...serverErrors, ...errors };
  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }));

  const onFile = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f && typeof URL.createObjectURL === 'function') setPreview(URL.createObjectURL(f));
    else setPreview(initial?.imageUrl || null);
    setErrors((er) => ({ ...er, image: undefined }));
  };

  const submit = (e) => {
    e.preventDefault();
    const errs = validateItem(values, file);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => fd.append(k, typeof v === 'string' ? v.trim() : v));
    if (file) fd.append('image', file);
    onSubmit(fd);
  };

  const field = (name) => ({
    'aria-invalid': all[name] ? 'true' : undefined,
    'aria-describedby': all[name] ? `${name}-err` : undefined,
    className: `input ${all[name] ? 'input-error' : ''}`,
  });
  const Err = ({ name }) => (all[name] ? <p id={`${name}-err`} className="field-error">{all[name]}</p> : null);

  return (
    <form onSubmit={submit} noValidate className="card grid gap-5 p-6" aria-label="Item form">
      <fieldset disabled={lockType}>
        <legend className="label">Item type</legend>
        <div className="flex gap-4">
          {['lost', 'found'].map((t) => (
            <label key={t} className="flex items-center gap-2 text-sm capitalize">
              <input type="radio" name="type" value={t} checked={values.type === t} onChange={set('type')} />
              {t}
            </label>
          ))}
        </div>
        <Err name="type" />
      </fieldset>

      <div>
        <label htmlFor="title" className="label">Title</label>
        <input id="title" name="title" value={values.title} onChange={set('title')} maxLength={100} {...field('title')} />
        <Err name="title" />
      </div>

      <div>
        <label htmlFor="description" className="label">Description</label>
        <textarea id="description" name="description" rows={4} value={values.description} onChange={set('description')} maxLength={1000} {...field('description')} />
        <Err name="description" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className="label">Category</label>
          <select id="category" name="category" value={values.category} onChange={set('category')} {...field('category')}>
            <option value="">Select a category</option>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <Err name="category" />
        </div>
        <div>
          <label htmlFor="date" className="label">Date</label>
          <input id="date" name="date" type="date" max={today()} value={values.date} onChange={set('date')} {...field('date')} />
          <Err name="date" />
        </div>
      </div>

      <div>
        <label htmlFor="location" className="label">Location</label>
        <input id="location" name="location" value={values.location} onChange={set('location')} maxLength={120} {...field('location')} />
        <Err name="location" />
      </div>

      <div>
        <label htmlFor="image" className="label">Photo (optional, JPEG/PNG/WebP, max 2MB)</label>
        <input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile}
          aria-invalid={all.image ? 'true' : undefined} aria-describedby={all.image ? 'image-err' : undefined}
          className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:font-semibold file:text-brand-700" />
        <Err name="image" />
        {preview && <img src={preview} alt="Preview of selected item" className="mt-3 h-40 w-auto rounded-lg border border-slate-200 object-cover" />}
      </div>

      {all._form && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{all._form}</p>}

      <div>
        <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Saving...' : submitLabel}</button>
      </div>
    </form>
  );
}
