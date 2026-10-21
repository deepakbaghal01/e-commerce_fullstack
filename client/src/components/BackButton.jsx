import { useNavigate } from 'react-router-dom';

const BackButton = ({ className = '' }) => {
  const navigate = useNavigate();

  const goBack = () => {
    if (window.history.state?.idx > 0) {
      navigate(-1);
      return;
    }

    navigate('/');
  };

  return (
    <button
      type="button"
      onClick={goBack}
      className={`inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-800 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 ${className}`}
    >
      <span aria-hidden="true">←</span>
      Back
    </button>
  );
};

export default BackButton;
