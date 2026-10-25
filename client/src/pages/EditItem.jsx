import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import ItemForm from '../components/ItemForm.jsx';
import { ErrorBanner, Spinner } from '../components/Feedback.jsx';

export default function EditItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState({});

  useEffect(() => {
    let active = true;
    api.getItem(id)
      .then((r) => active && setItem(r.item))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id]);

  const onSubmit = async (fd) => {
    setSubmitting(true);
    setServerErrors({});
    try {
      await api.updateItem(id, fd);
      navigate(`/items/${id}`);
    } catch (err) {
      const fe = { _form: err.message };
      (err.details || []).forEach((d) => { fe[d.field] = d.message; });
      setServerErrors(fe);
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} />;
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-bold text-slate-900">Edit listing</h1>
      <ItemForm initial={item} onSubmit={onSubmit} submitting={submitting} submitLabel="Save changes" serverErrors={serverErrors} />
    </div>
  );
}
