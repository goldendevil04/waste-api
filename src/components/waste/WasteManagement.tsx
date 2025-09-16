import React, { useState, useEffect } from 'react';
import {
  Trash2,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Home,
  Building,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Scale
} from 'lucide-react';

interface Household {
  id: string;
  citizenId: string;
  householdSize: number;
  wasteGenerationEstimate: number;
  segregationCapability: string;
  composting: boolean;
  segregationCompliance: {
    score: number;
    lastAssessment: string;
    violations: any[];
  };
  registrationDate: string;
  status: string;
}

interface BulkGenerator {
  id: string;
  organizationName: string;
  organizationType: string;
  contactPerson: string;
  phone: string;
  email: string;
  dailyWasteGeneration: number;
  wasteTypes: string[];
  compliance: {
    segregationScore: number;
    lastAudit: string;
    violations: any[];
  };
  registrationDate: string;
  status: string;
}

export default function WasteManagement() {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [bulkGenerators, setBulkGenerators] = useState<BulkGenerator[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'households' | 'bulk'>('households');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchWasteData();
  }, []);

  const fetchWasteData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch households (simulated data since API might not have data yet)
      const householdsData: Household[] = [
        {
          id: '1',
          citizenId: 'CIT001',
          householdSize: 4,
          wasteGenerationEstimate: 2.5,
          segregationCapability: 'good',
          composting: true,
          segregationCompliance: {
            score: 85,
            lastAssessment: '2024-01-15',
            violations: []
          },
          registrationDate: '2024-01-01',
          status: 'active'
        },
        {
          id: '2',
          citizenId: 'CIT002',
          householdSize: 2,
          wasteGenerationEstimate: 1.8,
          segregationCapability: 'excellent',
          composting: false,
          segregationCompliance: {
            score: 92,
            lastAssessment: '2024-01-14',
            violations: []
          },
          registrationDate: '2024-01-02',
          status: 'active'
        }
      ];

      const bulkGeneratorsData: BulkGenerator[] = [
        {
          id: '1',
          organizationName: 'Green Valley Restaurant',
          organizationType: 'restaurant',
          contactPerson: 'John Doe',
          phone: '9876543210',
          email: 'john@greenvalley.com',
          dailyWasteGeneration: 25.5,
          wasteTypes: ['organic', 'recyclable'],
          compliance: {
            segregationScore: 78,
            lastAudit: '2024-01-10',
            violations: []
          },
          registrationDate: '2024-01-01',
          status: 'active'
        },
        {
          id: '2',
          organizationName: 'Tech Plaza Mall',
          organizationType: 'mall',
          contactPerson: 'Jane Smith',
          phone: '9876543211',
          email: 'jane@techplaza.com',
          dailyWasteGeneration: 150.0,
          wasteTypes: ['organic', 'recyclable', 'electronic'],
          compliance: {
            segregationScore: 88,
            lastAudit: '2024-01-12',
            violations: []
          },
          registrationDate: '2024-01-01',
          status: 'active'
        }
      ];

      setHouseholds(householdsData);
      setBulkGenerators(bulkGeneratorsData);
    } catch (error) {
      console.error('Error fetching waste data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || colors.active}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getComplianceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCapabilityBadge = (capability: string) => {
    const colors = {
      excellent: 'bg-green-100 text-green-800',
      good: 'bg-blue-100 text-blue-800',
      average: 'bg-yellow-100 text-yellow-800',
      poor: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[capability as keyof typeof colors] || colors.average}`}>
        {capability.charAt(0).toUpperCase() + capability.slice(1)}
      </span>
    );
  };

  const filteredHouseholds = households.filter(household => {
    const matchesSearch = household.citizenId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || household.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredBulkGenerators = bulkGenerators.filter(generator => {
    const matchesSearch = generator.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         generator.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         generator.phone.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || generator.status === filterStatus;
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
              <Trash2 className="h-8 w-8 mr-3 text-orange-600" />
              Waste Generation & Source Segregation
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage household and bulk generator waste registration and compliance
            </p>
          </div>
          <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Register Generator
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Home className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Households</p>
              <p className="text-2xl font-semibold text-gray-900">{households.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Building className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Bulk Generators</p>
              <p className="text-2xl font-semibold text-gray-900">{bulkGenerators.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Scale className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Daily Waste (kg)</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Math.round(
                  households.reduce((sum, h) => sum + h.wasteGenerationEstimate, 0) +
                  bulkGenerators.reduce((sum, bg) => sum + bg.dailyWasteGeneration, 0)
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg. Compliance</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Math.round(
                  (households.reduce((sum, h) => sum + h.segregationCompliance.score, 0) +
                   bulkGenerators.reduce((sum, bg) => sum + bg.compliance.segregationScore, 0)) /
                  Math.max(households.length + bulkGenerators.length, 1)
                )}%
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
              onClick={() => setActiveTab('households')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'households'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Home className="h-5 w-5 inline mr-2" />
              Households ({households.length})
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'bulk'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Building className="h-5 w-5 inline mr-2" />
              Bulk Generators ({bulkGenerators.length})
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
                  placeholder={activeTab === 'households' ? 'Search by citizen ID...' : 'Search by organization name, contact person, or phone...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
              <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </button>
              <button className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Households Table */}
        {activeTab === 'households' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Household Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Waste Generation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Segregation Capability
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Compliance Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Composting
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
                {filteredHouseholds.map((household) => (
                  <tr key={household.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Citizen ID: {household.citizenId}
                        </div>
                        <div className="text-sm text-gray-500">
                          {household.householdSize} members
                        </div>
                        <div className="text-sm text-gray-500">
                          Registered: {new Date(household.registrationDate).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {household.wasteGenerationEstimate} kg/day
                      </div>
                      <div className="text-sm text-gray-500">
                        {(household.wasteGenerationEstimate / household.householdSize).toFixed(1)} kg/person
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getCapabilityBadge(household.segregationCapability)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${getComplianceColor(household.segregationCompliance.score)}`}>
                        {household.segregationCompliance.score}%
                      </div>
                      <div className="text-sm text-gray-500">
                        Last assessed: {new Date(household.segregationCompliance.lastAssessment).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {household.composting ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <span className="text-sm text-gray-500">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(household.status)}
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

        {/* Bulk Generators Table */}
        {activeTab === 'bulk' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organization Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact Information
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Waste Generation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Waste Types
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Compliance Score
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
                {filteredBulkGenerators.map((generator) => (
                  <tr key={generator.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {generator.organizationName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {generator.organizationType.charAt(0).toUpperCase() + generator.organizationType.slice(1)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Registered: {new Date(generator.registrationDate).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {generator.contactPerson}
                        </div>
                        <div className="text-sm text-gray-500">{generator.phone}</div>
                        <div className="text-sm text-gray-500">{generator.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {generator.dailyWasteGeneration} kg/day
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {generator.wasteTypes.map((type, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${getComplianceColor(generator.compliance.segregationScore)}`}>
                        {generator.compliance.segregationScore}%
                      </div>
                      <div className="text-sm text-gray-500">
                        Last audit: {new Date(generator.compliance.lastAudit).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(generator.status)}
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
        {((activeTab === 'households' && filteredHouseholds.length === 0) ||
          (activeTab === 'bulk' && filteredBulkGenerators.length === 0)) && (
          <div className="text-center py-12">
            {activeTab === 'households' ? (
              <Home className="mx-auto h-12 w-12 text-gray-400" />
            ) : (
              <Building className="mx-auto h-12 w-12 text-gray-400" />
            )}
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No {activeTab === 'households' ? 'households' : 'bulk generators'} found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : `Get started by registering your first ${activeTab === 'households' ? 'household' : 'bulk generator'}.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}