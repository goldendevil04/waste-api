import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  MapPin,
  Zap,
  Recycle,
  Leaf,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface Facility {
  id: string;
  name: string;
  type: string;
  capacity: number;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  ulbId: string;
  operatorName: string;
  contactInfo: {
    phone: string;
    email: string;
  };
  currentLoad: number;
  efficiency: number;
  totalProcessed: number;
  status: string;
  registrationDate: string;
}

export default function FacilityManagement() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      // Simulated data since API might not have data yet
      const facilitiesData: Facility[] = [
        {
          id: '1',
          name: 'Green Valley Composting Plant',
          type: 'composting',
          capacity: 50,
          location: {
            lat: 28.6139,
            lng: 77.2090,
            address: 'Plot No. 15, Industrial Area, Phase-1'
          },
          ulbId: 'ULB001',
          operatorName: 'EcoWaste Solutions Pvt Ltd',
          contactInfo: {
            phone: '9876543210',
            email: 'operations@ecowaste.com'
          },
          currentLoad: 38.5,
          efficiency: 87.3,
          totalProcessed: 2847.5,
          status: 'active',
          registrationDate: '2024-01-01'
        },
        {
          id: '2',
          name: 'Metro Biomethanization Unit',
          type: 'biomethanization',
          capacity: 75,
          location: {
            lat: 28.5355,
            lng: 77.3910,
            address: 'Sector 12, Waste Management Complex'
          },
          ulbId: 'ULB001',
          operatorName: 'BioEnergy Systems Ltd',
          contactInfo: {
            phone: '9876543211',
            email: 'info@bioenergy.com'
          },
          currentLoad: 62.8,
          efficiency: 92.1,
          totalProcessed: 4521.2,
          status: 'active',
          registrationDate: '2024-01-01'
        },
        {
          id: '3',
          name: 'City Waste-to-Energy Plant',
          type: 'wte',
          capacity: 200,
          location: {
            lat: 28.4595,
            lng: 77.0266,
            address: 'Industrial Zone, Outer Ring Road'
          },
          ulbId: 'ULB001',
          operatorName: 'PowerGen Waste Solutions',
          contactInfo: {
            phone: '9876543212',
            email: 'operations@powergen.com'
          },
          currentLoad: 156.3,
          efficiency: 78.9,
          totalProcessed: 8934.7,
          status: 'active',
          registrationDate: '2024-01-01'
        },
        {
          id: '4',
          name: 'Central Recycling Facility',
          type: 'recycling',
          capacity: 100,
          location: {
            lat: 28.7041,
            lng: 77.1025,
            address: 'Recycling Hub, North Industrial Area'
          },
          ulbId: 'ULB001',
          operatorName: 'RecycleTech Industries',
          contactInfo: {
            phone: '9876543213',
            email: 'contact@recycletech.com'
          },
          currentLoad: 45.2,
          efficiency: 85.6,
          totalProcessed: 3256.8,
          status: 'maintenance',
          registrationDate: '2024-01-01'
        }
      ];

      setFacilities(facilitiesData);
    } catch (error) {
      console.error('Error fetching facilities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      inactive: 'bg-gray-100 text-gray-800',
      under_construction: 'bg-blue-100 text-blue-800'
    };

    const icons = {
      active: CheckCircle,
      maintenance: AlertTriangle,
      inactive: AlertTriangle,
      under_construction: Building2
    };

    const Icon = icons[status as keyof typeof icons] || CheckCircle;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || colors.active}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      composting: 'bg-green-100 text-green-800',
      biomethanization: 'bg-blue-100 text-blue-800',
      wte: 'bg-orange-100 text-orange-800',
      recycling: 'bg-purple-100 text-purple-800',
      landfill: 'bg-gray-100 text-gray-800'
    };

    const icons = {
      composting: Leaf,
      biomethanization: Zap,
      wte: Zap,
      recycling: Recycle,
      landfill: Building2
    };

    const Icon = icons[type as keyof typeof icons] || Building2;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[type as keyof typeof colors] || colors.composting}`}>
        <Icon className="h-3 w-3 mr-1" />
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 85) return 'text-green-600';
    if (efficiency >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'text-red-600';
    if (utilization >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const filteredFacilities = facilities.filter(facility => {
    const matchesSearch = facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         facility.operatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         facility.location.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || facility.type === filterType;
    const matchesStatus = filterStatus === 'all' || facility.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
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
              <Building2 className="h-8 w-8 mr-3 text-purple-600" />
              Waste Treatment Facilities
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor and manage waste treatment facilities and processing operations
            </p>
          </div>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Add Facility
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Building2 className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Facilities</p>
              <p className="text-2xl font-semibold text-gray-900">{facilities.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Facilities</p>
              <p className="text-2xl font-semibold text-gray-900">
                {facilities.filter(f => f.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Capacity (TPD)</p>
              <p className="text-2xl font-semibold text-gray-900">
                {facilities.reduce((sum, f) => sum + f.capacity, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Zap className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg. Efficiency</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Math.round(facilities.reduce((sum, f) => sum + f.efficiency, 0) / Math.max(facilities.length, 1))}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by facility name, operator, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">All Types</option>
              <option value="composting">Composting</option>
              <option value="biomethanization">Biomethanization</option>
              <option value="wte">Waste-to-Energy</option>
              <option value="recycling">Recycling</option>
              <option value="landfill">Landfill</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
              <option value="under_construction">Under Construction</option>
            </select>
            <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </button>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Facilities Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Facility Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type & Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Operator & Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacity & Load
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
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
              {filteredFacilities.map((facility) => {
                const utilizationPercentage = (facility.currentLoad / facility.capacity) * 100;

                return (
                  <tr key={facility.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {facility.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {facility.id}
                        </div>
                        <div className="text-sm text-gray-500">
                          Registered: {new Date(facility.registrationDate).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {getTypeBadge(facility.type)}
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-1" />
                          {facility.location.address}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {facility.operatorName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {facility.contactInfo.phone}
                        </div>
                        <div className="text-sm text-gray-500">
                          {facility.contactInfo.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">
                          {facility.capacity} TPD capacity
                        </div>
                        <div className={`text-sm font-medium ${getUtilizationColor(utilizationPercentage)}`}>
                          {facility.currentLoad} TPD current
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              utilizationPercentage >= 90 ? 'bg-red-600' :
                              utilizationPercentage >= 70 ? 'bg-yellow-600' : 'bg-green-600'
                            }`}
                            style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {Math.round(utilizationPercentage)}% utilized
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className={`text-sm font-medium ${getEfficiencyColor(facility.efficiency)}`}>
                          {facility.efficiency}% efficiency
                        </div>
                        <div className="text-sm text-gray-500">
                          {facility.totalProcessed.toLocaleString()} tons processed
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              facility.efficiency >= 85 ? 'bg-green-600' :
                              facility.efficiency >= 70 ? 'bg-yellow-600' : 'bg-red-600'
                            }`}
                            style={{ width: `${facility.efficiency}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(facility.status)}
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

        {filteredFacilities.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No facilities found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by adding your first waste treatment facility.'}
            </p>
          </div>
        )}
      </div>

      {/* Facility Type Distribution */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Facility Type Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {['composting', 'biomethanization', 'wte', 'recycling', 'landfill'].map(type => {
            const count = facilities.filter(f => f.type === type).length;
            const totalCapacity = facilities
              .filter(f => f.type === type)
              .reduce((sum, f) => sum + f.capacity, 0);

            return (
              <div key={type} className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-500 capitalize">{type}</div>
                <div className="text-xs text-gray-400">{totalCapacity} TPD capacity</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}