import React, { useState, useEffect } from 'react';
import {
  Camera,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock,
  Image,
  Star
} from 'lucide-react';

interface PhotoReport {
  id: string;
  reporterId: string;
  reporterType: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  description: string;
  severity: string;
  photos: string[];
  submittedAt: string;
  status: string;
  verificationStatus: string;
  actionTaken?: string;
  resolvedAt?: string;
}

interface CleanlinessAssessment {
  id: string;
  assessorId: string;
  areaId: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  overallScore: number;
  categories: {
    wasteSegregation: number;
    streetCleanliness: number;
    drainageCleanliness: number;
    publicToilets: number;
    wasteCollection: number;
  };
  assessmentDate: string;
  observations?: string;
  recommendations?: string;
  status: string;
}

export default function MonitoringSystem() {
  const [photoReports, setPhotoReports] = useState<PhotoReport[]>([]);
  const [assessments, setAssessments] = useState<CleanlinessAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reports' | 'assessments'>('reports');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');

  useEffect(() => {
    fetchMonitoringData();
  }, []);

  const fetchMonitoringData = async () => {
    try {
      // Simulated data since API might not have data yet
      const photoReportsData: PhotoReport[] = [
        {
          id: '1',
          reporterId: 'CIT001',
          reporterType: 'citizen',
          location: {
            lat: 28.6139,
            lng: 77.2090,
            address: 'Sector 15, Near Metro Station'
          },
          description: 'Illegal dumping of construction waste near residential area',
          severity: 'high',
          photos: ['photo1.jpg', 'photo2.jpg'],
          submittedAt: '2024-01-16T10:30:00Z',
          status: 'reported',
          verificationStatus: 'pending'
        },
        {
          id: '2',
          reporterId: 'GC001',
          reporterType: 'champion',
          location: {
            lat: 28.5355,
            lng: 77.3910,
            address: 'Park Area, Sector 7'
          },
          description: 'Overflowing waste bins causing hygiene issues',
          severity: 'medium',
          photos: ['photo3.jpg'],
          submittedAt: '2024-01-16T08:15:00Z',
          status: 'resolved',
          verificationStatus: 'verified',
          actionTaken: 'Bins emptied and additional collection scheduled',
          resolvedAt: '2024-01-16T14:30:00Z'
        },
        {
          id: '3',
          reporterId: 'WRK001',
          reporterType: 'worker',
          location: {
            lat: 28.4595,
            lng: 77.0266,
            address: 'Commercial Complex, Main Road'
          },
          description: 'Improper segregation by bulk generator',
          severity: 'medium',
          photos: ['photo4.jpg', 'photo5.jpg'],
          submittedAt: '2024-01-15T16:45:00Z',
          status: 'in_progress',
          verificationStatus: 'verified'
        }
      ];

      const assessmentsData: CleanlinessAssessment[] = [
        {
          id: '1',
          assessorId: 'GC001',
          areaId: 'Sector 15',
          location: {
            lat: 28.6139,
            lng: 77.2090,
            address: 'Sector 15, Central Area'
          },
          overallScore: 85,
          categories: {
            wasteSegregation: 80,
            streetCleanliness: 90,
            drainageCleanliness: 85,
            publicToilets: 75,
            wasteCollection: 95
          },
          assessmentDate: '2024-01-16',
          observations: 'Overall good condition with minor improvements needed in public toilet maintenance',
          recommendations: 'Increase frequency of toilet cleaning and add more segregation awareness signage',
          status: 'completed'
        },
        {
          id: '2',
          assessorId: 'GC002',
          areaId: 'Sector 7',
          location: {
            lat: 28.5355,
            lng: 77.3910,
            address: 'Sector 7, Residential Zone'
          },
          overallScore: 72,
          categories: {
            wasteSegregation: 65,
            streetCleanliness: 80,
            drainageCleanliness: 70,
            publicToilets: 60,
            wasteCollection: 85
          },
          assessmentDate: '2024-01-15',
          observations: 'Need improvement in waste segregation practices and public toilet maintenance',
          recommendations: 'Conduct more citizen training sessions and upgrade toilet facilities',
          status: 'completed'
        }
      ];

      setPhotoReports(photoReportsData);
      setAssessments(assessmentsData);
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, type: 'report' | 'assessment' = 'report') => {
    const reportColors = {
      reported: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };

    const assessmentColors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800'
    };

    const colors = type === 'report' ? reportColors : assessmentColors;
    const icons = {
      reported: AlertTriangle,
      in_progress: Clock,
      resolved: CheckCircle,
      rejected: AlertTriangle,
      completed: CheckCircle,
      pending: Clock
    };

    const Icon = icons[status as keyof typeof icons] || AlertTriangle;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || colors.reported || colors.pending}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </span>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[severity as keyof typeof colors] || colors.medium}`}>
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </span>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredPhotoReports = photoReports.filter(report => {
    const matchesSearch = report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.location.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchesSeverity = filterSeverity === 'all' || report.severity === filterSeverity;
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = assessment.areaId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessment.location.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || assessment.status === filterStatus;
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
              <Camera className="h-8 w-8 mr-3 text-red-600" />
              Digital Monitoring System
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor waste dumping sites, community reports, and area cleanliness assessments
            </p>
          </div>
          <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            New Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Camera className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Photo Reports</p>
              <p className="text-2xl font-semibold text-gray-900">{photoReports.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Reports</p>
              <p className="text-2xl font-semibold text-gray-900">
                {photoReports.filter(r => r.status === 'reported' || r.status === 'in_progress').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Resolved Reports</p>
              <p className="text-2xl font-semibold text-gray-900">
                {photoReports.filter(r => r.status === 'resolved').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Star className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg. Cleanliness Score</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Math.round(assessments.reduce((sum, a) => sum + a.overallScore, 0) / Math.max(assessments.length, 1))}
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
              onClick={() => setActiveTab('reports')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'reports'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Camera className="h-5 w-5 inline mr-2" />
              Photo Reports ({photoReports.length})
            </button>
            <button
              onClick={() => setActiveTab('assessments')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'assessments'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Star className="h-5 w-5 inline mr-2" />
              Cleanliness Assessments ({assessments.length})
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
                  placeholder={activeTab === 'reports' ? 'Search by description or location...' : 'Search by area or address...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              >
                <option value="all">All Status</option>
                {activeTab === 'reports' ? (
                  <>
                    <option value="reported">Reported</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                  </>
                ) : (
                  <>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                  </>
                )}
              </select>
              {activeTab === 'reports' && (
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                >
                  <option value="all">All Severity</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              )}
              <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </button>
              <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Photo Reports Table */}
        {activeTab === 'reports' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reporter & Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity & Photos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
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
                {filteredPhotoReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <div className="text-sm font-medium text-gray-900">
                          Report #{report.id}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {report.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {report.reporterType.charAt(0).toUpperCase() + report.reporterType.slice(1)}: {report.reporterId}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-1" />
                          {report.location.address}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {getSeverityBadge(report.severity)}
                        <div className="flex items-center text-sm text-gray-500">
                          <Image className="h-4 w-4 mr-1" />
                          {report.photos.length} photos
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(report.submittedAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(report.submittedAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {getStatusBadge(report.status, 'report')}
                        <div className="text-xs text-gray-500">
                          {report.verificationStatus}
                        </div>
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

        {/* Cleanliness Assessments Table */}
        {activeTab === 'assessments' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assessment Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Area & Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Overall Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category Scores
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
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
                {filteredAssessments.map((assessment) => (
                  <tr key={assessment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Assessment #{assessment.id}
                        </div>
                        <div className="text-sm text-gray-500">
                          Assessor: {assessment.assessorId}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {assessment.areaId}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-1" />
                          {assessment.location.address}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className={`text-lg font-bold ${getScoreColor(assessment.overallScore)}`}>
                          {assessment.overallScore}%
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              assessment.overallScore >= 85 ? 'bg-green-600' :
                              assessment.overallScore >= 70 ? 'bg-yellow-600' : 'bg-red-600'
                            }`}
                            style={{ width: `${assessment.overallScore}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>Segregation:</span>
                          <span className={getScoreColor(assessment.categories.wasteSegregation)}>
                            {assessment.categories.wasteSegregation}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Street Clean:</span>
                          <span className={getScoreColor(assessment.categories.streetCleanliness)}>
                            {assessment.categories.streetCleanliness}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Drainage:</span>
                          <span className={getScoreColor(assessment.categories.drainageCleanliness)}>
                            {assessment.categories.drainageCleanliness}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Toilets:</span>
                          <span className={getScoreColor(assessment.categories.publicToilets)}>
                            {assessment.categories.publicToilets}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Collection:</span>
                          <span className={getScoreColor(assessment.categories.wasteCollection)}>
                            {assessment.categories.wasteCollection}%
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(assessment.assessmentDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(assessment.status, 'assessment')}
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
        {((activeTab === 'reports' && filteredPhotoReports.length === 0) ||
          (activeTab === 'assessments' && filteredAssessments.length === 0)) && (
          <div className="text-center py-12">
            {activeTab === 'reports' ? (
              <Camera className="mx-auto h-12 w-12 text-gray-400" />
            ) : (
              <Star className="mx-auto h-12 w-12 text-gray-400" />
            )}
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No {activeTab === 'reports' ? 'photo reports' : 'assessments'} found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all' || (activeTab === 'reports' && filterSeverity !== 'all')
                ? 'Try adjusting your search or filter criteria.'
                : `Get started by adding your first ${activeTab === 'reports' ? 'photo report' : 'cleanliness assessment'}.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}