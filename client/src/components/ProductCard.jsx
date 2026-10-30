import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { resetPointerTilt, updatePointerTilt } from '../utils/pointerTilt';

const formatPrice = (price) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2
}).format(price);

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [imageUnavailable, setImageUnavailable] = useState(false);
  const rating = Number(product.rating);
  const inStock = Number(product.stock) > 0;
  const compareAtPrice = Number(product.compareAtPrice);
  const isOnSale = Number.isFinite(compareAtPrice) && compareAtPrice > Number(product.price);
  const discountPercent = isOnSale
    ? Math.round(((compareAtPrice - Number(product.price)) / compareAtPrice) * 100)
    : 0;

  useEffect(() => {
    if (!added) return undefined;
    const timeout = window.setTimeout(() => setAdded(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [added]);

  const handleAddToCart = () => {
    addToCart(product, 1);
    setAdded(true);
  };

  return (
    <article
      className="product-card-3d group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-200 hover:border-slate-300"
      onPointerMove={(event) => updatePointerTilt(event, 6)}
      onPointerLeave={resetPointerTilt}
    >
      <Link to={`/products/${product._id}`} className="relative block overflow-hidden bg-slate-100">
        <div className="aspect-[4/3]">
          {imageUnavailable || !product.image ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              Image unavailable
            </div>
          ) : (
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              onError={() => setImageUnavailable(true)}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            />
          )}
        </div>
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {isOnSale && (
            <span className="rounded-full bg-orange-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
              Diwali sale · {discountPercent}% off
            </span>
          )}
          {!inStock && (
            <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
              Out of stock
            </span>
          )}
          {inStock && Number(product.stock) < 10 && (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 shadow-sm">
              Only {product.stock} left
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="truncate text-xs font-medium uppercase tracking-wider text-slate-500">
            {product.category || 'Shop'}
          </span>
          {Number.isFinite(rating) && rating > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-slate-700" aria-label={`Rated ${rating.toFixed(1)} out of 5`}>
              <span className="text-amber-500" aria-hidden="true">★</span>
              {rating.toFixed(1)}
            </span>
          )}
        </div>
        <Link to={`/products/${product._id}`} className="text-sm font-semibold leading-5 text-slate-900 hover:text-emerald-800 sm:text-base">
          <h3 className="line-clamp-2">{product.name}</h3>
        </Link>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <p className="text-lg font-bold tracking-tight text-slate-950">
            {formatPrice(Number(product.price) || 0)}
          </p>
          {isOnSale && (
            <p className="text-sm text-slate-500 line-through">
              {formatPrice(compareAtPrice)}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!inStock}
          aria-live="polite"
          className={`cart-button mt-auto min-h-10 w-full rounded-lg bg-emerald-800 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 ${added ? 'is-added' : ''}`}
        >
          {!inStock ? 'Unavailable' : added ? 'Added to cart' : 'Add to cart'}
        </button>
      </div>
    </article>
  );
};

export default ProductCard;
