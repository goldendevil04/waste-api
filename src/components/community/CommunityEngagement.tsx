import React, { useState, useEffect } from 'react';
import {
  Heart,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Calendar,
  Users,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  organizerId: string;
  organizerType: string;
  scheduledDate: string;
  duration: number;
  location: {
    area: string;
    specificLocation: string;
  };
  maxParticipants: number;
  registrations: number;
  actualParticipants: number;
  status: string;
  eventType: string;
}

interface Campaign {
  id: string;
  title: string;
  description: string;
  campaignType: string;
  organizerId: string;
  targetAudience: string;
  startDate: string;
  endDate: string;
  expectedReach: number;
  actualReach: number;
  status: string;
  channels: string[];
}

export default function CommunityEngagement() {
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'events' | 'campaigns'>('events');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchCommunityData();
  }, []);

  const fetchCommunityData = async () => {
    try {
      // Simulated data since API might not have data yet
      const eventsData: CommunityEvent[] = [
        {
          id: '1',
          title: 'Community Cleaning Drive - Sector 15',
          description: 'Monthly community cleaning and awareness drive',
          organizerId: 'GC001',
          organizerType: 'champion',
          scheduledDate: '2024-01-20T09:00:00Z',
          duration: 180, // 3 hours
          location: {
            area: 'Sector 15',
            specificLocation: 'Central Park and surrounding areas'
          },
          maxParticipants: 50,
          registrations: 42,
          actualParticipants: 38,
          status: 'completed',
          eventType: 'cleaning'
        },
        {
          id: '2',
          title: 'Waste Segregation Training Workshop',
          description: 'Hands-on training for proper waste segregation techniques',
          organizerId: 'GC002',
          organizerType: 'champion',
          scheduledDate: '2024-01-25T14:00:00Z',
          duration: 120, // 2 hours
          location: {
            area: 'Sector 7',
            specificLocation: 'Community Center Hall'
          },
          maxParticipants: 30,
          registrations: 28,
          actualParticipants: 0,
          status: 'scheduled',
          eventType: 'training'
        },
        {
          id: '3',
          title: 'Composting Workshop for Households',
          description: 'Learn home composting techniques and get free compost kits',
          organizerId: 'ADMIN001',
          organizerType: 'admin',
          scheduledDate: '2024-01-18T10:00:00Z',
          duration: 150, // 2.5 hours
          location: {
            area: 'Downtown',
            specificLocation: 'Municipal Office Auditorium'
          },
          maxParticipants: 40,
          registrations: 35,
          actualParticipants: 32,
          status: 'completed',
          eventType: 'training'
        }
      ];

      const campaignsData: Campaign[] = [
        {
          id: '1',
          title: 'Zero Waste January Challenge',
          description: 'Month-long campaign to promote waste reduction practices',
          campaignType: 'behavior_change',
          organizerId: 'ADMIN001',
          targetAudience: 'citizens',
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-31T23:59:59Z',
          expectedReach: 5000,
          actualReach: 4200,
          status: 'active',
          channels: ['social_media', 'door_to_door', 'events']
        },
        {
          id: '2',
          title: 'School Waste Awareness Program',
          description: 'Educational program for students about waste management',
          campaignType: 'education',
          organizerId: 'GC003',
          targetAudience: 'schools',
          startDate: '2024-01-15T00:00:00Z',
          endDate: '2024-02-15T23:59:59Z',
          expectedReach: 2000,
          actualReach: 1800,
          status: 'active',
          channels: ['events', 'print']
        },
        {
          id: '3',
          title: 'Green Champion Recruitment Drive',
          description: 'Campaign to recruit new green champions for community areas',
          campaignType: 'recruitment',
          organizerId: 'ADMIN001',
          targetAudience: 'citizens',
          startDate: '2024-01-10T00:00:00Z',
          endDate: '2024-01-25T23:59:59Z',
          expectedReach: 1000,
          actualReach: 850,
          status: 'completed',
          channels: ['social_media', 'print', 'events']
        }
      ];

      setEvents(eventsData);
      setCampaigns(campaignsData);
    } catch (error) {
      console.error('Error fetching community data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };

    const icons = {
      scheduled: Clock,
      active: CheckCircle,
      completed: CheckCircle,
      cancelled: AlertCircle
    };

    const Icon = icons[status as keyof typeof icons] || Clock;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || colors.scheduled}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTypeBadge = (type: string, category: 'event' | 'campaign') => {
    const eventColors = {
      cleaning: 'bg-green-100 text-green-800',
      training: 'bg-blue-100 text-blue-800',
      awareness: 'bg-yellow-100 text-yellow-800'
    };

    const campaignColors = {
      awareness: 'bg-yellow-100 text-yellow-800',
      education: 'bg-blue-100 text-blue-800',
      behavior_change: 'bg-purple-100 text-purple-800',
      recruitment: 'bg-orange-100 text-orange-800'
    };

    const colors = category === 'event' ? eventColors : campaignColors;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1)}
      </span>
    );
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.area.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
    const matchesType = filterType === 'all' || event.eventType === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || campaign.status === filterStatus;
    const matchesType = filterType === 'all' || campaign.campaignType === filterType;
    return matchesSearch && matchesStatus && matchesType;
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
              <Heart className="h-8 w-8 mr-3 text-pink-600" />
              Community Engagement
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage community events, awareness campaigns, and citizen participation
            </p>
          </div>
          <button className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-md flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Create Event
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-pink-100 rounded-lg">
              <Calendar className="h-6 w-6 text-pink-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Events</p>
              <p className="text-2xl font-semibold text-gray-900">{events.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Participants</p>
              <p className="text-2xl font-semibold text-gray-900">
                {events.reduce((sum, e) => sum + e.actualParticipants, 0)}
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
              <p className="text-sm font-medium text-gray-500">Active Campaigns</p>
              <p className="text-2xl font-semibold text-gray-900">
                {campaigns.filter(c => c.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Campaign Reach</p>
              <p className="text-2xl font-semibold text-gray-900">
                {campaigns.reduce((sum, c) => sum + c.actualReach, 0).toLocaleString()}
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
              onClick={() => setActiveTab('events')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'events'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calendar className="h-5 w-5 inline mr-2" />
              Community Events ({events.length})
            </button>
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'campaigns'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Heart className="h-5 w-5 inline mr-2" />
              Awareness Campaigns ({campaigns.length})
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
                  placeholder={activeTab === 'events' ? 'Search by event title or location...' : 'Search by campaign title or description...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="all">All Types</option>
                {activeTab === 'events' ? (
                  <>
                    <option value="cleaning">Cleaning</option>
                    <option value="training">Training</option>
                    <option value="awareness">Awareness</option>
                  </>
                ) : (
                  <>
                    <option value="awareness">Awareness</option>
                    <option value="education">Education</option>
                    <option value="behavior_change">Behavior Change</option>
                    <option value="recruitment">Recruitment</option>
                  </>
                )}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </button>
              <button className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Events Table */}
        {activeTab === 'events' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Schedule & Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organizer
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
                {filteredEvents.map((event) => {
                  const participationRate = event.registrations > 0 ? (event.actualParticipants / event.registrations) * 100 : 0;

                  return (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <div className="text-sm font-medium text-gray-900">
                            {event.title}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {event.description}
                          </div>
                          <div className="mt-1">
                            {getTypeBadge(event.eventType, 'event')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-900">
                            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                            {new Date(event.scheduledDate).toLocaleDateString()}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="h-4 w-4 mr-1 text-gray-400" />
                            {Math.floor(event.duration / 60)}h {event.duration % 60}m
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                            {event.location.area}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900">
                            {event.actualParticipants}/{event.registrations} registered
                          </div>
                          <div className="text-sm text-gray-500">
                            Max: {event.maxParticipants}
                          </div>
                          {event.status === 'completed' && (
                            <div className="text-sm text-green-600">
                              {Math.round(participationRate)}% attendance
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {event.organizerId}
                        </div>
                        <div className="text-sm text-gray-500">
                          {event.organizerType.charAt(0).toUpperCase() + event.organizerType.slice(1)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(event.status)}
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

        {/* Campaigns Table */}
        {activeTab === 'campaigns' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration & Audience
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reach & Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Channels
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
                {filteredCampaigns.map((campaign) => {
                  const reachPercentage = campaign.expectedReach > 0 ? (campaign.actualReach / campaign.expectedReach) * 100 : 0;

                  return (
                    <tr key={campaign.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <div className="text-sm font-medium text-gray-900">
                            {campaign.title}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {campaign.description}
                          </div>
                          <div className="mt-1">
                            {getTypeBadge(campaign.campaignType, 'campaign')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-900">
                            {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            Target: {campaign.targetAudience.replace('_', ' ')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900">
                            {campaign.actualReach.toLocaleString()} / {campaign.expectedReach.toLocaleString()}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                reachPercentage >= 90 ? 'bg-green-600' :
                                reachPercentage >= 70 ? 'bg-yellow-600' : 'bg-red-600'
                              }`}
                              style={{ width: `${Math.min(reachPercentage, 100)}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {Math.round(reachPercentage)}% of target
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {campaign.channels.map((channel, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {channel.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(campaign.status)}
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
        {((activeTab === 'events' && filteredEvents.length === 0) ||
          (activeTab === 'campaigns' && filteredCampaigns.length === 0)) && (
          <div className="text-center py-12">
            {activeTab === 'events' ? (
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            ) : (
              <Heart className="mx-auto h-12 w-12 text-gray-400" />
            )}
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No {activeTab} found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : `Get started by creating your first ${activeTab === 'events' ? 'community event' : 'awareness campaign'}.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}