import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const loadRazorpayCheckout = () => new Promise((resolve, reject) => {
  if (window.Razorpay) {
    resolve(true);
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.async = true;
  script.onload = () => resolve(true);
  script.onerror = () => reject(new Error('Razorpay Checkout could not be loaded. Check your connection and try again.'));
  document.body.appendChild(script);
});

const getCheckoutSessionId = (cartSignature) => {
  const sessionId = window.crypto.randomUUID();
  try {
    const storedCartSignature = window.sessionStorage.getItem('checkoutCartSignature');
    const storedSessionId = window.sessionStorage.getItem('checkoutSessionId');
    if (storedCartSignature === cartSignature && storedSessionId) return storedSessionId;

    window.sessionStorage.setItem('checkoutCartSignature', cartSignature);
    window.sessionStorage.setItem('checkoutSessionId', sessionId);
  } catch (storageError) {
    console.warn('Checkout retry identifier could not be persisted:', storageError);
  }
  return sessionId;
};

const clearCheckoutSession = () => {
  try {
    window.sessionStorage.removeItem('checkoutCartSignature');
    window.sessionStorage.removeItem('checkoutSessionId');
  } catch (storageError) {
    console.warn('Checkout retry identifier could not be cleared:', storageError);
  }
};

const Checkout = () => {
  const { cart, getSubtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const cartSignature = JSON.stringify(
    cart.map((item) => [item.product, item.quantity]).sort(([a], [b]) => a.localeCompare(b))
  );
  const checkoutSession = useRef(null);
  if (!checkoutSession.current || checkoutSession.current.cartSignature !== cartSignature) {
    checkoutSession.current = {
      cartSignature,
      id: getCheckoutSessionId(cartSignature)
    };
  }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pinCode: '',
    paymentMethod: 'COD'
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (cart.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        products: cart,
        shippingAddress: {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pinCode: formData.pinCode
        },
        paymentMethod: formData.paymentMethod
      };

      if (formData.paymentMethod === 'COD') {
        const response = await api.post('/orders', orderData);
        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to place order.');
        }
        clearCart();
        clearCheckoutSession();
        navigate('/my-orders?order=placed');
        return;
      }

      const { data } = await api.post('/orders/razorpay/order', {
        ...orderData,
        checkoutSessionId: checkoutSession.current.id
      });

      await loadRazorpayCheckout();
      const paymentWindow = new window.Razorpay({
        key: data.keyId,
        amount: data.razorpayOrder.amount,
        currency: data.razorpayOrder.currency,
        name: 'E-Commerce Store',
        description: `Order ${data.order._id}`,
        order_id: data.razorpayOrder.id,
        prefill: {
          name: formData.name,
          email: user?.email || '',
          contact: formData.phone
        },
        notes: { orderId: data.order._id },
        theme: { color: '#2563eb' },
        modal: {
          ondismiss: () => {
            if (!failureHandled) {
              setLoading(false);
              setError('Payment was cancelled or the payment window was closed. You can retry from checkout.');
            }
          }
        },
        handler: async (paymentResponse) => {
          setLoading(true);
          setError('');
          try {
            await api.post('/orders/razorpay/verify', {
              orderId: data.order._id,
              ...paymentResponse
            });
            clearCart();
            clearCheckoutSession();
            navigate('/my-orders?payment=success');
          } catch (verificationError) {
            setError(
              verificationError.response?.data?.message ||
              'Payment was submitted, but confirmation is pending. Check My Orders before trying again.'
            );
            setLoading(false);
          }
        }
      });
      let failureHandled = false;
      paymentWindow.on('payment.failed', async (failure) => {
        failureHandled = true;
        try {
          await api.post('/orders/razorpay/failure', {
            orderId: data.order._id,
            razorpayOrderId: data.razorpayOrder.id
          });
        } catch (failureError) {
          console.error('Could not record Razorpay payment failure:', failureError);
        }
        setLoading(false);
        setError(failure.error?.description || 'Payment failed. Your order is unpaid; please retry.');
      });
      setLoading(false);
      paymentWindow.open();
    } catch (requestError) {
      console.error('Could not place order:', requestError);
      setError(requestError.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Checkout</h1>
          <p className="text-gray-500 text-lg mb-8">Your cart is empty</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-6">Shipping Information</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PIN Code
                  </label>
                  <input
                    type="text"
                    name="pinCode"
                    value={formData.pinCode}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="COD">Cash on Delivery</option>
                    <option value="Razorpay">Online payment (UPI, cards and more)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition font-semibold mt-6 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Preparing secure checkout...' : formData.paymentMethod === 'COD' ? 'Place Order' : 'Pay securely'}
              </button>
            </form>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.product} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="ml-3">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-semibold">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">₹{getSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-semibold">Free</span>
                </div>
                <div className="flex justify-between text-lg font-bold mt-2">
                  <span>Total</span>
                  <span className="text-blue-600">₹{getSubtotal().toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-500">
                  Online payment totals are calculated securely from current product prices.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
