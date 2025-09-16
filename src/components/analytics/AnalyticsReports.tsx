import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Filter,
  PieChart,
  LineChart,
  Users,
  Trash2,
  Building2,
  Award
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell } from 'recharts';

interface AnalyticsData {
  wasteGeneration: any[];
  treatmentEfficiency: any[];
  trainingCompletion: any[];
  segregationCompliance: any[];
  collectionEfficiency: any[];
  facilityUtilization: any[];
  penaltyRevenue: any[];
  incentiveDistribution: any[];
}

export default function AnalyticsReports() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    wasteGeneration: [],
    treatmentEfficiency: [],
    trainingCompletion: [],
    segregationCompliance: [],
    collectionEfficiency: [],
    facilityUtilization: [],
    penaltyRevenue: [],
    incentiveDistribution: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedMetric, setSelectedMetric] = useState('waste_generation');

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod]);

  const fetchAnalyticsData = async () => {
    try {
      // Simulated analytics data
      const wasteGenerationData = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        organic: Math.floor(Math.random() * 50) + 100,
        recyclable: Math.floor(Math.random() * 30) + 50,
        hazardous: Math.floor(Math.random() * 10) + 5,
        total: 0
      })).map(item => ({
        ...item,
        total: item.organic + item.recyclable + item.hazardous
      }));

      const treatmentEfficiencyData = [
        { facility: 'Composting Plant A', efficiency: 87.3, capacity: 50, processed: 43.7 },
        { facility: 'Biomethanization Unit', efficiency: 92.1, capacity: 75, processed: 69.1 },
        { facility: 'WTE Plant', efficiency: 78.9, capacity: 200, processed: 157.8 },
        { facility: 'Recycling Center', efficiency: 85.6, capacity: 100, processed: 85.6 }
      ];

      const trainingCompletionData = [
        { module: 'Basic Segregation', enrolled: 1200, completed: 1050, rate: 87.5 },
        { module: 'Composting', enrolled: 800, completed: 680, rate: 85.0 },
        { module: 'Recycling', enrolled: 600, completed: 480, rate: 80.0 },
        { module: 'Waste Reduction', enrolled: 400, completed: 340, rate: 85.0 }
      ];

      const segregationComplianceData = [
        { category: 'Households', total: 5000, compliant: 4200, rate: 84.0 },
        { category: 'Bulk Generators', total: 150, compliant: 135, rate: 90.0 },
        { category: 'Commercial', total: 300, compliant: 240, rate: 80.0 },
        { category: 'Institutional', total: 100, compliant: 85, rate: 85.0 }
      ];

      const collectionEfficiencyData = Array.from({ length: 7 }, (_, i) => ({
        day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
        scheduled: Math.floor(Math.random() * 20) + 80,
        completed: Math.floor(Math.random() * 15) + 75,
        efficiency: 0
      })).map(item => ({
        ...item,
        efficiency: Math.round((item.completed / item.scheduled) * 100)
      }));

      const facilityUtilizationData = [
        { name: 'Composting', value: 77, color: '#10B981' },
        { name: 'Biomethanization', value: 84, color: '#3B82F6' },
        { name: 'WTE', value: 79, color: '#F59E0B' },
        { name: 'Recycling', value: 86, color: '#8B5CF6' }
      ];

      const penaltyRevenueData = Array.from({ length: 12 }, (_, i) => ({
        month: new Date(2024, i, 1).toLocaleString('default', { month: 'short' }),
        issued: Math.floor(Math.random() * 50000) + 20000,
        collected: Math.floor(Math.random() * 40000) + 15000,
        pending: 0
      })).map(item => ({
        ...item,
        pending: item.issued - item.collected
      }));

      const incentiveDistributionData = [
        { type: 'Training Completion', citizens: 450, bulkGenerators: 25, points: 12500 },
        { type: 'Compliance Rewards', citizens: 320, bulkGenerators: 45, points: 18750 },
        { type: 'Community Service', citizens: 180, bulkGenerators: 10, points: 5200 },
        { type: 'Performance Bonus', citizens: 90, bulkGenerators: 30, points: 8900 }
      ];

      setAnalyticsData({
        wasteGeneration: wasteGenerationData,
        treatmentEfficiency: treatmentEfficiencyData,
        trainingCompletion: trainingCompletionData,
        segregationCompliance: segregationComplianceData,
        collectionEfficiency: collectionEfficiencyData,
        facilityUtilization: facilityUtilizationData,
        penaltyRevenue: penaltyRevenueData,
        incentiveDistribution: incentiveDistributionData
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-300 rounded"></div>
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
              <BarChart3 className="h-8 w-8 mr-3 text-violet-600" />
              Analytics & Reports
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Comprehensive analytics and reporting for waste management operations
            </p>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-violet-500 focus:border-violet-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 3 months</option>
              <option value="365">Last year</option>
            </select>
            <button className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-md flex items-center">
              <Download className="h-5 w-5 mr-2" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Trash2 className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Waste Processed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {analyticsData.wasteGeneration.reduce((sum, item) => sum + item.total, 0).toLocaleString()} kg
              </p>
              <p className="text-sm text-green-600">+12% from last period</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg. Treatment Efficiency</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Math.round(analyticsData.treatmentEfficiency.reduce((sum, item) => sum + item.efficiency, 0) / Math.max(analyticsData.treatmentEfficiency.length, 1))}%
              </p>
              <p className="text-sm text-blue-600">+3.2% from last period</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Users className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Training Completion Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Math.round(analyticsData.trainingCompletion.reduce((sum, item) => sum + item.rate, 0) / Math.max(analyticsData.trainingCompletion.length, 1))}%
              </p>
              <p className="text-sm text-yellow-600">+5.8% from last period</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Segregation Compliance</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Math.round(analyticsData.segregationCompliance.reduce((sum, item) => sum + item.rate, 0) / Math.max(analyticsData.segregationCompliance.length, 1))}%
              </p>
              <p className="text-sm text-purple-600">+2.1% from last period</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Waste Generation */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <LineChart className="h-5 w-5 mr-2 text-green-500" />
            Daily Waste Generation
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart data={analyticsData.wasteGeneration}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="organic" stroke="#10B981" strokeWidth={2} name="Organic" />
              <Line type="monotone" dataKey="recyclable" stroke="#3B82F6" strokeWidth={2} name="Recyclable" />
              <Line type="monotone" dataKey="hazardous" stroke="#EF4444" strokeWidth={2} name="Hazardous" />
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>

        {/* Treatment Efficiency */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
            Treatment Facility Efficiency
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.treatmentEfficiency}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="facility" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="efficiency" fill="#3B82F6" name="Efficiency %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Training Completion Rates */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2 text-yellow-500" />
            Training Module Completion
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.trainingCompletion}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="module" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="enrolled" fill="#F59E0B" name="Enrolled" />
              <Bar dataKey="completed" fill="#10B981" name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Facility Utilization */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <PieChart className="h-5 w-5 mr-2 text-purple-500" />
            Facility Utilization
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Tooltip />
              <RechartsPieChart data={analyticsData.facilityUtilization}>
                {analyticsData.facilityUtilization.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </RechartsPieChart>
            </RechartsPieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {analyticsData.facilityUtilization.map((item, index) => (
              <div key={index} className="flex items-center text-sm">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-gray-600">{item.name}: {item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Collection Efficiency */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-indigo-500" />
            Weekly Collection Efficiency
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.collectionEfficiency}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="efficiency" fill="#6366F1" name="Efficiency %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Penalty Revenue Trends */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-red-500" />
            Penalty Revenue Trends
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart data={analyticsData.penaltyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, '']} />
              <Line type="monotone" dataKey="issued" stroke="#EF4444" strokeWidth={2} name="Issued" />
              <Line type="monotone" dataKey="collected" stroke="#10B981" strokeWidth={2} name="Collected" />
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Segregation Compliance Details */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Segregation Compliance by Category</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compliant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analyticsData.segregationCompliance.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.total}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.compliant}</td>
                    <td className="px-4 py-3 text-sm font-medium text-green-600">{item.rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Incentive Distribution Details */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Incentive Distribution by Type</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Citizens</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bulk Gen.</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analyticsData.incentiveDistribution.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.type}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.citizens}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.bulkGenerators}</td>
                    <td className="px-4 py-3 text-sm font-medium text-purple-600">{item.points.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Summary Report */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Executive Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Environmental Impact</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• 2,847 tons of waste processed</li>
              <li>• 87% average treatment efficiency</li>
              <li>• 1,250 tons of organic waste composted</li>
              <li>• 450 MWh energy generated from waste</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Community Engagement</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 12,547 citizens registered</li>
              <li>• 84% training completion rate</li>
              <li>• 45 active green champions</li>
              <li>• 38 community events conducted</li>
            </ul>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2">Financial Performance</h4>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• ₹2,45,000 penalty revenue collected</li>
              <li>• 45,350 reward points distributed</li>
              <li>• 78% penalty collection rate</li>
              <li>• ₹1,85,000 equipment sales revenue</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}