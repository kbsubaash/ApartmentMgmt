import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import * as circularsApi from '@/api/circulars.api';
import { signCircular, getSignatures } from '@/api/signatures.api';
import Badge from '@/components/common/Badge';
import Spinner from '@/components/common/Spinner';
import Alert from '@/components/common/Alert';
import { formatDateTime } from '@/utils/formatters';

export default function CircularDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const canManage = ['Admin', 'Committee'].includes(user?.role);

  const [circular, setCircular] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Signatures state
  const [signatures, setSignatures] = useState([]);
  const [sigLoading, setSigLoading] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [signing, setSigning] = useState(false);

  const loadSignatures = useCallback(() => {
    if (!canManage) return;
    setSigLoading(true);
    getSignatures(id)
      .then(({ data }) => setSignatures(data.signatures))
      .catch(() => {})
      .finally(() => setSigLoading(false));
  }, [id, canManage]);

  useEffect(() => {
    circularsApi.getCircular(id)
      .then(({ data }) => {
        setCircular(data.circular);
        // Check if current user already signed (resident path — try sign idempotently via GET won't work,
        // so we optimistically assume not signed; the button shows until they click)
      })
      .catch(() => navigate('/circulars'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => {
    if (circular?.status === 'Published') loadSignatures();
  }, [circular, loadSignatures]);

  useEffect(() => {
    // Mark as signed if we find current user in signatures list
    if (canManage && signatures.length > 0) {
      setHasSigned(signatures.some((s) => s.userId === user?.id));
    }
  }, [signatures, user, canManage]);

  const handlePublish = async () => {
    if (!window.confirm('Publish this circular and notify members?')) return;
    setPublishing(true);
    try {
      const { data } = await circularsApi.publishCircular(id);
      setCircular(data.circular);
    } catch (err) {
      setError(err.response?.data?.message || 'Publish failed');
    } finally {
      setPublishing(false);
    }
  };

  const handleSign = async () => {
    setSigning(true);
    try {
      await signCircular(id);
      setHasSigned(true);
      setSuccess('You have digitally signed this circular.');
      loadSignatures();
    } catch (err) {
      setError(err.response?.data?.message || 'Signing failed');
    } finally {
      setSigning(false);
    }
  };

  if (loading) return <Spinner size="lg" className="mt-20" />;
  if (!circular) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Link to="/circulars" className="text-sm text-brand hover:underline">← Back to Circulars</Link>

      <div className="card space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{circular.title}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge label={circular.status} />
              <Badge label={circular.audience} />
            </div>
          </div>
          {canManage && circular.status === 'Draft' && (
            <div className="flex gap-2 flex-shrink-0">
              <Link to={`/circulars/${id}/edit`} className="btn-secondary">Edit</Link>
              <button onClick={handlePublish} disabled={publishing} className="btn-primary">
                {publishing ? 'Publishing…' : 'Publish'}
              </button>
            </div>
          )}
        </div>

        <Alert type="success" message={success} onClose={() => setSuccess('')} />
        <Alert type="error" message={error} onClose={() => setError('')} />

        {/* Meta */}
        <div className="text-xs text-gray-400 space-y-0.5 border-t pt-3">
          <p>Created by <span className="font-medium text-gray-600">{circular.createdBy?.name}</span> · {formatDateTime(circular.createdAt)}</p>
          {circular.publishedAt && (
            <p>Published by <span className="font-medium text-gray-600">{circular.publishedBy?.name}</span> · {formatDateTime(circular.publishedAt)}</p>
          )}
        </div>

        {/* Content */}
        <div
          className="prose max-w-none border-t pt-4 text-gray-800"
          dangerouslySetInnerHTML={{ __html: circular.content }}
        />

        {/* Attachments */}
        {circular.attachments?.length > 0 && (
          <div className="border-t pt-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">Attachments</p>
            <ul className="space-y-1">
              {circular.attachments.map((att, i) => (
                <li key={i}>
                  <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-sm text-brand hover:underline flex items-center gap-1">
                    📎 {att.originalName}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Digital Signature Section */}
      {circular.status === 'Published' && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Digital Signatures</h2>
            {canManage && (
              <span className="text-xs text-gray-400">{signatures.length} member{signatures.length !== 1 ? 's' : ''} signed</span>
            )}
          </div>

          {/* Current user sign button */}
          {!hasSigned ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 mb-3">
                By signing below, you confirm that you have read and acknowledged this circular.
              </p>
              <button onClick={handleSign} disabled={signing} className="btn-primary">
                {signing ? 'Signing…' : '✍️ Digitally Sign this Circular'}
              </button>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <span className="text-green-600 text-2xl">✅</span>
              <div>
                <p className="text-sm font-semibold text-green-800">You have signed this circular</p>
                <p className="text-xs text-green-600">Your acknowledgment has been recorded with a timestamp.</p>
              </div>
            </div>
          )}

          {/* Signature list for Admin/Committee */}
          {canManage && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Signature Log</p>
              {sigLoading ? (
                <Spinner size="sm" />
              ) : signatures.length === 0 ? (
                <p className="text-sm text-gray-400">No signatures yet.</p>
              ) : (
                <div className="divide-y border rounded-lg overflow-hidden">
                  {signatures.map((sig) => (
                    <div key={sig._id} className="flex items-center justify-between px-4 py-2.5 bg-white hover:bg-gray-50 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {sig.user?.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <span className="font-medium text-gray-800">{sig.user?.name}</span>
                          <span className="text-xs text-gray-400 ml-2">({sig.user?.role})</span>
                          {sig.user?.flat && (
                            <span className="text-xs text-gray-400 ml-1">· Flat {sig.user.flat.block}-{sig.user.flat.unitNumber}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-xs text-gray-400">
                        <p>{formatDateTime(sig.signedAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
