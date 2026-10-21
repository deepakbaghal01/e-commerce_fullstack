import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="mt-auto border-t border-slate-800 bg-slate-950 text-slate-300">
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
      <div>
        <Link to="/" className="text-xl font-bold tracking-tight text-white">
          Shop<span className="text-emerald-400">Hub</span>
        </Link>
        <p className="mt-3 max-w-sm text-sm leading-6 text-slate-400">
          Thoughtful finds for everyday living. Browse the collection and discover something for you.
        </p>
      </div>
      <div>
        <h2 className="text-sm font-semibold text-white">Explore</h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li><Link to="/products" className="transition hover:text-white">All products</Link></li>
          <li><Link to="/cart" className="transition hover:text-white">Shopping cart</Link></li>
        </ul>
      </div>
      <div>
        <h2 className="text-sm font-semibold text-white">Your account</h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li><Link to="/login" className="transition hover:text-white">Log in</Link></li>
          <li><Link to="/register" className="transition hover:text-white">Create an account</Link></li>
          <li><Link to="/my-orders" className="transition hover:text-white">Order history</Link></li>
        </ul>
      </div>
    </div>
    <div className="border-t border-slate-800">
      <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-slate-500 sm:px-6 lg:px-8">
        © {new Date().getFullYear()} ShopHub
      </p>
    </div>
  </footer>
);

export default Footer;
