import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const initialFormData = {
  name: '',
  description: '',
  price: '',
  compareAtPrice: '',
  category: 'Electronics',
  image: '',
  stock: ''
};

const categories = ['Electronics', 'Clothing', 'Shoes', 'Accessories', 'Home', 'Other'];

const AddProduct = () => {
  const { isAuthenticated, isSeller, isAdmin, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdProduct, setCreatedProduct] = useState(null);
  const [imageUnavailable, setImageUnavailable] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setError('');
    if (name === 'image') setImageUnavailable(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!isAdmin && (!isSeller || user?.isVerified !== true)) {
      setError('Your seller account must be approved before you can publish products.');
      return;
    }

    const price = Number(formData.price);
    const compareAtPrice = formData.compareAtPrice === '' ? undefined : Number(formData.compareAtPrice);
    const stock = Number(formData.stock);
    if (!Number.isFinite(price) || price < 0) {
      setError('Enter a valid price of 0 or more.');
      return;
    }
    if (compareAtPrice !== undefined && (!Number.isFinite(compareAtPrice) || compareAtPrice <= price)) {
      setError('The original price must be greater than the selling price.');
      return;
    }
    if (!Number.isInteger(stock) || stock < 0) {
      setError('Stock must be a whole number of 0 or more.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/products', {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price,
        ...(compareAtPrice === undefined ? {} : { compareAtPrice }),
        category: formData.category,
        image: formData.image.trim(),
        stock
      });

      if (!response.data?.success || !response.data?.product) {
        throw new Error(response.data?.message || 'The product could not be created. Please try again.');
      }

      setCreatedProduct(response.data.product);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
        requestError.message ||
        'The product could not be created. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-violet-100 border-t-violet-600" />
          <p className="mt-4 text-sm font-medium text-gray-600">Preparing your seller workspace…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4 py-12">
        <div className="w-full rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-xl shadow-gray-200/50 sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-3xl" aria-hidden="true">
            🛍️
          </div>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-violet-600">Seller workspace</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-gray-900">Sign in to list a product</h1>
          <p className="mx-auto mt-3 max-w-md leading-7 text-gray-500">
            Log in to your account to add products, manage your listings, and start selling.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/login" className="rounded-xl bg-violet-600 px-6 py-3 font-bold text-white transition hover:bg-violet-700">
              Log in
            </Link>
            <Link to="/seller-register" className="rounded-xl border border-gray-200 px-6 py-3 font-bold text-gray-700 transition hover:bg-gray-50">
              Create a seller account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin && (!isSeller || user?.isVerified !== true)) {
    const isRejected = user?.verificationStatus === 'rejected';
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4 py-12">
        <div className="w-full rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            {isSeller ? 'Seller approval required' : 'Seller account required'}
          </h1>
          <p className="mt-3 leading-6 text-slate-700">
            {isRejected
              ? 'Your seller application needs changes before you can publish products.'
              : isSeller
                ? 'Your application is waiting for admin approval. You can publish products after it is approved.'
                : 'Register or sign in with a seller account to publish products.'}
          </p>
          {user?.verificationNotes && (
            <p className="mt-3 rounded-lg bg-white/70 p-3 text-left text-sm text-slate-700">
              Admin note: {user.verificationNotes}
            </p>
          )}
          <Link to={isSeller ? '/seller-dashboard' : '/seller-register'} className="mt-6 inline-flex rounded-lg bg-emerald-800 px-5 py-3 font-semibold text-white hover:bg-emerald-900">
            {isSeller ? 'View seller dashboard' : 'Create a seller account'}
          </Link>
        </div>
      </div>
    );
  }

  if (createdProduct) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4 py-12">
        <div className="w-full rounded-3xl border border-emerald-100 bg-white p-8 text-center shadow-xl shadow-gray-200/50 sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-700" aria-hidden="true">
            ✓
          </div>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Listing published</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-gray-900">Your product is live</h1>
          <p className="mt-3 leading-7 text-gray-500">
            <span className="font-semibold text-gray-800">{createdProduct.name}</span> has been added to the store.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to={`/products/${createdProduct._id}`} className="rounded-xl bg-violet-600 px-6 py-3 font-bold text-white transition hover:bg-violet-700">
              View listing
            </Link>
            <button
              type="button"
              onClick={() => {
                setCreatedProduct(null);
                setFormData(initialFormData);
                setImageUnavailable(false);
              }}
              className="rounded-xl border border-gray-200 px-6 py-3 font-bold text-gray-700 transition hover:bg-gray-50"
            >
              Add another product
            </button>
            <Link to="/seller-dashboard" className="rounded-xl border border-gray-200 px-6 py-3 font-bold text-gray-700 transition hover:bg-gray-50">
              Seller dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-violet-100 bg-gradient-to-br from-violet-700 via-violet-700 to-indigo-800">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <Link to="/seller-dashboard" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-violet-100 transition hover:text-white">
            <span aria-hidden="true">←</span> Seller dashboard
          </Link>
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-200">Grow your store</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Add a new product</h1>
              <p className="mt-3 max-w-2xl leading-7 text-violet-100">
                Give shoppers the details they need to discover and choose your product.
              </p>
            </div>
            <div className="hidden rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-sm text-violet-50 sm:block">
              <span className="font-bold text-white">Quick tip</span>
              <p className="mt-1">Clear photos and descriptions build buyer confidence.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8 lg:py-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
              <span className="mt-0.5 font-bold" aria-hidden="true">!</span>
              <p>{error}</p>
            </div>
          )}

          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Product details</h2>
                <p className="mt-1 text-sm text-gray-500">Start with a clear name and a helpful description.</p>
              </div>
              <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">01</span>
            </div>

            <div className="space-y-5">
              <div>
                <label htmlFor="product-name" className="mb-2 block text-sm font-semibold text-gray-700">Product name <span className="text-red-500">*</span></label>
                <input
                  id="product-name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  minLength="2"
                  maxLength="100"
                  autoComplete="off"
                  placeholder="e.g. Classic everyday backpack"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                />
                <div className="mt-1.5 flex justify-between text-xs text-gray-400">
                  <span>Make it specific and easy to find.</span>
                  <span>{formData.name.length}/100</span>
                </div>
              </div>

              <div>
                <label htmlFor="product-description" className="mb-2 block text-sm font-semibold text-gray-700">Description <span className="text-red-500">*</span></label>
                <textarea
                  id="product-description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  minLength="10"
                  maxLength="1000"
                  rows="5"
                  placeholder="Describe what makes this product useful. Include important features, materials, sizing, or care details."
                  className="w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                />
                <div className="mt-1.5 flex justify-between text-xs text-gray-400">
                  <span>Helpful details reduce buyer questions.</span>
                  <span>{formData.description.length}/1000</span>
                </div>
              </div>

              <div>
                <label htmlFor="product-category" className="mb-2 block text-sm font-semibold text-gray-700">Category <span className="text-red-500">*</span></label>
                <select
                  id="product-category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                >
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Price & inventory</h2>
                <p className="mt-1 text-sm text-gray-500">Set your selling price and available quantity.</p>
              </div>
              <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">02</span>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="product-price" className="mb-2 block text-sm font-semibold text-gray-700">Price (₹) <span className="text-red-500">*</span></label>
                <div className="flex overflow-hidden rounded-xl border border-gray-200 transition focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-100">
                  <span className="flex items-center border-r border-gray-200 bg-gray-50 px-4 font-semibold text-gray-500">₹</span>
                  <input
                    id="product-price"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0.00"
                    className="min-w-0 flex-1 px-4 py-3 text-gray-900 outline-none"
                  />
                </div>
                <p className="mt-1.5 text-xs text-gray-400">Enter the price customers will pay.</p>
              </div>

              <div>
                <label htmlFor="product-compare-at-price" className="mb-2 block text-sm font-semibold text-gray-700">Original price (₹)</label>
                <div className="flex overflow-hidden rounded-xl border border-gray-200 transition focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-100">
                  <span className="flex items-center border-r border-gray-200 bg-gray-50 px-4 font-semibold text-gray-500">₹</span>
                  <input
                    id="product-compare-at-price"
                    name="compareAtPrice"
                    type="number"
                    value={formData.compareAtPrice}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="Optional"
                    className="min-w-0 flex-1 px-4 py-3 text-gray-900 outline-none"
                  />
                </div>
                <p className="mt-1.5 text-xs text-gray-400">Enter a higher original price to show this product in Diwali offers.</p>
              </div>

              <div>
                <label htmlFor="product-stock" className="mb-2 block text-sm font-semibold text-gray-700">Available quantity <span className="text-red-500">*</span></label>
                <input
                  id="product-stock"
                  name="stock"
                  type="number"
                  value={formData.stock}
                  onChange={handleChange}
                  required
                  min="0"
                  step="1"
                  inputMode="numeric"
                  placeholder="e.g. 25"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                />
                <p className="mt-1.5 text-xs text-gray-400">Use 0 if the product is currently unavailable.</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Product photo</h2>
                <p className="mt-1 text-sm text-gray-500">Add a direct link to a clear image of your product.</p>
              </div>
              <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">03</span>
            </div>

            <label htmlFor="product-image" className="mb-2 block text-sm font-semibold text-gray-700">Image URL <span className="text-red-500">*</span></label>
            <input
              id="product-image"
              name="image"
              type="url"
              value={formData.image}
              onChange={handleChange}
              required
              placeholder="https://example.com/your-product.jpg"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
            />
            <p className="mt-2 text-xs leading-5 text-gray-400">
              Use a publicly accessible image URL. For best results, choose a well-lit square or portrait photo.
            </p>
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link to="/seller-dashboard" className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-center font-bold text-gray-700 transition hover:bg-gray-50">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-7 py-3 font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
              {submitting ? 'Publishing product…' : 'Publish product'}
            </button>
          </div>
        </form>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="font-bold text-gray-900">Listing preview</h2>
              <p className="mt-1 text-sm text-gray-500">A preview of how your product will appear.</p>
            </div>
            <div className="p-5">
              <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                {formData.image && !imageUnavailable ? (
                  <img
                    src={formData.image}
                    alt={formData.name ? `${formData.name} preview` : 'Product preview'}
                    onError={() => setImageUnavailable(true)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="px-6 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm" aria-hidden="true">🖼️</div>
                    <p className="mt-3 text-sm font-semibold text-gray-600">
                      {imageUnavailable ? 'Image could not be loaded' : 'Your photo will appear here'}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">Paste a public image URL to preview it.</p>
                  </div>
                )}
                {formData.stock === '0' && (
                  <span className="absolute left-3 top-3 rounded-full bg-gray-900/80 px-3 py-1 text-xs font-bold text-white">Out of stock</span>
                )}
              </div>
              <div className="pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-violet-600">{formData.category}</p>
                <h3 className="mt-2 break-words text-lg font-bold text-gray-900">
                  {formData.name || 'Your product name'}
                </h3>
                <p className="mt-2 line-clamp-3 min-h-[3.75rem] whitespace-pre-line text-sm leading-5 text-gray-500">
                  {formData.description || 'Your product description will appear here, helping shoppers understand what makes it special.'}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                  <span className="text-xl font-black text-gray-900">
                    {formData.price !== '' && Number.isFinite(Number(formData.price))
                      ? `₹${Number(formData.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : '₹0.00'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formData.stock ? `${formData.stock} in stock` : 'Stock not set'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50 p-5">
            <h3 className="text-sm font-bold text-violet-900">A great listing includes</h3>
            <ul className="mt-3 space-y-2 text-sm text-violet-800">
              <li className="flex gap-2"><span aria-hidden="true">✓</span> A descriptive product name</li>
              <li className="flex gap-2"><span aria-hidden="true">✓</span> Accurate details and pricing</li>
              <li className="flex gap-2"><span aria-hidden="true">✓</span> A clear, accessible product photo</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AddProduct;
