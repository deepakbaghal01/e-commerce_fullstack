import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MyAccount = () => {
  const { user } = useAuth();
  const initials = user?.name
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || 'U';

  const details = [
    { label: 'Full name', value: user?.name },
    { label: 'Email address', value: user?.email },
    { label: 'Phone number', value: user?.phone }
  ];

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Your account</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Personal details</h1>
        <p className="mt-2 text-slate-600">View your customer information and manage your shopping activity.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-5 border-b border-slate-200 bg-slate-50 px-6 py-7 sm:flex-row sm:items-center sm:px-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-800 text-xl font-bold text-white" aria-hidden="true">
            {initials}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{user?.name || 'Customer'}</h2>
            <p className="mt-1 text-sm text-slate-600">Customer account</p>
          </div>
          <Link
            to="/my-orders"
            className="sm:ml-auto inline-flex items-center justify-center rounded-lg bg-emerald-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
          >
            View my orders
          </Link>
        </div>

        <div className="px-6 py-7 sm:px-8">
          <h2 className="text-lg font-semibold text-slate-900">Contact information</h2>
          <dl className="mt-5 grid gap-5 sm:grid-cols-2">
            {details.map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-slate-200 px-4 py-4">
                <dt className="text-sm font-medium text-slate-500">{label}</dt>
                <dd className="mt-2 break-words font-medium text-slate-900">{value || 'Not provided'}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-sm text-slate-500">
            Need to change your details? Please contact customer support for help.
          </p>
        </div>
      </div>
    </section>
  );
};

export default MyAccount;
