import { useState } from 'react';
import { authAPI } from '../services/apiService';

const LoginDebug = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('Testing login...');
      const response = await authAPI.login({ 
        email: 'admin@theaxis.local', 
        password: 'admin123' 
      });
      console.log('Login response:', response);
      setResult({ success: true, data: response });
    } catch (error) {
      console.error('Login error:', error);
      setResult({ 
        success: false, 
        error: error.message,
        details: error.response?.data,
        status: error.response?.status
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-2xl w-full bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
        <h1 className="text-2xl font-bold text-center mb-8">Login Debug</h1>
        
        <button
          onClick={testLogin}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {loading ? 'Testing...' : 'Test Login'}
        </button>

        {result && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">
              {result.success ? '✅ Success' : '❌ Error'}
            </h2>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <div className="mt-8 text-sm text-gray-600">
          <p><strong>Test Credentials:</strong></p>
          <p>Email: admin@theaxis.local</p>
          <p>Password: admin123</p>
        </div>
      </div>
    </div>
  );
};

export default LoginDebug;
