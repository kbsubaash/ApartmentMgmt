import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import * as authApi from '@/api/auth.api';
import Alert from '@/components/common/Alert';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', mailingAddress: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await authApi.register({ name: form.name, email: form.email, password: form.password, phone: form.phone, mailingAddress: form.mailingAddress });
      // Auto-login after register
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark to-brand flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="mx-auto h-14 w-14 bg-brand rounded-xl flex items-center justify-center text-white text-2xl mb-3">
            🏢
          </div>
          <h1 className="text-xl font-bold text-gray-900">Create Account</h1>
          <p className="text-sm text-gray-500 mt-1">DABC Euphorbia Phase 3</p>
        </div>

        <Alert type="error" message={error} onClose={() => setError('')} />

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input type="text" required className="input" value={form.name} onChange={set('name')} placeholder="John Doe" />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" required className="input" value={form.email} onChange={set('email')} placeholder="you@example.com" />
          </div>
          <div>
            <label className="label">Phone (optional)</label>
            <input type="tel" className="input" value={form.phone} onChange={set('phone')} placeholder="+91 9876543210" />
          </div>
          <div>
            <label className="label">Mailing Address (optional)</label>
            <textarea className="input resize-none" rows={2} value={form.mailingAddress} onChange={set('mailingAddress')} placeholder="Door No, Street, City, PIN" />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" required className="input" value={form.password} onChange={set('password')} placeholder="Min. 8 characters" />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
