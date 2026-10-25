import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import ItemForm from '../components/ItemForm.jsx';

export default function ReportItem() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState({});

  const onSubmit = async (fd) => {
    setSubmitting(true);
    setServerErrors({});
    try {
      const r = await api.createItem(fd);
      navigate(`/items/${r.item.id}`);
    } catch (err) {
      const fe = { _form: err.message };
      (err.details || []).forEach((d) => { fe[d.field] = d.message; });
      setServerErrors(fe);
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-bold text-slate-900">Report an item</h1>
      <ItemForm onSubmit={onSubmit} submitting={submitting} submitLabel="Submit report" serverErrors={serverErrors} />
    </div>
  );
}
