import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';

const categories = [
  { label: 'For you', to: '/products' },
  { label: 'Fashion', to: '/products?category=Clothing' },
  { label: 'Mobiles & electronics', to: '/products?category=Electronics' },
  { label: 'Shoes', to: '/products?category=Shoes' },
  { label: 'Accessories', to: '/products?category=Accessories' },
  { label: 'Home', to: '/products?category=Home' },
  { label: 'More finds', to: '/products?category=Other' },
  { label: 'Diwali offers', to: '/products?offer=diwali' }
];

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, isSeller, isBuyer, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { getTotalItems } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const totalItems = getTotalItems();

  const closeMenu = () => setMenuOpen(false);
  const accountPath = isAdmin ? '/admin' : isSeller ? '/seller-dashboard' : isBuyer ? '/account' : '/login';
  const accountLabel = isAuthenticated ? 'My account' : 'Log in';
  const linkClass = 'block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-900';

  const handleSearch = (event) => {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/products?search=${encodeURIComponent(query)}` : '/products');
    closeMenu();
  };

  const accountIcon = (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path d="M20 21a8 8 0 0 0-16 0m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const searchIcon = (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <circle cx="11" cy="11" r="7" strokeWidth="1.8" />
      <path d="m16 16 4 4" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );

  const cartIcon = (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path d="M3 4h2l2.2 11.1a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 2-1.6L22 8H6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="20" r="1" strokeWidth="1.8" />
      <circle cx="18" cy="20" r="1" strokeWidth="1.8" />
    </svg>
  );

  const searchForm = (mobile = false) => (
    <form
      role="search"
      onSubmit={handleSearch}
      className={`flex min-w-0 items-center rounded-xl border border-emerald-700/30 bg-slate-50 transition focus-within:border-emerald-700 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-700/15 ${mobile ? 'md:hidden' : 'hidden flex-1 md:flex'}`}
    >
      <span className="pl-4 text-slate-500">{searchIcon}</span>
      <label className="sr-only" htmlFor={mobile ? 'mobile-product-search' : 'product-search'}>Search products</label>
      <input
        id={mobile ? 'mobile-product-search' : 'product-search'}
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search for products, brands and more"
        className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-500"
      />
      <button
        type="submit"
        aria-label="Search"
        className="mr-1 rounded-lg p-2 text-emerald-800 transition hover:bg-emerald-50"
      >
        {searchIcon}
      </button>
    </form>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="flex min-h-16 items-center gap-4 py-2" aria-label="Main navigation">
          <Link to="/" onClick={closeMenu} className="shrink-0 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
            Shop<span className="text-emerald-800">Hub</span>
          </Link>

          {searchForm()}

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-700"
            >
              {theme === 'light' ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <path d="M12 3v2m0 14v2M5.64 5.64l1.42 1.42m9.88 9.88 1.42 1.42M3 12h2m14 0h2M5.64 18.36l1.42-1.42m9.88-9.88 1.42-1.42M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <path d="M20.2 15.3A8.5 8.5 0 0 1 8.7 3.8 8.5 8.5 0 1 0 20.2 15.3Z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <Link
              to={accountPath}
              aria-label={accountLabel}
              className="inline-flex h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-slate-800 transition hover:bg-emerald-50 hover:text-emerald-900 sm:px-3"
            >
              {accountIcon}
              <span className="hidden lg:inline">{accountLabel}</span>
            </Link>

            <details className="group relative hidden sm:block">
              <summary className="flex h-10 cursor-pointer list-none items-center gap-1 rounded-lg px-3 text-sm font-medium text-slate-800 transition hover:bg-emerald-50 hover:text-emerald-900 [&::-webkit-details-marker]:hidden">
                More
                <svg className="h-4 w-4 transition group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.09 1.03l-4.25 4.51a.75.75 0 0 1-1.09 0l-4.25-4.51a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
                </svg>
              </summary>
              <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                {isBuyer && (
                  <>
                    <Link to="/account" className={linkClass}>My account</Link>
                    <Link to="/my-orders" className={linkClass}>My orders</Link>
                  </>
                )}
                {isSeller && (
                  <>
                    <Link to="/seller-dashboard" className={linkClass}>Seller dashboard</Link>
                    <Link to="/add-product" className={linkClass}>Add a product</Link>
                  </>
                )}
                {isAdmin && <Link to="/admin" className={linkClass}>Admin dashboard</Link>}
                {!isAuthenticated && <Link to="/seller-register" className={linkClass}>Sell with us</Link>}
                <Link to="/products?offer=diwali" className={linkClass}>Current offers</Link>
                {!isAuthenticated ? (
                  <>
                    <Link to="/login" className={linkClass}>Log in</Link>
                    <Link to="/register" className={linkClass}>Create account</Link>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={logout}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-900"
                  >
                    Log out
                  </button>
                )}
              </div>
            </details>

            <Link
              to="/cart"
              aria-label={`Cart${totalItems > 0 ? `, ${totalItems} items` : ''}`}
              className="relative inline-flex h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-slate-800 transition hover:bg-emerald-50 hover:text-emerald-900 sm:px-3"
            >
              {cartIcon}
              <span className="hidden lg:inline">Cart</span>
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-800 px-1 text-xs font-semibold text-white" aria-hidden="true">
                  {totalItems}
                </span>
              )}
            </Link>

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-700 sm:hidden"
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <path d="m6 6 12 12M18 6 6 18" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <path d="M4 6h16M4 12h16M4 18h16" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </nav>

        <div className="pb-3 md:hidden">{searchForm(true)}</div>
      </div>

      {menuOpen && (
        <div id="mobile-navigation" className="border-t border-slate-100 bg-white px-4 py-3 shadow-lg sm:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {isBuyer && (
              <>
                <Link to="/account" onClick={closeMenu} className={linkClass}>My account</Link>
                <Link to="/my-orders" onClick={closeMenu} className={linkClass}>My orders</Link>
              </>
            )}
            {isSeller && (
              <>
                <Link to="/seller-dashboard" onClick={closeMenu} className={linkClass}>Seller dashboard</Link>
                <Link to="/add-product" onClick={closeMenu} className={linkClass}>Add a product</Link>
              </>
            )}
            {isAdmin && <Link to="/admin" onClick={closeMenu} className={linkClass}>Admin dashboard</Link>}
            {!isAuthenticated && <Link to="/seller-register" onClick={closeMenu} className={linkClass}>Sell with us</Link>}
            {!isAuthenticated ? (
              <>
                <Link to="/login" onClick={closeMenu} className={linkClass}>Log in</Link>
                <Link to="/register" onClick={closeMenu} className={linkClass}>Create account</Link>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  logout();
                }}
                className="mt-1 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-emerald-50"
              >
                Log out
              </button>
            )}
          </div>
        </div>
      )}

      <nav className="border-t border-slate-100" aria-label="Shop by category">
        <div className="scrollbar-none mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8">
          {categories.map((category) => (
            <Link
              key={category.label}
              to={category.to}
              className="shrink-0 border-b-2 border-transparent px-3 py-3 text-sm font-medium capitalize text-slate-700 transition hover:border-emerald-800 hover:text-emerald-900"
            >
              {category.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
