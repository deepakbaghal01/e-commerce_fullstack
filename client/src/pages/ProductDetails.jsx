import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import BackButton from '../components/BackButton';

const formatPrice = (price) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2
}).format(price);

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`);
        setProduct(response.data.product);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching product:', error);
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (product && product.stock > 0) {
      addToCart(product, quantity);
      navigate('/cart');
    }
  };

  const handleQuantityChange = (e) => {
    const newQuantity = parseInt(e.target.value);
    if (newQuantity > 0 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!product) {
    return <div className="text-center py-8">Product not found</div>;
  }

  const compareAtPrice = Number(product.compareAtPrice);
  const isOnSale = Number.isFinite(compareAtPrice) && compareAtPrice > Number(product.price);
  const discountPercent = isOnSale
    ? Math.round(((compareAtPrice - Number(product.price)) / compareAtPrice) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <BackButton className="mb-4" />

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
          {/* Product Image */}
          <div>
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-auto rounded-lg"
            />
          </div>

          {/* Product Info */}
          <div>
            {isOnSale && (
              <span className="mb-3 inline-flex rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-800">
                Diwali offer · Save {discountPercent}%
              </span>
            )}
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              {product.name}
            </h1>
            <p className="text-gray-600 mb-4">{product.description}</p>
            
            <div className="flex items-center mb-4">
              <span className="text-yellow-500 text-2xl">★</span>
              <span className="text-gray-600 ml-2 text-lg">{product.rating}</span>
            </div>

            <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="text-3xl font-bold text-blue-600">
                {formatPrice(Number(product.price) || 0)}
              </p>
              {isOnSale && (
                <p className="text-lg text-gray-500 line-through">
                  {formatPrice(compareAtPrice)}
                </p>
              )}
            </div>

            <div className="mb-4">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
              </span>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                max={product.stock}
                value={quantity}
                onChange={handleQuantityChange}
                className="w-24 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={product.stock === 0}
              />
            </div>

            <button
              onClick={handleAddToCart}
              className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={product.stock === 0}
            >
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Category: <span className="font-medium text-gray-700">{product.category}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
