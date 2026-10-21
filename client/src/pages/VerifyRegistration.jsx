import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const getStoredChallenge = () => {
  try {
    return JSON.parse(sessionStorage.getItem('registrationChallenge') || 'null');
  } catch (error) {
    console.error('Could not read the registration verification session:', error);
    return null;
  }
};

const VerifyRegistration = () => {
  const [challenge, setChallenge] = useState(getStoredChallenge);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState(60);
  const [delivery, setDelivery] = useState(challenge?.delivery);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const { completeVerification } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (remainingSeconds <= 0) return undefined;
    const timer = window.setTimeout(() => setRemainingSeconds((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [remainingSeconds]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      const response = await api.post('/auth/verify-registration', {
        challengeToken: challenge.challengeToken,
        phoneCode
      });
      completeVerification(response.data);
      sessionStorage.removeItem('registrationChallenge');
      navigate(response.data.user.role === 'seller' ? '/seller-dashboard' : '/');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setMessage('');
    setResending(true);
    try {
      const response = await api.post('/auth/resend-verification', {
        challengeToken: challenge.challengeToken
      });
      const updatedChallenge = {
        ...challenge,
        challengeToken: response.data.challengeToken || challenge.challengeToken,
        maskedPhone: response.data.maskedPhone || challenge.maskedPhone,
        deliveryMode: response.data.deliveryMode || challenge.deliveryMode
      };
      setChallenge(updatedChallenge);
      sessionStorage.setItem('registrationChallenge', JSON.stringify(updatedChallenge));
      setDelivery(response.data.delivery);
      setPhoneCode('');
      setRemainingSeconds(60);
      setMessage(response.data.message);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not resend the code. Please try again.');
      if (requestError.response?.status === 429) setRemainingSeconds(60);
    } finally {
      setResending(false);
    }
  };

  const handleRecover = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setResending(true);
    try {
      const response = await api.post('/auth/resend-verification', { email: recoveryEmail });
      if (response.data.challengeToken) {
        const nextChallenge = {
          challengeToken: response.data.challengeToken,
          maskedPhone: response.data.maskedPhone,
          deliveryMode: response.data.deliveryMode,
          delivery: response.data.delivery
        };
        sessionStorage.setItem('registrationChallenge', JSON.stringify(nextChallenge));
        setChallenge(nextChallenge);
        setDelivery(response.data.delivery);
        setRemainingSeconds(60);
      }
      setMessage(response.data.message);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not request a new code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (!challenge?.challengeToken) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center px-4 py-12">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Continue account verification</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Request a new verification code using the email address from your registration. The code will be sent to your saved phone number.
          </p>
          {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          {message && <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p>}
          <form onSubmit={handleRecover} className="mt-5 flex flex-col gap-3 sm:flex-row">
            <label htmlFor="recovery-email" className="sr-only">Registration email</label>
            <input
              id="recovery-email"
              type="email"
              value={recoveryEmail}
              onChange={(event) => setRecoveryEmail(event.target.value)}
              placeholder="Email used to register"
              required
              autoComplete="email"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-2.5 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
            />
            <button
              type="submit"
              disabled={resending}
              className="rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:bg-slate-300"
            >
              {resending ? 'Requesting…' : 'Send new code'}
            </button>
          </form>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/register" className="rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900">Create buyer account</Link>
            <Link to="/seller-register" className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Register as seller</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center px-4 py-12">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-2xl text-emerald-800" aria-hidden="true">
          ✓
        </div>
        <h1 className="mt-4 text-center text-2xl font-semibold text-slate-900">Verify your details</h1>
        <p className="mt-2 text-center text-sm leading-6 text-slate-600">
          Enter the six-digit code sent to <strong>{challenge.maskedPhone}</strong>.
        </p>
        {challenge.deliveryMode === 'console' && (
          <p role="status" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Local development mode: find the verification code in the backend terminal where <code>npm run dev</code> is running.
          </p>
        )}

        {delivery && !delivery.phone && (
          <div role="alert" className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p>Phone code delivery failed. Check the SMS provider settings.</p>
            <p className="mt-1">Fix delivery settings, then request a new code.</p>
          </div>
        )}
        {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        {message && <p role="status" className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="phone-code" className="mb-1 block text-sm font-medium text-slate-700">Phone verification code</label>
            <input
              id="phone-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength="6"
              value={phoneCode}
              onChange={(event) => setPhoneCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 tracking-[0.3em] focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>
          <button
            type="submit"
            disabled={submitting || phoneCode.length !== 6}
            className="w-full rounded-lg bg-emerald-800 px-4 py-3 font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {submitting ? 'Verifying…' : 'Verify and continue'}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || remainingSeconds > 0}
            className="text-sm font-semibold text-emerald-800 hover:text-emerald-950 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {resending ? 'Sending code…' : remainingSeconds > 0 ? `Resend code in ${remainingSeconds}s` : 'Resend verification code'}
          </button>
        </div>
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem('registrationChallenge');
              setChallenge(null);
              setError('');
              setMessage('');
            }}
            className="text-xs text-slate-500 underline hover:text-slate-800"
          >
            Lost this session? Recover with your registration email
          </button>
        </div>
      </div>
    </main>
  );
};

export default VerifyRegistration;
