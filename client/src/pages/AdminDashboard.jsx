import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const AdminDashboard = () => {
  const { isAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0
  });
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [reviewError, setReviewError] = useState('');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    compareAtPrice: '',
    category: 'Electronics',
    image: '',
    rating: '0',
    stock: ''
  });

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/');
      return;
    }
    fetchDashboardData();
  }, [isAuthenticated, isAdmin, navigate]);

  const fetchDashboardData = async () => {
    try {
      const [ordersRes, productsRes, usersRes] = await Promise.all([
        api.get('/orders'),
        api.get('/products'),
        api.get('/users')
      ]);

      const orders = ordersRes.data.orders;
      const products = productsRes.data.products;
      const users = usersRes.data.users;

      const totalRevenue = orders
        .filter(order => order.orderStatus !== 'Cancelled')
        .reduce((sum, order) => sum + order.totalAmount, 0);

      setStats({
        totalProducts: products.length,
        totalOrders: orders.length,
        totalUsers: users.length,
        totalRevenue
      });

      setOrders(orders);
      setProducts(products);
      setUsers(users);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const handleSellerReview = async (seller, status) => {
    setReviewError('');
    let notes = '';
    if (status === 'rejected') {
      const reason = window.prompt('Optional: add a reason for the seller.');
      if (reason === null) return;
      notes = reason.trim();
    }

    try {
      await api.patch(`/users/${seller._id}/verification`, { status, notes });
      await fetchDashboardData();
    } catch (error) {
      console.error('Could not update seller verification:', error);
      setReviewError(error.response?.data?.message || 'Could not update seller verification. Please try again.');
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const price = Number(productForm.price);
      const compareAtPrice = productForm.compareAtPrice === '' ? null : Number(productForm.compareAtPrice);
      if (compareAtPrice !== null && (!Number.isFinite(compareAtPrice) || compareAtPrice <= price)) {
        window.alert('The original price must be greater than the selling price.');
        return;
      }

      const productData = {
        ...productForm,
        price,
        compareAtPrice,
        rating: parseFloat(productForm.rating),
        stock: parseInt(productForm.stock)
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, productData);
      } else {
        await api.post('/products', productData);
      }

      setShowProductForm(false);
      setEditingProduct(null);
      setProductForm({
        name: '',
        description: '',
        price: '',
        compareAtPrice: '',
        category: 'Electronics',
        image: '',
        rating: '0',
        stock: ''
      });
      fetchDashboardData();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product');
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      compareAtPrice: product.compareAtPrice?.toString() || '',
      category: product.category,
      image: product.image,
      rating: product.rating.toString(),
      stock: product.stock.toString()
    });
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${productId}`);
        fetchDashboardData();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product');
      }
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { orderStatus: status });
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

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
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Tabs */}
      <div className="flex space-x-4 mb-8 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'dashboard'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'products'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600'
          }`}
        >
          Products
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'orders'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600'
          }`}
        >
          Orders
        </button>
        <button
          onClick={() => setActiveTab('sellers')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'sellers'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600'
          }`}
        >
          Sellers
        </button>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-600">Total Products</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalProducts}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-600">Total Orders</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalOrders}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-600">Total Users</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalUsers}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-600">Total Revenue</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              ${stats.totalRevenue.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Products</h2>
            <button
              onClick={() => {
                setEditingProduct(null);
                setProductForm({
                  name: '',
                  description: '',
                  price: '',
                  compareAtPrice: '',
                  category: 'Electronics',
                  image: '',
                  rating: '0',
                  stock: ''
                });
                setShowProductForm(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
            >
              Add Product
            </button>
          </div>

          {showProductForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-xl font-bold mb-4">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <form onSubmit={handleProductSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      required
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Electronics">Electronics</option>
                      <option value="Clothing">Clothing</option>
                      <option value="Shoes">Shoes</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Home">Home</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Original price (optional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={productForm.compareAtPrice}
                      onChange={(e) => setProductForm({ ...productForm, compareAtPrice: e.target.value })}
                      placeholder="Set higher than the selling price for a sale"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">A higher original price includes this item in Diwali offers.</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={productForm.image}
                      onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rating (0-5)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={productForm.rating}
                      onChange={(e) => setProductForm({ ...productForm, rating: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex space-x-4 mt-6">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
                  >
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProductForm(false);
                      setEditingProduct(null);
                    }}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.stock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'sellers' && (
        <section aria-labelledby="seller-review-heading">
          <h2 id="seller-review-heading" className="mb-2 text-2xl font-bold">Seller verification</h2>
          <p className="mb-6 text-sm text-gray-600">Review business details after sellers verify their phone number.</p>
          {reviewError && (
            <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {reviewError}
            </p>
          )}
          {users.filter((account) => account.role === 'seller').length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-600">
              No seller accounts to review yet.
            </div>
          ) : (
            <div className="space-y-4">
              {users.filter((account) => account.role === 'seller').map((seller) => {
                const canApprove = seller.isPhoneVerified === true &&
                  Boolean(seller.businessName && seller.businessAddress);
                return (
                  <article key={seller._id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col justify-between gap-4 md:flex-row">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">{seller.businessName || 'Business details missing'}</h3>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            seller.verificationStatus === 'verified'
                              ? 'bg-green-100 text-green-800'
                              : seller.verificationStatus === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-900'
                          }`}>
                            {seller.verificationStatus || 'pending'}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">{seller.name} · {seller.email}</p>
                        <p className="mt-1 text-sm text-gray-600">Phone: {seller.phone || seller.businessPhone || 'Not provided'}</p>
                        <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">{seller.businessAddress || 'No business address submitted.'}</p>
                        {seller.gstNumber && <p className="mt-2 text-sm text-gray-600">GSTIN: {seller.gstNumber}</p>}
                        <p className="mt-3 text-sm">
                          <span className={seller.isPhoneVerified ? 'text-green-700' : 'text-amber-700'}>
                            Phone {seller.isPhoneVerified ? 'verified' : 'not verified'}
                          </span>
                        </p>
                        {seller.verificationNotes && (
                          <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">
                            Review note: {seller.verificationNotes}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-start gap-2">
                        {seller.verificationStatus !== 'verified' && (
                          <button
                            type="button"
                            disabled={!canApprove}
                            onClick={() => handleSellerReview(seller, 'verified')}
                            title={!canApprove ? 'Email, phone, and business details must be complete first.' : 'Approve seller'}
                            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                          >
                            Approve
                          </button>
                        )}
                        {seller.verificationStatus !== 'rejected' && (
                          <button
                            type="button"
                            onClick={() => handleSellerReview(seller, 'rejected')}
                            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Orders</h2>
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
                      <p className="text-sm text-gray-500">Customer</p>
                      <p className="font-semibold">{order.user?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-semibold">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <select
                        value={order.orderStatus}
                        onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-sm font-medium border-0 ${getStatusColor(order.orderStatus)}`}
                      >
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="font-bold text-blue-600">
                        ${order.totalAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="font-semibold mb-4">Products</h3>
                  <div className="space-y-2">
                    {order.products.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span>{item.name} x {item.quantity}</span>
                        <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
