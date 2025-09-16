import React, { useState, useEffect } from 'react';
import {
  Gift,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Award,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Users,
  Building
} from 'lucide-react';

interface Incentive {
  id: string;
  recipientId: string;
  recipientType: string;
  pointsAwarded: number;
  reason: string;
  awardedAt: string;
  awardedBy: string;
  type: string;
}

interface Penalty {
  id: string;
  violatorId: string;
  violatorType: string;
  violationType: string;
  amount: number;
  description: string;
  issuedAt: string;
  issuedBy: string;
  status: string;
  dueDate: string;
  paidAt?: string;
  paymentMethod?: string;
}

export default function IncentivesAndPenalties() {
  const [incentives, setIncentives] = useState<Incentive[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'incentives' | 'penalties'>('incentives');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchIncentivesAndPenalties();
  }, []);

  const fetchIncentivesAndPenalties = async () => {
    try {
      // Simulated data since API might not have data yet
      const incentivesData: Incentive[] = [
        {
          id: '1',
          recipientId: 'BG001',
          recipientType: 'bulk_generator',
          pointsAwarded: 150,
          reason: 'Excellent segregation compliance for Q1 2024',
          awardedAt: '2024-01-15T10:00:00Z',
          awardedBy: 'ADMIN001',
          type: 'compliance_reward'
        },
        {
          id: '2',
          recipientId: 'CIT001',
          recipientType: 'citizen',
          pointsAwarded: 50,
          reason: 'Completed advanced composting training',
          awardedAt: '2024-01-14T14:30:00Z',
          awardedBy: 'GC001',
          type: 'training_completion'
        },
        {
          id: '3',
          recipientId: 'BG002',
          recipientType: 'bulk_generator',
          pointsAwarded: 200,
          reason: 'Achieved 95% segregation score for December 2023',
          awardedAt: '2024-01-10T09:15:00Z',
          awardedBy: 'ADMIN001',
          type: 'performance_bonus'
        },
        {
          id: '4',
          recipientId: 'CIT002',
          recipientType: 'citizen',
          pointsAwarded: 25,
          reason: 'Reported illegal dumping incident',
          awardedAt: '2024-01-12T16:45:00Z',
          awardedBy: 'GC002',
          type: 'community_service'
        }
      ];

      const penaltiesData: Penalty[] = [
        {
          id: '1',
          violatorId: 'CIT003',
          violatorType: 'citizen',
          violationType: 'improper_segregation',
          amount: 500,
          description: 'Repeated improper waste segregation despite warnings',
          issuedAt: '2024-01-15T11:00:00Z',
          issuedBy: 'GC001',
          status: 'issued',
          dueDate: '2024-02-15T23:59:59Z'
        },
        {
          id: '2',
          violatorId: 'BG003',
          violatorType: 'bulk_generator',
          violationType: 'non_compliance',
          amount: 2000,
          description: 'Failed to maintain segregation standards for commercial waste',
          issuedAt: '2024-01-12T15:30:00Z',
          issuedBy: 'ADMIN001',
          status: 'paid',
          dueDate: '2024-02-12T23:59:59Z',
          paidAt: '2024-01-20T10:15:00Z',
          paymentMethod: 'online'
        },
        {
          id: '3',
          violatorId: 'CIT004',
          violatorType: 'citizen',
          violationType: 'illegal_dumping',
          amount: 1000,
          description: 'Dumping construction waste in public area',
          issuedAt: '2024-01-10T08:45:00Z',
          issuedBy: 'GC003',
          status: 'issued',
          dueDate: '2024-02-10T23:59:59Z'
        },
        {
          id: '4',
          violatorId: 'BG004',
          violatorType: 'bulk_generator',
          violationType: 'late_payment',
          amount: 750,
          description: 'Late payment of waste management fees',
          issuedAt: '2024-01-08T12:00:00Z',
          issuedBy: 'ADMIN001',
          status: 'paid',
          dueDate: '2024-02-08T23:59:59Z',
          paidAt: '2024-01-25T14:20:00Z',
          paymentMethod: 'cash'
        }
      ];

      setIncentives(incentivesData);
      setPenalties(penaltiesData);
    } catch (error) {
      console.error('Error fetching incentives and penalties:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      issued: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || colors.issued}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTypeBadge = (type: string, category: 'incentive' | 'penalty') => {
    const incentiveColors = {
      compliance_reward: 'bg-green-100 text-green-800',
      training_completion: 'bg-blue-100 text-blue-800',
      performance_bonus: 'bg-purple-100 text-purple-800',
      community_service: 'bg-orange-100 text-orange-800'
    };

    const penaltyColors = {
      improper_segregation: 'bg-red-100 text-red-800',
      illegal_dumping: 'bg-red-100 text-red-800',
      non_compliance: 'bg-orange-100 text-orange-800',
      late_payment: 'bg-yellow-100 text-yellow-800'
    };

    const colors = category === 'incentive' ? incentiveColors : penaltyColors;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1)}
      </span>
    );
  };

  const getRecipientTypeBadge = (type: string) => {
    const colors = {
      citizen: 'bg-blue-100 text-blue-800',
      bulk_generator: 'bg-purple-100 text-purple-800'
    };

    const icons = {
      citizen: Users,
      bulk_generator: Building
    };

    const Icon = icons[type as keyof typeof icons] || Users;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[type as keyof typeof colors] || colors.citizen}`}>
        <Icon className="h-3 w-3 mr-1" />
        {type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1)}
      </span>
    );
  };

  const filteredIncentives = incentives.filter(incentive => {
    const matchesSearch = incentive.recipientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incentive.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || incentive.type === filterType;
    const matchesRecipientType = filterStatus === 'all' || incentive.recipientType === filterStatus;
    return matchesSearch && matchesType && matchesRecipientType;
  });

  const filteredPenalties = penalties.filter(penalty => {
    const matchesSearch = penalty.violatorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         penalty.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || penalty.violationType === filterType;
    const matchesStatus = filterStatus === 'all' || penalty.status === filterStatus;
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
              <Gift className="h-8 w-8 mr-3 text-emerald-600" />
              Incentives & Penalty Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage reward points, penalties, and compliance enforcement
            </p>
          </div>
          <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Add Record
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Award className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Incentives</p>
              <p className="text-2xl font-semibold text-gray-900">{incentives.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Points Awarded</p>
              <p className="text-2xl font-semibold text-gray-900">
                {incentives.reduce((sum, i) => sum + i.pointsAwarded, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Penalties</p>
              <p className="text-2xl font-semibold text-gray-900">{penalties.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Revenue Collected</p>
              <p className="text-2xl font-semibold text-gray-900">
                ₹{penalties.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
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
              onClick={() => setActiveTab('incentives')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'incentives'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Gift className="h-5 w-5 inline mr-2" />
              Incentives ({incentives.length})
            </button>
            <button
              onClick={() => setActiveTab('penalties')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'penalties'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <AlertTriangle className="h-5 w-5 inline mr-2" />
              Penalties ({penalties.length})
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
                  placeholder={activeTab === 'incentives' ? 'Search by recipient ID or reason...' : 'Search by violator ID or description...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All Types</option>
                {activeTab === 'incentives' ? (
                  <>
                    <option value="compliance_reward">Compliance Reward</option>
                    <option value="training_completion">Training Completion</option>
                    <option value="performance_bonus">Performance Bonus</option>
                    <option value="community_service">Community Service</option>
                  </>
                ) : (
                  <>
                    <option value="improper_segregation">Improper Segregation</option>
                    <option value="illegal_dumping">Illegal Dumping</option>
                    <option value="non_compliance">Non Compliance</option>
                    <option value="late_payment">Late Payment</option>
                  </>
                )}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">{activeTab === 'incentives' ? 'All Recipients' : 'All Status'}</option>
                {activeTab === 'incentives' ? (
                  <>
                    <option value="citizen">Citizens</option>
                    <option value="bulk_generator">Bulk Generators</option>
                  </>
                ) : (
                  <>
                    <option value="issued">Issued</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                  </>
                )}
              </select>
              <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </button>
              <button className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Incentives Table */}
        {activeTab === 'incentives' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipient Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Incentive Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points Awarded
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Awarded Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Awarded By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredIncentives.map((incentive) => (
                  <tr key={incentive.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">
                          {incentive.recipientId}
                        </div>
                        {getRecipientTypeBadge(incentive.recipientType)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(incentive.type, 'incentive')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Award className="h-4 w-4 text-emerald-500 mr-2" />
                        <span className="text-sm font-medium text-emerald-600">
                          {incentive.pointsAwarded} points
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {incentive.reason}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(incentive.awardedAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(incentive.awardedAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {incentive.awardedBy}
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
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Penalties Table */}
        {activeTab === 'penalties' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Violator Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Violation Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issued Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
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
                {filteredPenalties.map((penalty) => (
                  <tr key={penalty.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">
                          {penalty.violatorId}
                        </div>
                        {getRecipientTypeBadge(penalty.violatorType)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(penalty.violationType, 'penalty')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-red-500 mr-1" />
                        <span className="text-sm font-medium text-red-600">
                          ₹{penalty.amount.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {penalty.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(penalty.issuedAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        By: {penalty.issuedBy}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(penalty.dueDate).toLocaleDateString()}
                      </div>
                      {penalty.paidAt && (
                        <div className="text-sm text-green-600">
                          Paid: {new Date(penalty.paidAt).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {getStatusBadge(penalty.status)}
                        {penalty.paymentMethod && (
                          <div className="text-xs text-gray-500">
                            via {penalty.paymentMethod}
                          </div>
                        )}
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
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {((activeTab === 'incentives' && filteredIncentives.length === 0) ||
          (activeTab === 'penalties' && filteredPenalties.length === 0)) && (
          <div className="text-center py-12">
            {activeTab === 'incentives' ? (
              <Gift className="mx-auto h-12 w-12 text-gray-400" />
            ) : (
              <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
            )}
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No {activeTab} found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : `Get started by adding your first ${activeTab === 'incentives' ? 'incentive' : 'penalty'}.`}
            </p>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Incentive Distribution</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Citizens</span>
              <span className="text-sm font-medium text-gray-900">
                {incentives.filter(i => i.recipientType === 'citizen').length} recipients
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Bulk Generators</span>
              <span className="text-sm font-medium text-gray-900">
                {incentives.filter(i => i.recipientType === 'bulk_generator').length} recipients
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Points</span>
              <span className="text-sm font-medium text-emerald-600">
                {incentives.reduce((sum, i) => sum + i.pointsAwarded, 0)} points
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Penalty Collection</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Issued</span>
              <span className="text-sm font-medium text-gray-900">
                ₹{penalties.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Collected</span>
              <span className="text-sm font-medium text-green-600">
                ₹{penalties.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Collection Rate</span>
              <span className="text-sm font-medium text-blue-600">
                {Math.round((penalties.filter(p => p.status === 'paid').length / Math.max(penalties.length, 1)) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}