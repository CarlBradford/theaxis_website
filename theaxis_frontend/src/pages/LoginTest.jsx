import { useState } from 'react';
import { authAPI } from '../services/apiService';

const LoginTest = () => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    try {
      const response = await authAPI.login({
        email: 'admin@theaxis.local',
        password: 'admin123'
      });
      setResult(`✅ SUCCESS: ${JSON.stringify(response, null, 2)}`);
    } catch (error) {
      setResult(`❌ ERROR: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Login Test</h1>
      <button 
        onClick={testLogin}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Admin Login'}
      </button>
      {result && (
        <pre className="mt-4 p-4 bg-gray-100 rounded text-sm overflow-auto">
          {result}
        </pre>
      )}
    </div>
  );
};

export default LoginTest;
