import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Award,
  Trash2,
  Truck,
  Building2,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface DashboardStats {
  citizens: number;
  workers: number;
  champions: number;
  facilities: number;
  wasteCollected: number;
  complianceRate: number;
  activeVehicles: number;
  pendingComplaints: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    citizens: 0,
    workers: 0,
    champions: 0,
    facilities: 0,
    wasteCollected: 0,
    complianceRate: 0,
    activeVehicles: 0,
    pendingComplaints: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to fetch dashboard stats
    const fetchStats = async () => {
      try {
        // In a real app, this would be actual API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setStats({
          citizens: 12547,
          workers: 234,
          champions: 45,
          facilities: 18,
          wasteCollected: 2847.5,
          complianceRate: 87.3,
          activeVehicles: 42,
          pendingComplaints: 23
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      name: 'Total Citizens',
      value: stats.citizens.toLocaleString(),
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'increase'
    },
    {
      name: 'Waste Workers',
      value: stats.workers.toString(),
      icon: UserCheck,
      color: 'bg-green-500',
      change: '+3%',
      changeType: 'increase'
    },
    {
      name: 'Green Champions',
      value: stats.champions.toString(),
      icon: Award,
      color: 'bg-yellow-500',
      change: '+8%',
      changeType: 'increase'
    },
    {
      name: 'Treatment Facilities',
      value: stats.facilities.toString(),
      icon: Building2,
      color: 'bg-purple-500',
      change: '+2',
      changeType: 'increase'
    },
    {
      name: 'Waste Collected (Tons)',
      value: stats.wasteCollected.toLocaleString(),
      icon: Trash2,
      color: 'bg-orange-500',
      change: '+15%',
      changeType: 'increase'
    },
    {
      name: 'Compliance Rate',
      value: `${stats.complianceRate}%`,
      icon: CheckCircle,
      color: 'bg-emerald-500',
      change: '+5.2%',
      changeType: 'increase'
    },
    {
      name: 'Active Vehicles',
      value: stats.activeVehicles.toString(),
      icon: Truck,
      color: 'bg-indigo-500',
      change: '98%',
      changeType: 'neutral'
    },
    {
      name: 'Pending Complaints',
      value: stats.pendingComplaints.toString(),
      icon: AlertTriangle,
      color: 'bg-red-500',
      change: '-18%',
      changeType: 'decrease'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'collection',
      message: 'Waste collection completed in Sector 15',
      time: '2 hours ago',
      icon: Truck,
      color: 'text-green-600'
    },
    {
      id: 2,
      type: 'training',
      message: 'New citizen training session scheduled',
      time: '4 hours ago',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      id: 3,
      type: 'violation',
      message: 'Segregation violation reported in Area 7',
      time: '6 hours ago',
      icon: AlertTriangle,
      color: 'text-red-600'
    },
    {
      id: 4,
      type: 'facility',
      message: 'Composting facility reached 85% capacity',
      time: '8 hours ago',
      icon: Building2,
      color: 'text-orange-600'
    },
    {
      id: 5,
      type: 'champion',
      message: 'Green Champion submitted monthly report',
      time: '1 day ago',
      icon: Award,
      color: 'text-yellow-600'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-gray-300 rounded"></div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome to Smart Waste Management</h1>
        <p className="text-green-100">
          Monitor and manage waste collection, treatment, and citizen engagement across your city.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`${stat.color} p-3 rounded-md`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.changeType === 'increase' ? 'text-green-600' :
                        stat.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {stat.changeType === 'increase' && <TrendingUp className="h-4 w-4 mr-1" />}
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activities and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-gray-500" />
              Recent Activities
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <activity.icon className={`h-5 w-5 ${activity.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <button className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg text-center transition-colors">
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <span className="text-sm font-medium text-blue-900">Register Citizen</span>
              </button>
              <button className="bg-green-50 hover:bg-green-100 p-4 rounded-lg text-center transition-colors">
                <Truck className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <span className="text-sm font-medium text-green-900">Schedule Collection</span>
              </button>
              <button className="bg-yellow-50 hover:bg-yellow-100 p-4 rounded-lg text-center transition-colors">
                <Award className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <span className="text-sm font-medium text-yellow-900">Add Champion</span>
              </button>
              <button className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg text-center transition-colors">
                <Building2 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <span className="text-sm font-medium text-purple-900">Monitor Facilities</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">System Performance Overview</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">87.3%</div>
              <div className="text-sm text-gray-500">Overall Compliance</div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '87.3%' }}></div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">94.2%</div>
              <div className="text-sm text-gray-500">Collection Efficiency</div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '94.2%' }}></div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">76.8%</div>
              <div className="text-sm text-gray-500">Treatment Capacity</div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div className="bg-orange-600 h-2 rounded-full" style={{ width: '76.8%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}