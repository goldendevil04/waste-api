import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Navigation,
  Fuel
} from 'lucide-react';

interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  capacity: number;
  driverId: string;
  areaAssigned: string[];
  fuelType: string;
  status: string;
  currentLocation?: {
    lat: number;
    lng: number;
  };
  totalTrips: number;
  totalWasteCollected: number;
  lastMaintenance?: string;
}

interface Route {
  id: string;
  routeId: string;
  areaId: string;
  vehicleId: string;
  date: string;
  totalStops: number;
  estimatedDuration: string;
  status: string;
}

export default function CollectionManagement() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'vehicles' | 'routes'>('vehicles');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchCollectionData();
  }, []);

  const fetchCollectionData = async () => {
    try {
      // Simulated data since API might not have data yet
      const vehiclesData: Vehicle[] = [
        {
          id: '1',
          vehicleNumber: 'WM-001',
          vehicleType: 'compactor',
          capacity: 5,
          driverId: 'DRV001',
          areaAssigned: ['Sector 1', 'Sector 2'],
          fuelType: 'diesel',
          status: 'active',
          currentLocation: { lat: 28.6139, lng: 77.2090 },
          totalTrips: 145,
          totalWasteCollected: 2847.5,
          lastMaintenance: '2024-01-10'
        },
        {
          id: '2',
          vehicleNumber: 'WM-002',
          vehicleType: 'truck',
          capacity: 8,
          driverId: 'DRV002',
          areaAssigned: ['Sector 3', 'Sector 4'],
          fuelType: 'cng',
          status: 'on_route',
          currentLocation: { lat: 28.5355, lng: 77.3910 },
          totalTrips: 98,
          totalWasteCollected: 1956.2,
          lastMaintenance: '2024-01-08'
        },
        {
          id: '3',
          vehicleNumber: 'WM-003',
          vehicleType: 'tipper',
          capacity: 3,
          driverId: 'DRV003',
          areaAssigned: ['Downtown'],
          fuelType: 'electric',
          status: 'maintenance',
          totalTrips: 67,
          totalWasteCollected: 1234.8,
          lastMaintenance: '2024-01-15'
        }
      ];

      const routesData: Route[] = [
        {
          id: '1',
          routeId: 'ROUTE_001',
          areaId: 'Sector 1',
          vehicleId: '1',
          date: '2024-01-16',
          totalStops: 25,
          estimatedDuration: '3 hours',
          status: 'completed'
        },
        {
          id: '2',
          routeId: 'ROUTE_002',
          areaId: 'Sector 3',
          vehicleId: '2',
          date: '2024-01-16',
          totalStops: 18,
          estimatedDuration: '2.5 hours',
          status: 'in_progress'
        },
        {
          id: '3',
          routeId: 'ROUTE_003',
          areaId: 'Downtown',
          vehicleId: '3',
          date: '2024-01-16',
          totalStops: 12,
          estimatedDuration: '2 hours',
          status: 'scheduled'
        }
      ];

      setVehicles(vehiclesData);
      setRoutes(routesData);
    } catch (error) {
      console.error('Error fetching collection data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, type: 'vehicle' | 'route' = 'vehicle') => {
    const vehicleColors = {
      active: 'bg-green-100 text-green-800',
      on_route: 'bg-blue-100 text-blue-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      out_of_service: 'bg-red-100 text-red-800'
    };

    const routeColors = {
      scheduled: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };

    const colors = type === 'vehicle' ? vehicleColors : routeColors;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || colors.active || colors.scheduled}`}>
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </span>
    );
  };

  const getVehicleTypeBadge = (type: string) => {
    const colors = {
      compactor: 'bg-blue-100 text-blue-800',
      truck: 'bg-green-100 text-green-800',
      tipper: 'bg-purple-100 text-purple-800',
      auto: 'bg-orange-100 text-orange-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[type as keyof typeof colors] || colors.truck}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  const getFuelTypeBadge = (type: string) => {
    const colors = {
      diesel: 'bg-gray-100 text-gray-800',
      cng: 'bg-green-100 text-green-800',
      electric: 'bg-blue-100 text-blue-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[type as keyof typeof colors] || colors.diesel}`}>
        {type.toUpperCase()}
      </span>
    );
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.driverId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || vehicle.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredRoutes = routes.filter(route => {
    const matchesSearch = route.routeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.areaId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || route.status === filterStatus;
    return matchesSearch && matchesStatus;
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
              <Truck className="h-8 w-8 mr-3 text-indigo-600" />
              Collection & Transportation
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage waste collection vehicles, routes, and transportation logistics
            </p>
          </div>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Add Vehicle
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Truck className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Vehicles</p>
              <p className="text-2xl font-semibold text-gray-900">{vehicles.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Vehicles</p>
              <p className="text-2xl font-semibold text-gray-900">
                {vehicles.filter(v => v.status === 'active' || v.status === 'on_route').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Navigation className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Routes Today</p>
              <p className="text-2xl font-semibold text-gray-900">{routes.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Waste Collected (kg)</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Math.round(vehicles.reduce((sum, v) => sum + v.totalWasteCollected, 0))}
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
              onClick={() => setActiveTab('vehicles')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'vehicles'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Truck className="h-5 w-5 inline mr-2" />
              Vehicles ({vehicles.length})
            </button>
            <button
              onClick={() => setActiveTab('routes')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'routes'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Navigation className="h-5 w-5 inline mr-2" />
              Routes ({routes.length})
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
                  placeholder={activeTab === 'vehicles' ? 'Search by vehicle number or driver ID...' : 'Search by route ID or area...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Status</option>
                {activeTab === 'vehicles' ? (
                  <>
                    <option value="active">Active</option>
                    <option value="on_route">On Route</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="out_of_service">Out of Service</option>
                  </>
                ) : (
                  <>
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </>
                )}
              </select>
              <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </button>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Vehicles Table */}
        {activeTab === 'vehicles' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type & Fuel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Areas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Maintenance
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
                {filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {vehicle.vehicleNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          Driver: {vehicle.driverId}
                        </div>
                        <div className="text-sm text-gray-500">
                          Capacity: {vehicle.capacity} tons
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {getVehicleTypeBadge(vehicle.vehicleType)}
                        {getFuelTypeBadge(vehicle.fuelType)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {vehicle.areaAssigned.map((area, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            <MapPin className="h-3 w-3 mr-1" />
                            {area}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {vehicle.totalTrips} trips
                        </div>
                        <div className="text-sm text-gray-500">
                          {vehicle.totalWasteCollected.toLocaleString()} kg collected
                        </div>
                        <div className="text-sm text-gray-500">
                          Avg: {Math.round(vehicle.totalWasteCollected / Math.max(vehicle.totalTrips, 1))} kg/trip
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {vehicle.lastMaintenance ? (
                          <>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1 text-gray-400" />
                              {new Date(vehicle.lastMaintenance).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {Math.floor((Date.now() - new Date(vehicle.lastMaintenance).getTime()) / (1000 * 60 * 60 * 24))} days ago
                            </div>
                          </>
                        ) : (
                          <span className="text-gray-500">Not scheduled</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(vehicle.status, 'vehicle')}
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

        {/* Routes Table */}
        {activeTab === 'routes' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Area & Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Schedule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stops & Duration
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
                {filteredRoutes.map((route) => {
                  const vehicle = vehicles.find(v => v.id === route.vehicleId);
                  
                  return (
                    <tr key={route.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {route.routeId}
                          </div>
                          <div className="text-sm text-gray-500">
                            Route ID: {route.id}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="flex items-center text-sm font-medium text-gray-900">
                            <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                            {route.areaId}
                          </div>
                          <div className="text-sm text-gray-500">
                            Vehicle: {vehicle?.vehicleNumber || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Clock className="h-4 w-4 mr-1 text-gray-400" />
                          {new Date(route.date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {route.totalStops} stops
                          </div>
                          <div className="text-sm text-gray-500">
                            Est. {route.estimatedDuration}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(route.status, 'route')}
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

        {/* Empty State */}
        {((activeTab === 'vehicles' && filteredVehicles.length === 0) ||
          (activeTab === 'routes' && filteredRoutes.length === 0)) && (
          <div className="text-center py-12">
            {activeTab === 'vehicles' ? (
              <Truck className="mx-auto h-12 w-12 text-gray-400" />
            ) : (
              <Navigation className="mx-auto h-12 w-12 text-gray-400" />
            )}
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No {activeTab} found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : `Get started by adding your first ${activeTab === 'vehicles' ? 'vehicle' : 'route'}.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}