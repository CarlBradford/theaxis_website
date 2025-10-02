import React, { useState, useEffect } from 'react';
import usePageTitle from '../hooks/usePageTitle';
import { 
  ChartBarIcon, 
  UsersIcon, 
  EyeIcon, 
  DocumentTextIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  SparklesIcon,
  FireIcon,
  StarIcon,
  HeartIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  DeviceTabletIcon,
  ChevronDownIcon,
  GlobeAmericasIcon,
  ShareIcon,
  MagnifyingGlassIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { 
  ChartBarIcon as ChartBarIconSolid,
  UsersIcon as UsersIconSolid,
  EyeIcon as EyeIconSolid,
  DocumentTextIcon as DocumentTextIconSolid
} from '@heroicons/react/24/solid';
import '../styles/analytics-dashboard.css';
import '../styles/dashboard.css';
import '../styles/comment-management.css';

const AnalyticsDashboard = () => {
  // Set page title
  usePageTitle('Analytics Dashboard');

  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    pageViews: 0,
    uniqueUsers: 0,
    sessions: 0,
    bounceRate: 0,
    avgSessionDuration: 0,
    topPages: [],
    userEngagement: [],
    contentMetrics: {
      totalArticles: 0,
      publishedArticles: 0,
      draftArticles: 0,
      pendingArticles: 0
    },
    userActivity: {
      logins: 0,
      articleViews: 0,
      articleCreations: 0,
      articleApprovals: 0
    },
    // New data for additional charts
    pageViewsOverTime: [],
    sessionDurationTrend: [],
    trafficSources: [],
    deviceTypes: [],
    contentStatusDistribution: [],
    hourlyActivity: []
  });

  // Mock data - In a real implementation, this would come from Google Analytics API
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data based on time range
      const mockData = {
        '7d': {
          pageViews: 1247,
          uniqueUsers: 89,
          sessions: 156,
          bounceRate: 42.3,
          avgSessionDuration: 245,
          topPages: [
            { page: '/', views: 456, title: 'Home' },
            { page: '/content', views: 234, title: 'Articles' },
            { page: '/login', views: 189, title: 'Login' },
            { page: '/dashboard', views: 156, title: 'Dashboard' },
            { page: '/content/mycontent', views: 98, title: 'My Content' }
          ],
          userEngagement: [
            { date: '2024-01-15', users: 12, sessions: 18, pageViews: 45 },
            { date: '2024-01-16', users: 15, sessions: 22, pageViews: 67 },
            { date: '2024-01-17', users: 18, sessions: 28, pageViews: 89 },
            { date: '2024-01-18', users: 22, sessions: 31, pageViews: 98 },
            { date: '2024-01-19', users: 19, sessions: 25, pageViews: 76 },
            { date: '2024-01-20', users: 16, sessions: 21, pageViews: 58 },
            { date: '2024-01-21', users: 14, sessions: 19, pageViews: 42 }
          ],
          contentMetrics: {
            totalArticles: 47,
            publishedArticles: 23,
            draftArticles: 12,
            pendingArticles: 12
          },
           userActivity: {
             logins: 89,
             articleViews: 456,
             articleCreations: 8,
             articleApprovals: 15
           },
           // Additional chart data
           pageViewsOverTime: [
             { date: '2024-01-15', views: 45 },
             { date: '2024-01-16', views: 67 },
             { date: '2024-01-17', views: 89 },
             { date: '2024-01-18', views: 98 },
             { date: '2024-01-19', views: 76 },
             { date: '2024-01-20', views: 58 },
             { date: '2024-01-21', views: 42 }
           ],
           sessionDurationTrend: [
             { date: '2024-01-15', duration: 180 },
             { date: '2024-01-16', duration: 220 },
             { date: '2024-01-17', duration: 280 },
             { date: '2024-01-18', duration: 310 },
             { date: '2024-01-19', duration: 250 },
             { date: '2024-01-20', duration: 200 },
             { date: '2024-01-21', duration: 160 }
           ],
           trafficSources: [
             { source: 'Direct', percentage: 45, users: 40 },
             { source: 'Google Search', percentage: 30, users: 27 },
             { source: 'Social Media', percentage: 15, users: 13 },
             { source: 'Email', percentage: 10, users: 9 }
           ],
           deviceTypes: [
             { device: 'Desktop', percentage: 60, users: 53 },
             { device: 'Mobile', percentage: 35, users: 31 },
             { device: 'Tablet', percentage: 5, users: 5 }
           ],
           contentStatusDistribution: [
             { status: 'Published', count: 23, percentage: 49 },
             { status: 'Draft', count: 12, percentage: 26 },
             { status: 'Pending Review', count: 12, percentage: 25 }
           ],
           hourlyActivity: [
             { hour: '00:00', activity: 2 },
             { hour: '06:00', activity: 8 },
             { hour: '09:00', activity: 25 },
             { hour: '12:00', activity: 35 },
             { hour: '15:00', activity: 28 },
             { hour: '18:00', activity: 20 },
             { hour: '21:00', activity: 12 }
           ]
         },
        '30d': {
          pageViews: 5234,
          uniqueUsers: 342,
          sessions: 678,
          bounceRate: 38.7,
          avgSessionDuration: 312,
          topPages: [
            { page: '/', views: 1890, title: 'Home' },
            { page: '/content', views: 1234, title: 'Articles' },
            { page: '/dashboard', views: 987, title: 'Dashboard' },
            { page: '/login', views: 756, title: 'Login' },
            { page: '/content/mycontent', views: 543, title: 'My Content' }
          ],
          userEngagement: [],
          contentMetrics: {
            totalArticles: 47,
            publishedArticles: 23,
            draftArticles: 12,
            pendingArticles: 12
          },
           userActivity: {
             logins: 342,
             articleViews: 1890,
             articleCreations: 23,
             articleApprovals: 45
           },
           // Additional chart data for 30d
           pageViewsOverTime: [
             { date: '2024-01-01', views: 120 },
             { date: '2024-01-05', views: 180 },
             { date: '2024-01-10', views: 220 },
             { date: '2024-01-15', views: 190 },
             { date: '2024-01-20', views: 250 },
             { date: '2024-01-25', views: 280 },
             { date: '2024-01-30', views: 210 }
           ],
           sessionDurationTrend: [
             { date: '2024-01-01', duration: 200 },
             { date: '2024-01-05', duration: 250 },
             { date: '2024-01-10', duration: 300 },
             { date: '2024-01-15', duration: 280 },
             { date: '2024-01-20', duration: 320 },
             { date: '2024-01-25', duration: 350 },
             { date: '2024-01-30', duration: 290 }
           ],
           trafficSources: [
             { source: 'Direct', percentage: 50, users: 171 },
             { source: 'Google Search', percentage: 25, users: 86 },
             { source: 'Social Media', percentage: 15, users: 51 },
             { source: 'Email', percentage: 10, users: 34 }
           ],
           deviceTypes: [
             { device: 'Desktop', percentage: 65, users: 222 },
             { device: 'Mobile', percentage: 30, users: 103 },
             { device: 'Tablet', percentage: 5, users: 17 }
           ],
           contentStatusDistribution: [
             { status: 'Published', count: 23, percentage: 49 },
             { status: 'Draft', count: 12, percentage: 26 },
             { status: 'Pending Review', count: 12, percentage: 25 }
           ],
           hourlyActivity: [
             { hour: '00:00', activity: 5 },
             { hour: '06:00', activity: 15 },
             { hour: '09:00', activity: 45 },
             { hour: '12:00', activity: 65 },
             { hour: '15:00', activity: 55 },
             { hour: '18:00', activity: 40 },
             { hour: '21:00', activity: 25 }
           ]
         }
      };
      
      setAnalyticsData(mockData[timeRange] || mockData['7d']);
      setLoading(false);
    };

    fetchAnalyticsData();
  }, [timeRange]);

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const StatCard = ({ title, value, icon: Icon, change, changeType, subtitle, gradient, delay = 0 }) => (
    <div 
      className="metrics-card animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className="flex items-center space-x-2">
          <div className={`p-2 rounded-lg ${gradient || 'bg-blue-100'}`}>
            <Icon className={`h-5 w-5 ${gradient ? 'text-white' : 'text-blue-600'}`} />
          </div>
          {change && (
            <div className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${
              changeType === 'increase' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {changeType === 'increase' ? (
                <ArrowUpIcon className="h-4 w-4 mr-1" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 mr-1" />
              )}
              <span>{change}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-content">
          <div className="comment-management-loading">
            <div className="uniform-spinner"></div>
            <p>Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        {/* Header */}
        <div className="dashboard-header">
          <div className="dashboard-header-left">
            <div className="flex items-center space-x-4">
              <div>
                <ChartBarIconSolid className="h-8 w-8 text-black" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-black">
                  Analytics Dashboard
                </h1>
                <p className="text-gray-600">Track your website performance and user engagement</p>
              </div>
            </div>
          </div>
          
          <div className="dashboard-header-controls">
            <div className="dashboard-time-range">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="dashboard-time-range-select"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <ChevronDownIcon className="dashboard-dropdown-icon" />
            </div>
            <div className="live-data-indicator">
              <div className="live-data-pulse"></div>
              <span className="live-data-text">Live Data</span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="dashboard-main-content">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Page Views"
          value={formatNumber(analyticsData.pageViews)}
          icon={EyeIconSolid}
          change="12.5"
          changeType="increase"
          subtitle="Total page views"
          gradient="border-blue-500 bg-gradient-to-r from-blue-500 to-blue-600"
          delay={0}
        />
        <StatCard
          title="Unique Users"
          value={formatNumber(analyticsData.uniqueUsers)}
          icon={UsersIconSolid}
          change="8.3"
          changeType="increase"
          subtitle="Individual visitors"
          gradient="border-green-500 bg-gradient-to-r from-green-500 to-green-600"
          delay={100}
        />
        <StatCard
          title="Sessions"
          value={formatNumber(analyticsData.sessions)}
          icon={ChartBarIconSolid}
          change="15.2"
          changeType="increase"
          subtitle="User sessions"
          gradient="border-purple-500 bg-gradient-to-r from-purple-500 to-purple-600"
          delay={200}
        />
        <StatCard
          title="Avg. Session Duration"
          value={formatDuration(analyticsData.avgSessionDuration)}
          icon={ClockIcon}
          change="5.7"
          changeType="increase"
          subtitle="Time per session"
          gradient="border-orange-500 bg-gradient-to-r from-orange-500 to-orange-600"
          delay={300}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Bounce Rate"
          value={`${analyticsData.bounceRate}%`}
          icon={ArrowTrendingDownIcon}
          change="2.1"
          changeType="decrease"
          subtitle="Single-page sessions"
          gradient="border-red-500 bg-gradient-to-r from-red-500 to-red-600"
          delay={400}
        />
        <StatCard
          title="Total Articles"
          value={analyticsData.contentMetrics.totalArticles}
          icon={DocumentTextIconSolid}
          subtitle="All content pieces"
          gradient="border-indigo-500 bg-gradient-to-r from-indigo-500 to-indigo-600"
          delay={500}
        />
        <StatCard
          title="Published"
          value={analyticsData.contentMetrics.publishedArticles}
          icon={ArrowTrendingUpIcon}
          subtitle="Live articles"
          gradient="border-emerald-500 bg-gradient-to-r from-emerald-500 to-emerald-600"
          delay={600}
        />
        <StatCard
          title="Pending Review"
          value={analyticsData.contentMetrics.pendingArticles}
          icon={ClockIcon}
          subtitle="Awaiting approval"
          gradient="border-yellow-500 bg-gradient-to-r from-yellow-500 to-yellow-600"
          delay={700}
        />
      </div>


      {/* Charts Row with Top Articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Top 5 Most Popular Articles */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 border-2 border-emerald-200 hover:shadow-3xl hover:border-emerald-300 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <FireIcon className="h-6 w-6 text-orange-600" />
              <h3 className="text-xl font-bold text-gray-900">Top Articles</h3>
              </div>
            <div className="text-sm text-gray-500">Most popular</div>
            </div>
          
          <div className="space-y-4">
            {[
              { 
                title: 'Breaking: Revolutionary AI Technology Changes Everything', 
                views: 15420, 
                category: 'Technology',
                publishedDate: '2024-01-18'
              },
              { 
                title: 'Climate Change: Latest Scientific Breakthroughs', 
                views: 12850, 
                category: 'Environment',
                publishedDate: '2024-01-17'
              },
              { 
                title: 'Economic Analysis: Market Trends and Predictions', 
                views: 9870, 
                category: 'Business',
                publishedDate: '2024-01-16'
              },
              { 
                title: 'Health & Wellness: New Medical Discoveries', 
                views: 7650, 
                category: 'Health',
                publishedDate: '2024-01-15'
              },
              { 
                title: 'Sports Update: Championship Results and Analysis', 
                views: 5430, 
                category: 'Sports',
                publishedDate: '2024-01-14'
              }
            ].map((article, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200">
                <div className="flex items-center space-x-3">
                  {/* Ranking Badge */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm flex-shrink-0 ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                    index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                    index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                    'bg-gradient-to-r from-emerald-400 to-emerald-500'
                  }`}>
                    {index + 1}
                  </div>
                  
                  {/* Article Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm leading-tight mb-1">{article.title}</h4>
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">{article.category}</span>
                      <span>{new Date(article.publishedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
                </div>
                
                {/* Views */}
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-lg font-bold text-emerald-700">{article.views.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">views</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* User Engagement Trend */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 border-2 border-purple-200 hover:shadow-3xl hover:border-purple-300 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <ChartBarIcon className="h-6 w-6 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-900">User Engagement Trend</h3>
              </div>
            <div className="text-sm text-gray-500">7-day overview</div>
            </div>
          
          {/* Modern Line Chart with Area */}
          <div className="relative h-64 mb-4">
            <svg className="w-full h-full" viewBox="0 0 400 200">
              {/* Grid lines */}
              <defs>
                <pattern id="engagementGrid" width="40" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#engagementGrid)" />
              
              {/* Area chart */}
              <path
                d={`M 20,190 ${analyticsData.userEngagement.map((day, index) => {
                  const x = (index / (analyticsData.userEngagement.length - 1)) * 360 + 20;
                  const maxUsers = Math.max(...analyticsData.userEngagement.map(d => d.users));
                  const y = 190 - ((day.users / maxUsers) * 160);
                  return `L ${x},${y}`;
                }).join(' ')} L 380,190 Z`}
                fill="url(#engagementAreaGradient)"
                stroke="url(#engagementLineGradient)"
                strokeWidth="3"
                className="opacity-80"
              />
              
              {/* Data points */}
              {analyticsData.userEngagement.map((day, index) => {
                const x = (index / (analyticsData.userEngagement.length - 1)) * 360 + 20;
                const maxUsers = Math.max(...analyticsData.userEngagement.map(d => d.users));
                const y = 190 - ((day.users / maxUsers) * 160);
                return (
                  <g key={index} className="cursor-pointer group">
                    <circle
                      cx={x}
                      cy={y}
                      r="5"
                      fill="#8b5cf6"
                      stroke="white"
                      strokeWidth="3"
                      className="transition-all duration-300 hover:r-7 hover:scale-125"
                    />
                    {/* Hover overlay */}
                    <circle
                      cx={x}
                      cy={y}
                      r="8"
                      fill="rgba(139, 92, 246, 0.2)"
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    />
                    <text
                      x={x}
                      y={y - 15}
                      textAnchor="middle"
                      className="text-sm font-medium fill-gray-600"
                      fontSize="13"
                    >
                      {day.users}
                    </text>
                  </g>
                );
              })}
              
              {/* Gradient definitions */}
              <defs>
                <linearGradient id="engagementAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="engagementLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          
          {/* X-axis labels */}
          <div className="flex justify-between text-sm text-gray-500 mb-4">
            {analyticsData.userEngagement.map((day, index) => (
              <span key={index} className="text-center">
                {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            ))}
          </div>
          
          {/* Enhanced Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center mb-1">
                <UsersIcon className="h-4 w-4 text-purple-600 mr-1" />
                <span className="text-xs font-medium text-purple-700">Total Users</span>
            </div>
              <p className="text-lg font-bold text-purple-800">
                {analyticsData.userEngagement.reduce((sum, day) => sum + day.users, 0)}
              </p>
              </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center mb-1">
                <ChartBarIcon className="h-4 w-4 text-blue-600 mr-1" />
                <span className="text-xs font-medium text-blue-700">Total Sessions</span>
            </div>
              <p className="text-lg font-bold text-blue-800">
                {analyticsData.userEngagement.reduce((sum, day) => sum + day.sessions, 0)}
              </p>
      </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center mb-1">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-xs font-medium text-green-700">Avg Daily</span>
              </div>
              <p className="text-lg font-bold text-green-800">
                {Math.round(analyticsData.userEngagement.reduce((sum, day) => sum + day.users, 0) / analyticsData.userEngagement.length)}
                </p>
              </div>
          </div>
        </div>

        {/* Page Views Over Time - Line Chart */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 border-2 border-blue-200 hover:shadow-3xl hover:border-blue-300 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
                <ChartBarIcon className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">Page Views Over Time</h3>
            </div>
            <div className="text-sm text-gray-500">Trend analysis</div>
          </div>
          
          {/* Line Chart Visualization */}
          <div className="relative h-64 mb-4">
            <svg className="w-full h-full" viewBox="0 0 400 200">
              {/* Grid lines */}
              <defs>
                <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Line chart */}
              <polyline
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={analyticsData.pageViewsOverTime.map((data, index) => {
                  const x = (index / (analyticsData.pageViewsOverTime.length - 1)) * 360 + 20;
                  const maxViews = Math.max(...analyticsData.pageViewsOverTime.map(d => d.views));
                  const y = 180 - ((data.views / maxViews) * 160) + 10;
                  return `${x},${y}`;
                }).join(' ')}
              />
              
              {/* Data points */}
              {analyticsData.pageViewsOverTime.map((data, index) => {
                const x = (index / (analyticsData.pageViewsOverTime.length - 1)) * 360 + 20;
                const maxViews = Math.max(...analyticsData.pageViewsOverTime.map(d => d.views));
                const y = 180 - ((data.views / maxViews) * 160) + 10;
                return (
                  <g key={index} className="cursor-pointer group">
                    <circle
                      cx={x}
                      cy={y}
                      r="4"
                      fill="#3b82f6"
                      stroke="white"
                      strokeWidth="2"
                      className="transition-all duration-300 hover:r-6 hover:scale-125"
                    />
                    {/* Hover overlay */}
                    <circle
                      cx={x}
                      cy={y}
                      r="7"
                      fill="rgba(59, 130, 246, 0.2)"
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    />
                    <text
                      x={x}
                      y={y - 10}
                      textAnchor="middle"
                      className="text-sm font-medium fill-gray-600"
                      fontSize="13"
                    >
                      {data.views}
                    </text>
                  </g>
                );
              })}
              
              {/* Gradient definition */}
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          
          {/* X-axis labels */}
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            {analyticsData.pageViewsOverTime.map((data, index) => (
              <span key={index} className="text-center">
                {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            ))}
          </div>
        </div>

        {/* Session Duration Trend - Area Chart */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 border-2 border-emerald-200 hover:shadow-3xl hover:border-emerald-300 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
                <ClockIcon className="h-6 w-6 text-green-600" />
              <h3 className="text-xl font-bold text-gray-900">Session Duration Trend</h3>
            </div>
            <div className="text-sm text-gray-500">Average minutes</div>
          </div>
          
          {/* Area Chart Visualization */}
          <div className="relative h-64 mb-4">
            <svg className="w-full h-full" viewBox="0 0 400 200">
              {/* Grid lines */}
              <defs>
                <pattern id="grid2" width="40" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid2)" />
              
              {/* Area chart path */}
              <path
                d={`M 20,190 ${analyticsData.sessionDurationTrend.map((data, index) => {
                  const x = (index / (analyticsData.sessionDurationTrend.length - 1)) * 360 + 20;
                  const maxDuration = Math.max(...analyticsData.sessionDurationTrend.map(d => d.duration));
                  const y = 190 - ((data.duration / maxDuration) * 160);
                  return `L ${x},${y}`;
                }).join(' ')} L 380,190 Z`}
                fill="url(#areaGradient)"
                stroke="url(#areaLineGradient)"
                strokeWidth="2"
                className="opacity-80"
              />
              
              {/* Data points */}
              {analyticsData.sessionDurationTrend.map((data, index) => {
                const x = (index / (analyticsData.sessionDurationTrend.length - 1)) * 360 + 20;
                const maxDuration = Math.max(...analyticsData.sessionDurationTrend.map(d => d.duration));
                const y = 190 - ((data.duration / maxDuration) * 160);
                return (
                  <g key={index} className="cursor-pointer group">
                    <circle
                      cx={x}
                      cy={y}
                      r="4"
                      fill="#10b981"
                      stroke="white"
                      strokeWidth="2"
                      className="transition-all duration-300 hover:r-6 hover:scale-125"
                    />
                    {/* Hover overlay */}
                    <circle
                      cx={x}
                      cy={y}
                      r="7"
                      fill="rgba(16, 185, 129, 0.2)"
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    />
                    <text
                      x={x}
                      y={y - 10}
                      textAnchor="middle"
                      className="text-sm font-medium fill-gray-600"
                      fontSize="13"
                    >
                      {Math.floor(data.duration / 60)}m
                    </text>
                  </g>
                );
              })}
              
              {/* Gradient definitions */}
              <defs>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="areaLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          
          {/* X-axis labels */}
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            {analyticsData.sessionDurationTrend.map((data, index) => (
              <span key={index} className="text-center">
                {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            ))}
          </div>
        </div>
      </div>


      {/* Additional Charts Row 3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Content Status Distribution - Pie Chart */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 border-2 border-pink-200 hover:shadow-3xl hover:border-pink-300 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <DocumentTextIcon className="h-6 w-6 text-pink-600" />
              <h3 className="text-xl font-bold text-gray-900">Content Status</h3>
              </div>
            <div className="text-sm text-gray-500">Article distribution</div>
          </div>
          <div className="space-y-4">
            {/* Pie Chart Visualization */}
            <div className="relative w-48 h-48 mx-auto mb-6">
              <svg className="w-full h-full" viewBox="0 0 200 200">
                {analyticsData.contentStatusDistribution.map((status, index) => {
                  const colors = ['#10b981', '#eab308', '#ef4444'];
                  const total = analyticsData.contentStatusDistribution.reduce((sum, item) => sum + item.count, 0);
                  let cumulativePercentage = 0;
                  
                  // Calculate cumulative percentage for previous items
                  for (let i = 0; i < index; i++) {
                    cumulativePercentage += (analyticsData.contentStatusDistribution[i].count / total) * 100;
                  }
                  
                  const percentage = (status.count / total) * 100;
                  const startAngle = (cumulativePercentage / 100) * 360;
                  const endAngle = ((cumulativePercentage + percentage) / 100) * 360;
                  
                  const radius = 80;
                  const centerX = 100;
                  const centerY = 100;
                  
                  const startAngleRad = (startAngle - 90) * (Math.PI / 180);
                  const endAngleRad = (endAngle - 90) * (Math.PI / 180);
                  
                  const x1 = centerX + radius * Math.cos(startAngleRad);
                  const y1 = centerY + radius * Math.sin(startAngleRad);
                  const x2 = centerX + radius * Math.cos(endAngleRad);
                  const y2 = centerY + radius * Math.sin(endAngleRad);
                  
                  const largeArcFlag = percentage > 50 ? 1 : 0;
                  
                  const pathData = [
                    `M ${centerX} ${centerY}`,
                    `L ${x1} ${y1}`,
                    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                    'Z'
                  ].join(' ');
              
                  return (
                    <g key={index} className="cursor-pointer group">
                      <path
                        d={pathData}
                        fill={colors[index]}
                        stroke="white"
                        strokeWidth="2"
                        className="transition-all duration-300 hover:opacity-90 hover:scale-105"
                        style={{ transformOrigin: '100px 100px' }}
                      />
                      {/* Tooltip overlay */}
                      <path
                        d={pathData}
                        fill="rgba(255,255,255,0.1)"
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      />
                    </g>
                  );
                })}
                
                {/* Center circle */}
                <circle cx="100" cy="100" r="30" fill="white" stroke="#e5e7eb" strokeWidth="2" />
                <text x="100" y="100" textAnchor="middle" dominantBaseline="middle" className="text-lg font-bold fill-gray-700">
                  {analyticsData.contentStatusDistribution.reduce((sum, item) => sum + item.count, 0)}
                </text>
                <text x="100" y="115" textAnchor="middle" dominantBaseline="middle" className="text-sm fill-gray-500">
                  Total
                </text>
              </svg>
            </div>
            
            {/* Legend */}
            <div className="space-y-3">
              {analyticsData.contentStatusDistribution.map((status, index) => {
                const colors = ['#10b981', '#eab308', '#ef4444'];
                const bgColors = ['bg-emerald-50', 'bg-yellow-50', 'bg-red-50'];
                const textColors = ['text-emerald-700', 'text-yellow-700', 'text-red-700'];
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-pink-50 to-pink-100 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${colors[index]}`} style={{ backgroundColor: colors[index] }}></div>
                      <span className="font-semibold text-gray-900">{status.status}</span>
                  </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{status.count}</p>
                      <p className="text-xs text-gray-500">{status.percentage}%</p>
                    </div>
                    </div>
                );
              })}
                  </div>
                </div>
        </div>

        {/* Hourly Activity - Bar Chart */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 border-2 border-cyan-200 hover:shadow-3xl hover:border-cyan-300 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <ClockIcon className="h-6 w-6 text-cyan-600" />
              <h3 className="text-xl font-bold text-gray-900">Hourly Activity</h3>
            </div>
            <div className="text-sm text-gray-500">Peak usage times</div>
          </div>
          <div className="space-y-4">
            {/* Bar Chart Visualization */}
            <div className="relative h-64 mb-6">
              <svg className="w-full h-full" viewBox="0 0 400 200">
                {/* Grid lines */}
                <defs>
                  <pattern id="hourlyGrid" width="40" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#hourlyGrid)" />
                
                {/* Bars */}
                {analyticsData.hourlyActivity.map((hour, index) => {
                  const maxActivity = Math.max(...analyticsData.hourlyActivity.map(h => h.activity));
                  const barHeight = (hour.activity / maxActivity) * 160;
                  const barWidth = 30;
                  const barSpacing = 50;
                  const x = (index * barSpacing) + 20;
                  const y = 190 - barHeight;
                  
                  return (
                    <g key={index} className="cursor-pointer group">
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        fill="url(#hourlyBarGradient)"
                        stroke="white"
                        strokeWidth="2"
                        className="transition-all duration-300 hover:opacity-90 hover:scale-105"
                        style={{ transformOrigin: `${x + barWidth/2}px ${y + barHeight}px` }}
                      />
                      {/* Hover overlay */}
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        fill="rgba(255,255,255,0.2)"
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      />
                      <text
                        x={x + barWidth/2}
                        y={y - 8}
                        textAnchor="middle"
                        className="text-sm font-medium fill-gray-600"
                        fontSize="14"
                      >
                        {hour.activity}
                      </text>
                      <text
                        x={x + barWidth/2}
                        y={210}
                        textAnchor="middle"
                        className="text-sm fill-gray-500"
                        fontSize="12"
                      >
                        {hour.hour}
                      </text>
                    </g>
                  );
            })}
                
                {/* Gradient definition */}
                <defs>
                  <linearGradient id="hourlyBarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#0891b2" />
                  </linearGradient>
                </defs>
              </svg>
          </div>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center mb-1">
                  <ClockIcon className="h-4 w-4 text-cyan-600 mr-1" />
                  <span className="text-xs font-medium text-cyan-700">Peak Hour</span>
                </div>
                <p className="text-lg font-bold text-cyan-800">
                  {analyticsData.hourlyActivity.reduce((max, hour) => 
                    hour.activity > max.activity ? hour : max
                  ).hour}
                </p>
        </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center mb-1">
                  <ChartBarIcon className="h-4 w-4 text-blue-600 mr-1" />
                  <span className="text-xs font-medium text-blue-700">Max Activity</span>
                </div>
                <p className="text-lg font-bold text-blue-800">
                  {Math.max(...analyticsData.hourlyActivity.map(h => h.activity))}
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center mb-1">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-xs font-medium text-green-700">Avg Activity</span>
                </div>
                <p className="text-lg font-bold text-green-800">
                  {Math.round(analyticsData.hourlyActivity.reduce((sum, hour) => sum + hour.activity, 0) / analyticsData.hourlyActivity.length)}
                </p>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Additional Charts Row 4 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Bounce Rate Analysis */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 border-2 border-red-200 hover:shadow-3xl hover:border-red-300 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <ArrowTrendingDownIcon className="h-6 w-6 text-red-600" />
              <h3 className="text-xl font-bold text-gray-900">Bounce Rate Analysis</h3>
              </div>
            <div className="text-sm text-gray-500">Page engagement</div>
          </div>
          <div className="space-y-4">
            {/* Horizontal Bar Chart */}
            <div className="relative h-64 mb-6">
              <svg className="w-full h-full" viewBox="0 0 400 200">
                {/* Grid lines */}
                <defs>
                  <pattern id="bounceGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#bounceGrid)" />
                
                {/* Horizontal bars */}
                {[
                  { page: 'Homepage', bounceRate: 35, visitors: 1200 },
                  { page: 'Articles', bounceRate: 28, visitors: 850 },
                  { page: 'About', bounceRate: 45, visitors: 320 },
                  { page: 'Contact', bounceRate: 52, visitors: 180 }
                ].map((item, index) => {
                  const barWidth = (item.bounceRate / 60) * 350; // Scale to max 60%
                  const barHeight = 30;
                  const barSpacing = 40;
                  const x = 20;
                  const y = (index * barSpacing) + 20;
                  const colors = ['#ef4444', '#f97316', '#eab308', '#dc2626'];
              
                  return (
                    <g key={index} className="cursor-pointer group">
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        fill={colors[index]}
                        stroke="white"
                        strokeWidth="2"
                        rx="4"
                        className="transition-all duration-300 hover:opacity-90 hover:scale-105"
                        style={{ transformOrigin: `${x}px ${y + barHeight/2}px` }}
                      />
                      {/* Hover overlay */}
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        fill="rgba(255,255,255,0.2)"
                        rx="4"
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      />
                      <text
                        x={x + barWidth + 15}
                        y={y + barHeight/2 + 5}
                        className="text-sm font-medium fill-gray-700"
                        fontSize="15"
                      >
                        {item.page}
                      </text>
                      <text
                        x={x + barWidth + 15}
                        y={y + barHeight/2 + 20}
                        className="text-sm fill-gray-500"
                        fontSize="13"
                      >
                        {item.bounceRate}% • {item.visitors} visitors
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center mb-1">
                  <ArrowTrendingDownIcon className="h-4 w-4 text-red-600 mr-1" />
                  <span className="text-xs font-medium text-red-700">Highest Bounce</span>
                </div>
                <p className="text-lg font-bold text-red-800">Contact</p>
                <p className="text-xs text-red-600">52%</p>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center mb-1">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-xs font-medium text-green-700">Lowest Bounce</span>
                </div>
                <p className="text-lg font-bold text-green-800">Articles</p>
                <p className="text-xs text-green-600">28%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Performance */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 border-2 border-emerald-200 hover:shadow-3xl hover:border-emerald-300 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
              <ChartBarIcon className="h-6 w-6 text-emerald-600" />
              <h3 className="text-xl font-bold text-gray-900">Content Performance</h3>
                    </div>
            <div className="text-sm text-gray-500">Top performing</div>
                  </div>
          <div className="space-y-4">
            {/* Donut Chart Visualization */}
            <div className="relative w-48 h-48 mx-auto mb-6">
              <svg className="w-full h-full" viewBox="0 0 200 200">
                {[
                  { title: 'Breaking News Article', views: 2500, engagement: 85 },
                  { title: 'Technology Review', views: 1800, engagement: 78 },
                  { title: 'Opinion Piece', views: 1200, engagement: 72 },
                  { title: 'Feature Story', views: 950, engagement: 68 }
                ].map((item, index) => {
                  const colors = ['#10b981', '#22c55e', '#84cc16', '#14b8a6'];
                  const total = 2500 + 1800 + 1200 + 950;
                  let cumulativePercentage = 0;
                  
                  // Calculate cumulative percentage for previous items
                  for (let i = 0; i < index; i++) {
                    const prevItem = [
                      { views: 2500 }, { views: 1800 }, { views: 1200 }, { views: 950 }
                    ][i];
                    cumulativePercentage += (prevItem.views / total) * 100;
                  }
                  
                  const percentage = (item.views / total) * 100;
                  const startAngle = (cumulativePercentage / 100) * 360;
                  const endAngle = ((cumulativePercentage + percentage) / 100) * 360;
                  
                  const outerRadius = 80;
                  const innerRadius = 50;
                  const centerX = 100;
                  const centerY = 100;
                  
                  const startAngleRad = (startAngle - 90) * (Math.PI / 180);
                  const endAngleRad = (endAngle - 90) * (Math.PI / 180);
                  
                  const x1 = centerX + outerRadius * Math.cos(startAngleRad);
                  const y1 = centerY + outerRadius * Math.sin(startAngleRad);
                  const x2 = centerX + outerRadius * Math.cos(endAngleRad);
                  const y2 = centerY + outerRadius * Math.sin(endAngleRad);
                  
                  const x3 = centerX + innerRadius * Math.cos(endAngleRad);
                  const y3 = centerY + innerRadius * Math.sin(endAngleRad);
                  const x4 = centerX + innerRadius * Math.cos(startAngleRad);
                  const y4 = centerY + innerRadius * Math.sin(startAngleRad);
                  
                  const largeArcFlag = percentage > 50 ? 1 : 0;
                  
                  const pathData = [
                    `M ${x1} ${y1}`,
                    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                    `L ${x3} ${y3}`,
                    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
                    'Z'
                  ].join(' ');
                  
                  return (
                    <g key={index} className="cursor-pointer group">
                      <path
                        d={pathData}
                        fill={colors[index]}
                        stroke="white"
                        strokeWidth="2"
                        className="transition-all duration-300 hover:opacity-90 hover:scale-105"
                        style={{ transformOrigin: '100px 100px' }}
                      />
                      {/* Tooltip */}
                      <path
                        d={pathData}
                        fill="rgba(255,255,255,0.1)"
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      />
                    </g>
                  );
                })}
                
                {/* Center text */}
                <text x="100" y="95" textAnchor="middle" dominantBaseline="middle" className="text-lg font-bold fill-gray-700">
                  {2500 + 1800 + 1200 + 950}
                </text>
                <text x="100" y="110" textAnchor="middle" dominantBaseline="middle" className="text-sm fill-gray-500">
                  Total Views
                </text>
              </svg>
                    </div>
            
            {/* Legend */}
            <div className="space-y-3">
              {[
                { title: 'Breaking News Article', views: 2500, engagement: 85 },
                { title: 'Technology Review', views: 1800, engagement: 78 },
                { title: 'Opinion Piece', views: 1200, engagement: 72 },
                { title: 'Feature Story', views: 950, engagement: 68 }
              ].map((item, index) => {
                const colors = ['#10b981', '#22c55e', '#84cc16', '#14b8a6'];
                const percentage = Math.round((item.views / 6450) * 100);
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: colors[index] }}></div>
                      <span className="font-semibold text-gray-900 text-sm">{item.title}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{item.views.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{percentage}% • {item.engagement}% engagement</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      </div>

      {/* Additional Charts Row 6 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Search Keywords */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 border-2 border-yellow-200 hover:shadow-3xl hover:border-yellow-300 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <MagnifyingGlassIcon className="h-6 w-6 text-yellow-600" />
              <h3 className="text-xl font-bold text-gray-900">Search Keywords</h3>
              </div>
            <div className="text-sm text-gray-500">Top searches</div>
          </div>
          <div className="space-y-4">
            {[
              { keyword: 'technology news', searches: 450, position: 2 },
              { keyword: 'breaking news', searches: 380, position: 1 },
              { keyword: 'opinion articles', searches: 320, position: 3 },
              { keyword: 'feature stories', searches: 280, position: 4 }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${['bg-yellow-500', 'bg-amber-500', 'bg-orange-500', 'bg-red-500'][index]}`}></div>
                  <span className="font-semibold text-gray-900">{item.keyword}</span>
                  </div>
                  <div className="flex items-center space-x-3 flex-1">
                  <div className="w-64 bg-gray-200 rounded-full h-4 overflow-hidden flex-shrink-0">
                      <div 
                        className="h-4 rounded-full transition-all duration-700"
                        style={{ 
                        width: `${(item.searches / 450) * 100}%`, 
                          minWidth: '4px',
                        backgroundColor: ['#eab308', '#f59e0b', '#f97316', '#ef4444'][index]
                        }}
                      ></div>
                    </div>
                    <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">{item.searches}</p>
                    <p className="text-xs text-gray-500">Rank #{item.position}</p>
                    </div>
                  </div>
                </div>
            ))}
          </div>
        </div>

        {/* User Retention */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 border-2 border-violet-200 hover:shadow-3xl hover:border-violet-300 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <UserGroupIcon className="h-6 w-6 text-violet-600" />
              <h3 className="text-xl font-bold text-gray-900">User Retention</h3>
              </div>
            <div className="text-sm text-gray-500">Return visitors</div>
          </div>
          <div className="space-y-4">
            {[
              { period: 'Day 1', retention: 85, users: 2000 },
              { period: 'Day 7', retention: 45, users: 1050 },
              { period: 'Day 30', retention: 25, users: 580 },
              { period: 'Day 90', retention: 15, users: 350 }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-violet-50 to-violet-100 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${['bg-violet-500', 'bg-purple-500', 'bg-indigo-500', 'bg-blue-500'][index]}`}></div>
                  <span className="font-semibold text-gray-900">{item.period}</span>
                </div>
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-64 bg-gray-200 rounded-full h-4 overflow-hidden flex-shrink-0">
                    <div 
                      className="h-4 rounded-full transition-all duration-700"
                      style={{ 
                        width: `${item.retention}%`, 
                        minWidth: '4px',
                        backgroundColor: ['#8b5cf6', '#a855f7', '#6366f1', '#3b82f6'][index]
                      }}
                    ></div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">{item.retention}%</p>
                    <p className="text-xs text-gray-500">{item.users} users</p>
                  </div>
                </div>
              </div>
            ))}
        </div>
        </div>
      </div>

      {/* Data Refresh Info */}
        <div className="flex items-center justify-center space-x-3 mb-1">
          <div className="flex items-center space-x-1 text-xs text-gray-600">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Data refreshed every hour</span>
          </div>
          <div className="w-px h-3 bg-gray-300"></div>
          <div className="text-xs text-gray-600">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>
        <div className="flex items-center justify-center space-x-1">
          <span className="text-xs font-medium text-gray-700">Google Analytics Integration:</span>
          <div className="flex items-center space-x-1 px-2 py-0.5 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-xs font-medium">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span>Active</span>
        </div>
      </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
