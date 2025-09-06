import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-8">
      <div className="text-center py-20">
        <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-600 to-blue-600 rounded-xl flex items-center justify-center mb-8">
          <span className="text-white font-bold text-3xl">A</span>
        </div>
        <h1 className="text-5xl font-bold sm:text-6xl md:text-7xl">
          Welcome to{' '}
          <span className="bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent">
            The AXIS
          </span>
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600 leading-relaxed">
          Your student publication platform for sharing stories, ideas, and perspectives. 
          Connect, create, and inspire.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center px-8 py-4 border-2 border-blue-600 text-lg font-medium rounded-lg text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>

              <div className="mt-24">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 hover:shadow-xl hover:bg-white/80 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-500 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Latest Articles</h3>
            <p className="text-gray-600 mb-6">
              Discover the latest stories and insights from our student writers.
            </p>
            <Link
              to="/articles"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
            >
              Browse Articles
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 hover:shadow-xl hover:bg-white/80 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Join Our Team</h3>
            <p className="text-gray-600 mb-6">
              Become a contributor and share your voice with the community.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
            >
              Register Now
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 hover:shadow-xl hover:bg-white/80 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Stay Connected</h3>
            <p className="text-gray-600 mb-6">
              Follow us for updates on new content and upcoming events.
            </p>
            <Link
              to="/articles"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
            >
              Learn More
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
