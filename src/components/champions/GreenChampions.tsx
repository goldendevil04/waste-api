import React, { useState, useEffect } from 'react';
import {
  Award,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Users,
  AlertTriangle,
  CheckCircle,
  Calendar,
  MapPin,
  TrendingUp
} from 'lucide-react';

interface GreenChampion {
  id: string;
  name: string;
  phone: string;
  email: string;
  areaAssigned: string;
  qualification: string;
  experience?: string;
  address: {
    street: string;
    area: string;
    pincode: string;
    city: string;
  };
  citizensUnderSupervision: string[];
  trainingsConducted: any[];
  violationsReported: any[];
  performanceMetrics: {
    trainingsSessions: number;
    citizensTrained: number;
    violationsReported: number;
    complianceImprovement: number;
  };
  joinedAt: string;
  status: string;
}

export default function GreenChampions() {
  const [champions, setChampions] = useState<GreenChampion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterArea, setFilterArea] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchChampions();
  }, []);

  const fetchChampions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/green-champions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setChampions(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching green champions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredChampions = champions.filter(champion => {
    const matchesSearch = champion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         champion.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         champion.phone.includes(searchTerm);
    
    const matchesArea = filterArea === 'all' || champion.areaAssigned === filterArea;
    const matchesStatus = filterStatus === 'all' || champion.status === filterStatus;
    
    return matchesSearch && matchesArea && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      on_leave: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || colors.active}`}>
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </span>
    );
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const calculatePerformanceScore = (metrics: any) => {
    // Simple performance calculation based on activities
    const trainingsWeight = (metrics.trainingsSessions || 0) * 10;
    const citizensWeight = (metrics.citizensTrained || 0) * 2;
    const violationsWeight = (metrics.violationsReported || 0) * 5;
    const improvementWeight = (metrics.complianceImprovement || 0);
    
    return Math.min(100, trainingsWeight + citizensWeight + violationsWeight + improvementWeight);
  };

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
              <Award className="h-8 w-8 mr-3 text-yellow-600" />
              Green Champions Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage area committee members and community leaders
            </p>
          </div>
          <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Add Champion
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Award className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Champions</p>
              <p className="text-2xl font-semibold text-gray-900">{champions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Champions</p>
              <p className="text-2xl font-semibold text-gray-900">
                {champions.filter(c => c.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Citizens Supervised</p>
              <p className="text-2xl font-semibold text-gray-900">
                {champions.reduce((sum, c) => sum + (c.citizensUnderSupervision?.length || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Violations Reported</p>
              <p className="text-2xl font-semibold text-gray-900">
                {champions.reduce((sum, c) => sum + (c.performanceMetrics?.violationsReported || 0), 0)}
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
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
            >
              <option value="all">All Areas</option>
              <option value="sector-1">Sector 1</option>
              <option value="sector-2">Sector 2</option>
              <option value="sector-3">Sector 3</option>
              <option value="downtown">Downtown</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
            </select>
            <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </button>
            <button className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Champions Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Champion Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Area & Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supervision
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activities
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
              {filteredChampions.map((champion) => {
                const performanceScore = calculatePerformanceScore(champion.performanceMetrics);

                return (
                  <tr key={champion.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{champion.name}</div>
                        <div className="text-sm text-gray-500">{champion.qualification}</div>
                        <div className="text-sm text-gray-500">{champion.experience}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                          {champion.areaAssigned}
                        </div>
                        <div className="text-sm text-gray-500">{champion.phone}</div>
                        <div className="text-sm text-gray-500">{champion.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-blue-500" />
                        <span className="text-sm text-gray-900">
                          {champion.citizensUnderSupervision?.length || 0} citizens
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar className="h-4 w-4 mr-1 text-green-500" />
                          {champion.performanceMetrics?.trainingsSessions || 0} trainings
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <AlertTriangle className="h-4 w-4 mr-1 text-orange-500" />
                          {champion.performanceMetrics?.violationsReported || 0} violations
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className={`text-sm font-medium ${getPerformanceColor(performanceScore)}`}>
                          {Math.round(performanceScore)}%
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              performanceScore >= 80 ? 'bg-green-600' : 
                              performanceScore >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                            }`}
                            style={{ width: `${performanceScore}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(champion.status)}
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

        {filteredChampions.length === 0 && (
          <div className="text-center py-12">
            <Award className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No green champions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterArea !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by adding your first green champion.'}
            </p>
          </div>
        )}
      </div>

      {/* Performance Overview */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
          Champion Performance Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {champions.reduce((sum, c) => sum + (c.performanceMetrics?.trainingsSessions || 0), 0)}
            </div>
            <div className="text-sm text-gray-500">Total Training Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {champions.reduce((sum, c) => sum + (c.performanceMetrics?.citizensTrained || 0), 0)}
            </div>
            <div className="text-sm text-gray-500">Citizens Trained</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Math.round(champions.reduce((sum, c) => sum + (c.performanceMetrics?.complianceImprovement || 0), 0) / Math.max(champions.length, 1))}%
            </div>
            <div className="text-sm text-gray-500">Avg. Compliance Improvement</div>
          </div>
        </div>
      </div>
    </div>
  );
}