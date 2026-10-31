import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import BackButton from '../components/BackButton';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('search') || '');
  const [sort, setSort] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [retryCount, setRetryCount] = useState(0);
  const querySearch = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const offerOnly = searchParams.get('offer') === 'diwali';

  useEffect(() => {
    setSearch(querySearch);
    setDebouncedSearch(querySearch);
  }, [querySearch]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let active = true;
    const fetchProducts = async () => {
      setLoading(true);
      setError(false);
      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.append('search', debouncedSearch);
        if (category) params.append('category', category);
        if (sort) params.append('sort', sort);

        const query = params.toString();
        const response = await api.get(query ? `/products?${query}` : '/products');
        if (!Array.isArray(response.data?.products)) {
          throw new Error('Unexpected product API response');
        }
        
        // Filter by price range if set
        let filteredProducts = response.data.products;
        if (priceRange.min) {
          filteredProducts = filteredProducts.filter(p => p.price >= parseFloat(priceRange.min));
        }
        if (priceRange.max) {
          filteredProducts = filteredProducts.filter(p => p.price <= parseFloat(priceRange.max));
        }
        if (offerOnly) {
          filteredProducts = filteredProducts.filter(
            (product) => Number(product.compareAtPrice) > Number(product.price)
          );
        }
        
        if (active) setProducts(filteredProducts);
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
  }, [debouncedSearch, category, sort, priceRange, offerOnly, retryCount]);

  const clearFilters = () => {
    setSearch('');
    setSort('');
    setPriceRange({ min: '', max: '' });
    setSearchParams({});
  };

  const updateQueryFilter = (key, value) => {
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      if (value) nextParams.set(key, value);
      else nextParams.delete(key);
      return nextParams;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#f5f2ec] py-10 text-slate-950 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BackButton className="mb-5" />
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">
            {offerOnly ? 'The festive edit' : 'The collection'}
          </p>
          <h1 className="mb-2 mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {offerOnly ? 'Diwali offers' : 'Find your next favourite'}
          </h1>
          <p className="text-slate-600">
            {offerOnly ? 'Shop selected festive finds at special prices.' : 'Search and filter the products available in the shop.'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="sticky top-24 rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-800">Filters</h2>
                <button
                  onClick={clearFilters}
                  className="text-sm font-medium text-emerald-800 hover:text-emerald-950"
                >
                  Clear All
                </button>
              </div>

              <label className="mb-6 flex cursor-pointer items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 px-3 py-3 text-sm font-medium text-orange-950">
                <input
                  type="checkbox"
                  checked={offerOnly}
                  onChange={(event) => {
                    updateQueryFilter('offer', event.target.checked ? 'diwali' : '');
                  }}
                  className="h-4 w-4 rounded border-orange-300 text-orange-700 focus:ring-orange-600"
                />
                <span>Show Diwali offers only</span>
              </label>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range (₹)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    placeholder="Min"
                    aria-label="Minimum price"
                    className="w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    min="0"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    placeholder="Max"
                    aria-label="Maximum price"
                    className="w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                  />
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                >
                  <option value="">Default</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                {loading ? 'Loading products…' : `${products.length} ${products.length === 1 ? 'product' : 'products'}`}
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-b-emerald-800" role="status" aria-label="Loading products"></div>
              </div>
            ) : error ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center" role="alert">
                <h3 className="font-semibold text-slate-900">Products could not be loaded</h3>
                <p className="mt-2 text-sm text-slate-600">Check your connection and try again.</p>
                <button
                  onClick={() => setRetryCount((count) => count + 1)}
                  className="mt-4 rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900"
                >
                  Try again
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center sm:p-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No products found</h3>
                <p className="text-slate-600 mb-4">Try another search or remove some filters.</p>
                <button
                  onClick={clearFilters}
                  className="rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
