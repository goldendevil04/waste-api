import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Package,
  Recycle,
  Star,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  pointsRequired: number;
  description: string;
  features: string[];
  inStock: boolean;
  stockQuantity: number;
  rating: number;
  reviews: number;
}

interface Order {
  id: string;
  orderId: string;
  customerId: string;
  customerType: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  pointsUsed: number;
  orderDate: string;
  status: string;
  estimatedDelivery: string;
}

interface RecyclingCenter {
  id: string;
  name: string;
  address: string;
  area: string;
  phone: string;
  email: string;
  distance: number;
  acceptedMaterials: string[];
  rating: number;
  reviews: number;
  verified: boolean;
}

export default function ShopAndMarketplace() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [recyclingCenters, setRecyclingCenters] = useState<RecyclingCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'centers'>('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchShopData();
  }, []);

  const fetchShopData = async () => {
    try {
      // Simulated data since API might not have data yet
      const productsData: Product[] = [
        {
          id: '1',
          name: 'Basic Compost Kit',
          category: 'compost',
          price: 1500,
          pointsRequired: 150,
          description: 'Perfect for beginners. Includes compost bin, thermometer, and instruction manual.',
          features: ['20L compost bin with lid', 'Digital thermometer', 'pH testing strips', 'Instruction manual', '1 year warranty'],
          inStock: true,
          stockQuantity: 25,
          rating: 4.2,
          reviews: 18
        },
        {
          id: '2',
          name: '3-Bin Segregation Set',
          category: 'dustbin',
          price: 2500,
          pointsRequired: 250,
          description: 'Complete 3-bin set for organic, recyclable, and hazardous waste segregation.',
          features: ['Color-coded for easy segregation', 'Pedal operation', 'Tight-fitting lids', 'Easy to clean', '2 year warranty'],
          inStock: true,
          stockQuantity: 50,
          rating: 4.4,
          reviews: 25
        },
        {
          id: '3',
          name: 'Premium Electric Composter',
          category: 'compost',
          price: 8500,
          pointsRequired: 850,
          description: 'Electric composter with automatic mixing and temperature control.',
          features: ['Electric composter with automatic mixing', 'Temperature control system', 'Digital display panel', 'Smart sensor technology', '3 year warranty'],
          inStock: true,
          stockQuantity: 5,
          rating: 4.9,
          reviews: 8
        }
      ];

      const ordersData: Order[] = [
        {
          id: '1',
          orderId: 'KIT_001',
          customerId: 'CIT001',
          customerType: 'citizen',
          productName: 'Basic Compost Kit',
          quantity: 1,
          totalPrice: 1500,
          pointsUsed: 0,
          orderDate: '2024-01-15T10:30:00Z',
          status: 'delivered',
          estimatedDelivery: '2024-01-22T00:00:00Z'
        },
        {
          id: '2',
          orderId: 'DUST_002',
          customerId: 'BG001',
          customerType: 'bulk_generator',
          productName: '3-Bin Segregation Set',
          quantity: 5,
          totalPrice: 12500,
          pointsUsed: 500,
          orderDate: '2024-01-14T14:15:00Z',
          status: 'shipped',
          estimatedDelivery: '2024-01-19T00:00:00Z'
        },
        {
          id: '3',
          orderId: 'KIT_003',
          customerId: 'CIT002',
          customerType: 'citizen',
          productName: 'Premium Electric Composter',
          quantity: 1,
          totalPrice: 8500,
          pointsUsed: 850,
          orderDate: '2024-01-16T09:45:00Z',
          status: 'processing',
          estimatedDelivery: '2024-01-23T00:00:00Z'
        }
      ];

      const recyclingCentersData: RecyclingCenter[] = [
        {
          id: '1',
          name: 'EcoGreen Recycling Hub',
          address: 'Plot No. 45, Industrial Area, Phase-2',
          area: 'Industrial Area',
          phone: '9876543210',
          email: 'info@ecogreen.com',
          distance: 2.5,
          acceptedMaterials: ['plastic', 'paper', 'metal', 'electronic'],
          rating: 4.3,
          reviews: 28,
          verified: true
        },
        {
          id: '2',
          name: 'Green Planet Recyclers',
          address: 'B-12, Eco Park, Green Valley',
          area: 'Green Valley',
          phone: '9876543211',
          email: 'contact@greenplanet.com',
          distance: 5.8,
          acceptedMaterials: ['plastic', 'paper', 'glass', 'textile'],
          rating: 4.1,
          reviews: 35,
          verified: true
        },
        {
          id: '3',
          name: 'Metro Waste Solutions',
          address: '78, Recycling Street, Downtown',
          area: 'Downtown',
          phone: '9876543212',
          email: 'info@metrowaste.com',
          distance: 8.2,
          acceptedMaterials: ['metal', 'electronic', 'plastic'],
          rating: 3.9,
          reviews: 22,
          verified: false
        }
      ];

      setProducts(productsData);
      setOrders(ordersData);
      setRecyclingCenters(recyclingCentersData);
    } catch (error) {
      console.error('Error fetching shop data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      processing: 'bg-yellow-100 text-yellow-800',
      shipped: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || colors.processing}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      compost: 'bg-green-100 text-green-800',
      dustbin: 'bg-blue-100 text-blue-800',
      equipment: 'bg-purple-100 text-purple-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[category as keyof typeof colors] || colors.equipment}`}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </span>
    );
  };

  const getStockStatus = (stockQuantity: number) => {
    if (stockQuantity === 0) return { color: 'text-red-600', text: 'Out of Stock' };
    if (stockQuantity <= 5) return { color: 'text-yellow-600', text: 'Low Stock' };
    return { color: 'text-green-600', text: 'In Stock' };
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    const matchesStock = filterStatus === 'all' || 
                        (filterStatus === 'in_stock' && product.inStock) ||
                        (filterStatus === 'out_of_stock' && !product.inStock);
    return matchesSearch && matchesCategory && matchesStock;
  });

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredCenters = recyclingCenters.filter(center => {
    const matchesSearch = center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         center.area.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVerification = filterStatus === 'all' || 
                               (filterStatus === 'verified' && center.verified) ||
                               (filterStatus === 'unverified' && !center.verified);
    return matchesSearch && matchesVerification;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <ShoppingCart className="h-8 w-8 mr-3 text-cyan-600" />
              Shop & Marketplace
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage product catalog, orders, and recycling center network
            </p>
          </div>
          <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-md flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Add Product
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <Package className="h-6 w-6 text-cyan-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Products</p>
              <p className="text-2xl font-semibold text-gray-900">{products.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <p className="text-2xl font-semibold text-gray-900">{orders.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Recycle className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Recycling Centers</p>
              <p className="text-2xl font-semibold text-gray-900">{recyclingCenters.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Star className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Revenue (₹)</p>
              <p className="text-2xl font-semibold text-gray-900">
                {orders.reduce((sum, o) => sum + o.totalPrice, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('products')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'products'
                  ? 'border-cyan-500 text-cyan-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package className="h-5 w-5 inline mr-2" />
              Products ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'orders'
                  ? 'border-cyan-500 text-cyan-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ShoppingCart className="h-5 w-5 inline mr-2" />
              Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('centers')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'centers'
                  ? 'border-cyan-500 text-cyan-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Recycle className="h-5 w-5 inline mr-2" />
              Recycling Centers ({recyclingCenters.length})
            </button>
          </nav>
        </div>

        {/* Filters and Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder={
                    activeTab === 'products' ? 'Search by product name or description...' :
                    activeTab === 'orders' ? 'Search by order ID, customer ID, or product...' :
                    'Search by center name or area...'
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {activeTab === 'products' && (
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                >
                  <option value="all">All Categories</option>
                  <option value="compost">Compost Kits</option>
                  <option value="dustbin">Dustbins</option>
                  <option value="equipment">Equipment</option>
                </select>
              )}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
              >
                <option value="all">All Status</option>
                {activeTab === 'products' ? (
                  <>
                    <option value="in_stock">In Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </>
                ) : activeTab === 'orders' ? (
                  <>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </>
                ) : (
                  <>
                    <option value="verified">Verified</option>
                    <option value="unverified">Unverified</option>
                  </>
                )}
              </select>
              <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </button>
              <button className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Products Table */}
        {activeTab === 'products' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pricing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stockQuantity);

                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {product.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getCategoryBadge(product.category)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            ₹{product.price.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.pointsRequired} points
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className={`text-sm font-medium ${stockStatus.color}`}>
                            {stockStatus.text}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.stockQuantity} units
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" />
                          <span className="text-sm text-gray-900">{product.rating}</span>
                          <span className="text-sm text-gray-500 ml-1">({product.reviews})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Orders Table */}
        {activeTab === 'orders' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product & Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pricing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.orderId}
                        </div>
                        <div className="text-sm text-gray-500">
                          Delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.customerId}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.customerType.replace('_', ' ').charAt(0).toUpperCase() + order.customerType.replace('_', ' ').slice(1)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.productName}
                        </div>
                        <div className="text-sm text-gray-500">
                          Quantity: {order.quantity}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          ₹{order.totalPrice.toLocaleString()}
                        </div>
                        {order.pointsUsed > 0 && (
                          <div className="text-sm text-green-600">
                            -{order.pointsUsed} points used
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(order.orderDate).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Recycling Centers Table */}
        {activeTab === 'centers' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Center Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location & Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Accepted Materials
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Distance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating & Reviews
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verification
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCenters.map((center) => (
                  <tr key={center.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {center.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {center.id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                          {center.area}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Phone className="h-4 w-4 mr-1 text-gray-400" />
                          {center.phone}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Mail className="h-4 w-4 mr-1 text-gray-400" />
                          {center.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {center.acceptedMaterials.map((material, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {material}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {center.distance} km
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                        <span className="text-sm text-gray-900">{center.rating}</span>
                        <span className="text-sm text-gray-500 ml-1">({center.reviews})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {center.verified ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {((activeTab === 'products' && filteredProducts.length === 0) ||
          (activeTab === 'orders' && filteredOrders.length === 0) ||
          (activeTab === 'centers' && filteredCenters.length === 0)) && (
          <div className="text-center py-12">
            {activeTab === 'products' ? (
              <Package className="mx-auto h-12 w-12 text-gray-400" />
            ) : activeTab === 'orders' ? (
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
            ) : (
              <Recycle className="mx-auto h-12 w-12 text-gray-400" />
            )}
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No {activeTab} found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterCategory !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : `Get started by adding your first ${activeTab === 'products' ? 'product' : activeTab === 'orders' ? 'order' : 'recycling center'}.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}