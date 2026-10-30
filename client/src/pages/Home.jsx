import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import { resetPointerTilt, updatePointerTilt } from '../utils/pointerTilt';

const categories = [
  { name: 'Electronics', icon: '⌁', description: 'Everyday tech' },
  { name: 'Clothing', icon: '✳', description: 'Find your fit' },
  { name: 'Shoes', icon: '↗', description: 'Step out in style' },
  { name: 'Accessories', icon: '◉', description: 'Finishing touches' },
  { name: 'Home', icon: '⌂', description: 'Make it yours' },
  { name: 'Other', icon: '✦', description: 'More to explore' }
];

const formatPrice = (price) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2
}).format(Number(price) || 0);

const Home = () => {
  const [products, setProducts] = useState([]);
  const [saleProducts, setSaleProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    const fetchProducts = async () => {
      setLoading(true);
      setError(false);
      try {
        const response = await api.get('/products');
        if (!Array.isArray(response.data?.products)) {
          throw new Error('Unexpected product API response');
        }

        if (active) {
          setProducts(response.data.products);
          setSaleProducts(response.data.products.filter(
            (product) => Number(product.compareAtPrice) > Number(product.price)
          ));
        }
      } catch (requestError) {
        console.error('Error fetching products:', requestError);
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchProducts();
    return () => {
      active = false;
    };
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/products?search=${encodeURIComponent(query)}` : '/products');
  };

  return (
    <div className="home-page">
      <section className="hero-3d overflow-hidden bg-[#f5f2ec]">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 md:py-20 lg:px-8">
          <div className="hero-copy max-w-xl">
            <p className="hero-kicker mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">
              A little more thoughtful shopping
            </p>
            <h1 className="hero-title text-4xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Find things you&apos;ll <span className="text-emerald-800">love to keep.</span>
            </h1>
            <p className="hero-description mt-5 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
              Explore useful finds for your home, wardrobe, and everyday life.
              Browse the collection and find the right fit for you.
            </p>
            <form onSubmit={handleSearch} className="hero-cta mt-8 flex max-w-lg gap-2 rounded-xl bg-white p-2 shadow-sm ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-emerald-700">
              <label className="sr-only" htmlFor="home-search">Search products</label>
              <input
                id="home-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="What are you looking for?"
                className="min-w-0 flex-1 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
              >
                Search
              </button>
            </form>
            <Link
              to="/products"
              className="hero-browse mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-emerald-800"
            >
              Browse all products <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div
            className="hero-visual relative mx-auto w-full max-w-lg"
            onPointerMove={(event) => updatePointerTilt(event, 9)}
            onPointerLeave={resetPointerTilt}
          >
            <div className="hero-glow absolute -inset-5 rotate-2 rounded-[2.2rem] bg-[#e1d9cb]" />
            <div className="hero-orb hero-orb-one" aria-hidden="true" />
            <div className="hero-orb hero-orb-two" aria-hidden="true" />
            <div className="hero-ring" aria-hidden="true" />
            {products.slice(0, 2).map((product, index) => (
              <Link
                key={product._id}
                to={`/products/${product._id}`}
                className={`hero-product hero-product-${index + 1} hidden sm:flex`}
              >
                {product.image && (
                  <img src={product.image} alt="" loading="lazy" />
                )}
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-slate-900">{product.name}</span>
                  <span className="mt-1 block text-xs font-medium text-emerald-800">{formatPrice(product.price)}</span>
                </span>
              </Link>
            ))}
            <div className="hero-frame relative overflow-hidden rounded-[1.5rem] border border-white/60 bg-white/40 shadow-[0_30px_80px_rgba(15,23,42,0.14)]">
              <img
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000&auto=format&fit=crop&q=85"
                alt="A carefully arranged selection of clothing and accessories"
                className="relative aspect-[4/3] w-full object-cover"
              />
            </div>
            <div className="hero-badge absolute -bottom-5 left-4 rounded-xl bg-white/90 px-5 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:left-8">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Your next favourite</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">Could be one click away</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-slate-100 px-4 py-5 text-sm text-slate-600 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6 lg:px-8">
          <p className="py-2 text-center"><span className="font-semibold text-slate-900">Clear product details</span><br />See the information before you buy</p>
          <p className="py-2 text-center"><span className="font-semibold text-slate-900">Easy to explore</span><br />Browse by category or search</p>
          <p className="py-2 text-center"><span className="font-semibold text-slate-900">Your cart, your way</span><br />Review items before checkout</p>
        </div>
      </section>

      <section className="category-section py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">Explore</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Shop by category</h2>
            </div>
            <Link to="/products" className="hidden text-sm font-semibold text-emerald-800 hover:text-emerald-950 sm:inline-flex">
              View all products <span className="ml-1" aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            {categories.map((category) => (
              <Link
                key={category.name}
                to={`/products?category=${encodeURIComponent(category.name)}`}
                className="tilt-card group rounded-2xl border border-slate-200 bg-[#faf9f6] p-4 transition duration-300 hover:border-emerald-800/40 hover:bg-white sm:p-5"
                onPointerMove={(event) => updatePointerTilt(event, 9)}
                onPointerLeave={resetPointerTilt}
              >
                <span className="category-icon flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-xl text-emerald-800" aria-hidden="true">
                  {category.icon}
                </span>
                <h3 className="mt-4 font-semibold text-slate-900 group-hover:text-emerald-800">{category.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{category.description}</p>
                <p className="mt-3 text-xs font-semibold text-emerald-800">
                  {loading ? 'Loading products…' : `${products.filter((product) => product.category === category.name).length} products`}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {!loading && !error && saleProducts.length > 0 && (
        <section className="diwali-banner overflow-hidden bg-[#7c2d12] py-12 text-white sm:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-200">The festive edit</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Diwali offers</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-orange-100">
                  Bring a little extra warmth to your celebrations with special prices on selected festive finds.
                </p>
              </div>
              <Link
                to="/products?offer=diwali"
                className="inline-flex w-fit rounded-lg bg-white px-5 py-3 text-sm font-semibold text-orange-900 transition hover:bg-orange-50"
              >
                Shop Diwali offers <span className="ml-2" aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
              {saleProducts.slice(0, 4).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="home-products bg-[#f8f8f6] py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">The collection</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">All products</h2>
              <p className="mt-2 text-sm text-slate-600">
                {loading ? 'Loading the full collection…' : `${products.length} ${products.length === 1 ? 'product' : 'products'} available to shop.`}
              </p>
            </div>
            <Link to="/products" className="hidden rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-emerald-800 hover:text-emerald-800 sm:inline-flex">
              Browse everything
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="rounded-2xl bg-white p-3">
                  <div className="skeleton-surface aspect-[4/3] rounded-xl" />
                  <div className="skeleton-surface mt-4 h-4 w-3/4 rounded" />
                  <div className="skeleton-surface mt-3 h-4 w-1/3 rounded" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center" role="status">
              <p className="font-semibold text-slate-900">We couldn&apos;t load the collection.</p>
              <p className="mt-1 text-sm text-slate-600">Refresh this page to try again, or browse the products page.</p>
              <Link to="/products" className="mt-4 inline-flex rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900">
                Browse products
              </Link>
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <p className="font-semibold text-slate-900">The collection is being updated.</p>
              <p className="mt-1 text-sm text-slate-600">Check back soon to see what&apos;s new.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          <div className="mt-7 text-center sm:hidden">
            <Link to="/products" className="inline-flex rounded-lg bg-emerald-800 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-900">
              Browse all products
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
