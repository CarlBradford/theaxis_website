import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { UserCircleIcon } from '@heroicons/react/24/outline';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    bio: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/profile');
      const userData = response.data.data;
      setProfile(userData);
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        username: userData.username || '',
        email: userData.email || '',
        bio: userData.bio || '',
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.put('/users/profile', formData);
      await fetchProfile();
      setEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <button
          onClick={() => setEditing(!editing)}
          className="btn-secondary"
        >
          {editing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      <div className="card">
        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className="input-field"
                rows={4}
                placeholder="Tell us about yourself..."
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {profile?.profileImage ? (
                  <img
                    src={profile.profileImage}
                    alt="Profile"
                    className="h-16 w-16 rounded-full"
                  />
                ) : (
                  <UserCircleIcon className="h-16 w-16 text-gray-400" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {profile?.firstName} {profile?.lastName}
                </h2>
                <p className="text-sm text-gray-500">
                  @{profile?.username}
                </p>
                <p className="text-sm text-gray-500 capitalize">
                  {profile?.role?.toLowerCase().replace('_', ' ')}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Email</h3>
                <p className="text-sm text-gray-900">{profile?.email}</p>
              </div>
              
              {profile?.bio && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Bio</h3>
                  <p className="text-sm text-gray-900">{profile.bio}</p>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-gray-700">Member Since</h3>
                <p className="text-sm text-gray-900">
                  {new Date(profile?.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              {profile?.lastLoginAt && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Last Login</h3>
                  <p className="text-sm text-gray-900">
                    {new Date(profile.lastLoginAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
