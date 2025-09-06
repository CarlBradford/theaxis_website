import { useState, useEffect } from 'react';
import { authAPI, articlesAPI, analyticsAPI } from '../services/apiService';

const HealthCheck = () => {
  const [checks, setChecks] = useState({
    frontend: { status: 'loading', message: 'Checking...' },
    backend: { status: 'loading', message: 'Checking...' },
    database: { status: 'loading', message: 'Checking...' },
    auth: { status: 'loading', message: 'Checking...' },
    articles: { status: 'loading', message: 'Checking...' },
    analytics: { status: 'loading', message: 'Checking...' },
  });

  useEffect(() => {
    runHealthChecks();
  }, []);

  const runHealthChecks = async () => {
    // Frontend check
    setChecks(prev => ({ ...prev, frontend: { status: 'success', message: 'Frontend is running' } }));

    // Backend check
    try {
      const response = await fetch('http://localhost:3001/health');
      if (response.ok) {
        setChecks(prev => ({ ...prev, backend: { status: 'success', message: 'Backend is running' } }));
      } else {
        setChecks(prev => ({ ...prev, backend: { status: 'error', message: `Backend error: ${response.status}` } }));
      }
    } catch (error) {
      setChecks(prev => ({ ...prev, backend: { status: 'error', message: 'Backend not reachable' } }));
    }

    // Database check (via articles API)
    try {
      await articlesAPI.getArticles({ limit: 1 });
      setChecks(prev => ({ ...prev, database: { status: 'success', message: 'Database connected' } }));
    } catch (error) {
      setChecks(prev => ({ ...prev, database: { status: 'error', message: 'Database connection failed' } }));
    }

    // Auth check
    try {
      await authAPI.getProfile();
      setChecks(prev => ({ ...prev, auth: { status: 'success', message: 'Auth working' } }));
    } catch (error) {
      setChecks(prev => ({ ...prev, auth: { status: 'error', message: 'Auth not working (may need login)' } }));
    }

    // Articles API check
    try {
      await articlesAPI.getArticles({ limit: 5 });
      setChecks(prev => ({ ...prev, articles: { status: 'success', message: 'Articles API working' } }));
    } catch (error) {
      setChecks(prev => ({ ...prev, articles: { status: 'error', message: 'Articles API failed' } }));
    }

    // Analytics API check
    try {
      await analyticsAPI.getDashboard();
      setChecks(prev => ({ ...prev, analytics: { status: 'success', message: 'Analytics API working' } }));
    } catch (error) {
      setChecks(prev => ({ ...prev, analytics: { status: 'error', message: 'Analytics API failed' } }));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'loading': return '⏳';
      default: return '❓';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'loading': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent">
            Frontend Health Check
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(checks).map(([key, check]) => (
              <div key={key} className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold capitalize">{key}</h3>
                  <span className="text-2xl">{getStatusIcon(check.status)}</span>
                </div>
                <p className={`text-sm ${getStatusColor(check.status)}`}>
                  {check.message}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={runHealthChecks}
              className="bg-gradient-to-r from-blue-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
            >
              Run Health Checks Again
            </button>
          </div>

          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Links:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <a href="/" className="text-blue-600 hover:text-blue-800 underline">Home</a>
              <a href="/login" className="text-blue-600 hover:text-blue-800 underline">Login</a>
              <a href="/dashboard" className="text-blue-600 hover:text-blue-800 underline">Dashboard</a>
              <a href="/articles" className="text-blue-600 hover:text-blue-800 underline">Articles</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthCheck;
