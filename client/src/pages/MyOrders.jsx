import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';

const MyOrders = () => {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get('/orders/my-orders');
        setOrders(response.data.orders);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'Shipped':
        return 'bg-blue-100 text-blue-800';
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading orders...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      {searchParams.get('payment') === 'success' && (
        <p role="status" className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
          Payment verified successfully. Your order is being processed.
        </p>
      )}
      {searchParams.get('order') === 'placed' && (
        <p role="status" className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
          Your order was placed successfully.
        </p>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Order ID</p>
                    <p className="font-semibold">{order._id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-semibold">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.orderStatus)}`}>
                      {order.orderStatus}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="font-bold text-blue-600">
                      ₹{order.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-gray-100 pt-4 text-sm">
                  <p><span className="text-gray-500">Payment:</span> {order.paymentMethod || 'COD'}</p>
                  <p>
                    <span className="text-gray-500">Payment status:</span>{' '}
                    <span className={order.paymentStatus === 'paid' || order.paymentStatus === 'Completed' ? 'font-semibold text-green-700' : 'font-semibold text-amber-700'}>
                      {order.paymentStatus || 'Pending'}
                    </span>
                  </p>
                  {(order.transactionId || order.razorpayPaymentId) && (
                    <p className="break-all">
                      <span className="text-gray-500">Transaction ID:</span> {order.transactionId || order.razorpayPaymentId}
                    </p>
                  )}
                  {order.razorpayOrderId && (
                    <p className="break-all">
                      <span className="text-gray-500">Razorpay order:</span> {order.razorpayOrderId}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-6">
                <h3 className="font-semibold mb-4">Products</h3>
                <div className="space-y-4">
                  {order.products.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="ml-4">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-semibold">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-200">
                <h3 className="font-semibold mb-2">Shipping Address</h3>
                <p className="text-gray-600">
                  {order.shippingAddress.name}<br />
                  {order.shippingAddress.address}<br />
                  {order.shippingAddress.city}, {order.shippingAddress.state}<br />
                  PIN: {order.shippingAddress.pinCode}<br />
                  Phone: {order.shippingAddress.phone}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
