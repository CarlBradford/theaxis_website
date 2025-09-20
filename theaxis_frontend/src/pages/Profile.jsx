import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authAPI } from '../services/apiService';
import api from '../services/api';
import { 
  UserCircleIcon, 
  EyeIcon, 
  EyeSlashIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  CameraIcon,
  PencilIcon,
  XMarkIcon,
  CheckIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';
import '../styles/profile.css';

const Profile = () => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
  });
  
  // Image upload states
  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [tempImagePreview, setTempImagePreview] = useState(null);
  
  // Password change states
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
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
      });
      // Set image preview with proper URL construction
      if (userData.profileImage) {
        const imageUrl = userData.profileImage.startsWith('http') 
          ? userData.profileImage 
          : `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${userData.profileImage}`;
        setImagePreview(imageUrl);
      } else {
        setImagePreview(null);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Image upload handlers
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setImageError('Please select a valid image file');
      setTimeout(() => setImageError(null), 5000);
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setImageError('Image size must be less than 10MB');
      setTimeout(() => setImageError(null), 5000);
      return;
    }

    setImageError(null);
    
    // Create preview URL for modal display
    const previewUrl = URL.createObjectURL(file);
    setTempImagePreview(previewUrl);
    setShowUploadModal(true);
  };

  const confirmImageUpload = async () => {
    if (!tempImagePreview) return;
    
    setImageUploading(true);
    setShowUploadModal(false);

    try {
      // Get the file from the input
      const file = fileInputRef.current?.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await api.post('/users/upload-profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update profile with new image URL
      const imagePath = response.data.data.profileImage;
      const imageUrl = imagePath.startsWith('http') 
        ? imagePath 
        : `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${imagePath}`;
      
      setProfile(prev => ({ ...prev, profileImage: imageUrl }));
      setImagePreview(imageUrl);
      
      // Clean up the preview URL
      URL.revokeObjectURL(tempImagePreview);
      setTempImagePreview(null);
      
      // Show success message
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
      
    } catch (error) {
      console.error('Failed to upload image:', error);
      setImageError('Failed to upload image. Please try again.');
      // Auto-hide error message after 5 seconds
      setTimeout(() => setImageError(null), 5000);
      // Revert to previous image on error
      if (profile?.profileImage) {
        setImagePreview(profile.profileImage);
      } else {
        setImagePreview(null);
      }
    } finally {
      setImageUploading(false);
    }
  };

  const cancelImageUpload = () => {
    setShowUploadModal(false);
    if (tempImagePreview) {
      URL.revokeObjectURL(tempImagePreview);
      setTempImagePreview(null);
    }
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = async () => {
    try {
      await api.delete('/users/profile-image');
      setProfile(prev => ({ ...prev, profileImage: null }));
      setImagePreview(null);
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to remove image:', error);
      setImageError('Failed to remove image. Please try again.');
      setTimeout(() => setImageError(null), 5000);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setImageError('Please select a valid image file');
        setTimeout(() => setImageError(null), 5000);
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setImageError('Image size must be less than 10MB');
        setTimeout(() => setImageError(null), 5000);
        return;
      }

      setImageError(null);
      
      // Create preview URL for modal display
      const previewUrl = URL.createObjectURL(file);
      setTempImagePreview(previewUrl);
      setShowUploadModal(true);
      
      // Set the file in the input for later use
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files;
      }
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

  // Password change handlers
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value,
    });
    
    // Clear errors when user starts typing
    if (passwordErrors[name]) {
      setPasswordErrors({
        ...passwordErrors,
        [name]: '',
      });
    }
  };

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    return errors;
  };

  const getPasswordStrength = (password) => {
    const errors = validatePassword(password);
    if (password.length === 0) return { strength: 0, label: '', color: '' };
    if (errors.length >= 4) return { strength: 1, label: 'Very Weak', color: 'text-red-500' };
    if (errors.length >= 3) return { strength: 2, label: 'Weak', color: 'text-orange-500' };
    if (errors.length >= 2) return { strength: 3, label: 'Fair', color: 'text-yellow-500' };
    if (errors.length >= 1) return { strength: 4, label: 'Good', color: 'text-blue-500' };
    return { strength: 5, label: 'Strong', color: 'text-green-500' };
  };

  const getRoleDisplayName = (role) => {
    const roleMap = {
      'STAFF': 'Staff Member',
      'SECTION_HEAD': 'Section Head',
      'EDITOR_IN_CHIEF': 'Editor-in-Chief',
      'ADVISER': 'Adviser',
      'SYSTEM_ADMIN': 'System Administrator',
      'READER': 'Reader'
    };
    return roleMap[role] || role;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordErrors({});
    
    const errors = {};
    
    // Validate current password
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    // Validate new password
    const passwordValidationErrors = validatePassword(passwordData.newPassword);
    if (passwordValidationErrors.length > 0) {
      errors.newPassword = passwordValidationErrors[0];
    }
    
    // Validate password confirmation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (passwordData.currentPassword === passwordData.newPassword) {
      errors.newPassword = 'New password must be different from current password';
    }
    
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }
    
    setLoading(true);
    
    try {
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      setPasswordSuccess(true);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setPasswordSuccess(false);
        setShowPasswordChange(false);
      }, 3000);
      
    } catch (error) {
      console.error('Failed to change password:', error);
      if (error.response?.data?.message) {
        setPasswordErrors({ general: error.response.data.message });
      } else {
        setPasswordErrors({ general: 'Failed to change password. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field],
    });
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-loading">
          <div className="profile-spinner"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Success Message */}
      {passwordSuccess && (
        <div className="profile-success-message">
          <CheckCircleIcon className="profile-success-icon" />
          <span>Profile updated successfully!</span>
        </div>
      )}

      <div className="profile-content">
        {/* Profile Header Section */}
        <div className="profile-header-section">
          <div className="profile-header-info">
            <div 
              className={`profile-image-container ${isDragOver ? 'profile-image-drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Profile" 
                  className="profile-image"
                />
              ) : (
                <div className="profile-image-placeholder">
                  <UserCircleIcon className="profile-image-icon" />
                </div>
              )}
              
              <div className="profile-image-overlay">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageUploading}
                  className="profile-image-upload-btn"
                >
                  {imageUploading ? (
                    <>
                      <div className="profile-image-spinner"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <CameraIcon className="profile-image-upload-icon" />
                      Upload
                    </>
                  )}
                </button>
                
                {imagePreview && !imageUploading && (
                  <button
                    onClick={removeImage}
                    className="profile-image-remove-btn"
                  >
                    <XMarkIcon className="profile-image-remove-icon" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="profile-user-info">
              <h1 className="profile-user-name">
                {profile?.firstName} {profile?.lastName}
              </h1>
              <p className="profile-user-email">{profile?.email}</p>
            </div>
          </div>
          
          <div className="profile-header-actions">
            <button
              onClick={() => setEditing(!editing)}
              className="profile-edit-btn"
            >
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="profile-image-input"
        />
        
        {imageError && (
          <div className="profile-error-message">
            <ExclamationTriangleIcon className="profile-error-icon" />
            <span>{imageError}</span>
          </div>
        )}

        {/* Personal Information Section */}
        <div className="profile-form-section">
          <div className="profile-section-header">
            <h2 className="profile-section-title">Personal Information</h2>
            <p className="profile-section-description">Update your personal details</p>
          </div>
          
          {editing ? (
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="profile-form-grid">
                <div className="profile-form-group">
                  <label className="profile-form-label">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="profile-form-input"
                    placeholder="Your First Name"
                    required
                  />
                </div>
                
                <div className="profile-form-group">
                  <label className="profile-form-label">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="profile-form-input"
                    placeholder="Your Last Name"
                    required
                  />
                </div>
                
                <div className="profile-form-group">
                  <label className="profile-form-label">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="profile-form-input"
                    placeholder="Your Username"
                    required
                  />
                </div>
                
                <div className="profile-form-group">
                  <label className="profile-form-label">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="profile-form-input"
                    placeholder="Your Email Address"
                    required
                  />
                </div>
              </div>
              
              <div className="profile-form-actions">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="profile-btn profile-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="profile-btn profile-btn-primary"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-info-display">
              <div className="profile-info-grid">
                <div className="profile-info-item">
                  <label className="profile-info-label">First Name</label>
                  <p className="profile-info-value">{profile?.firstName}</p>
                </div>
                
                <div className="profile-info-item">
                  <label className="profile-info-label">Last Name</label>
                  <p className="profile-info-value">{profile?.lastName}</p>
                </div>
                
                <div className="profile-info-item">
                  <label className="profile-info-label">Username</label>
                  <p className="profile-info-value">@{profile?.username}</p>
                </div>
                
                <div className="profile-info-item">
                  <label className="profile-info-label">Email</label>
                  <p className="profile-info-value">{profile?.email}</p>
                </div>
                
                <div className="profile-info-item">
                  <label className="profile-info-label">Role</label>
                  <p className="profile-info-value profile-info-role">
                    {getRoleDisplayName(profile?.role)}
                  </p>
                </div>
                
                <div className="profile-info-item">
                  <label className="profile-info-label">Member Since</label>
                  <p className="profile-info-value">
                    {new Date(profile?.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Password Change Section */}
        <div className="profile-password-section">
          <div className="profile-section">
            <div className="profile-section-header">
              <h2 className="profile-section-title">Change Password</h2>
              <p className="profile-section-description">Update your password to keep your account secure</p>
            </div>

            {showPasswordChange ? (
              <form onSubmit={handlePasswordSubmit} className="profile-password-form">
                {passwordErrors.general && (
                  <div className="profile-error-message">
                    <ExclamationTriangleIcon className="profile-error-icon" />
                    <span>{passwordErrors.general}</span>
                  </div>
                )}

                <div className="profile-form-group">
                  <label className="profile-form-label">Current Password</label>
                  <div className="profile-form-input-container">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className={`profile-form-input ${passwordErrors.currentPassword ? 'profile-form-input-error' : ''}`}
                      placeholder="Enter current password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="profile-form-input-toggle"
                    >
                      {showPasswords.current ? (
                        <EyeSlashIcon className="profile-form-input-toggle-icon" />
                      ) : (
                        <EyeIcon className="profile-form-input-toggle-icon" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="profile-form-error">{passwordErrors.currentPassword}</p>
                  )}
                </div>

                <div className="profile-form-group">
                  <label className="profile-form-label">New Password</label>
                  <div className="profile-form-input-container">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className={`profile-form-input ${passwordErrors.newPassword ? 'profile-form-input-error' : ''}`}
                      placeholder="Enter new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="profile-form-input-toggle"
                    >
                      {showPasswords.new ? (
                        <EyeSlashIcon className="profile-form-input-toggle-icon" />
                      ) : (
                        <EyeIcon className="profile-form-input-toggle-icon" />
                      )}
                    </button>
                  </div>
                  
                  {passwordData.newPassword && (
                    <div className="profile-password-strength">
                      <div className="profile-password-strength-bar">
                        <div
                          className={`profile-password-strength-fill ${
                            getPasswordStrength(passwordData.newPassword).strength >= 4
                              ? 'profile-password-strength-strong'
                              : getPasswordStrength(passwordData.newPassword).strength >= 3
                              ? 'profile-password-strength-medium'
                              : getPasswordStrength(passwordData.newPassword).strength >= 2
                              ? 'profile-password-strength-weak'
                              : 'profile-password-strength-very-weak'
                          }`}
                          style={{
                            width: `${(getPasswordStrength(passwordData.newPassword).strength / 5) * 100}%`,
                          }}
                        />
                      </div>
                      <span className={`profile-password-strength-label ${getPasswordStrength(passwordData.newPassword).color}`}>
                        {getPasswordStrength(passwordData.newPassword).label}
                      </span>
                    </div>
                  )}
                  
                  {passwordErrors.newPassword && (
                    <p className="profile-form-error">{passwordErrors.newPassword}</p>
                  )}
                </div>

                <div className="profile-form-group">
                  <label className="profile-form-label">Confirm New Password</label>
                  <div className="profile-form-input-container">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className={`profile-form-input ${passwordErrors.confirmPassword ? 'profile-form-input-error' : ''}`}
                      placeholder="Confirm new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="profile-form-input-toggle"
                    >
                      {showPasswords.confirm ? (
                        <EyeSlashIcon className="profile-form-input-toggle-icon" />
                      ) : (
                        <EyeIcon className="profile-form-input-toggle-icon" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="profile-form-error">{passwordErrors.confirmPassword}</p>
                  )}
                </div>

                <div className="profile-password-requirements">
                  <h4 className="profile-password-requirements-title">Password Requirements:</h4>
                  <ul className="profile-password-requirements-list">
                    <li>At least 8 characters long</li>
                    <li>Contains uppercase and lowercase letters</li>
                    <li>Contains at least one number</li>
                    <li>Contains at least one special character</li>
                  </ul>
                </div>

                <div className="profile-form-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordChange(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      });
                      setPasswordErrors({});
                    }}
                    className="profile-btn profile-btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="profile-btn profile-btn-primary"
                  >
                    {loading ? 'Changing Password...' : 'Change Password'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-password-display">
                <div className="profile-password-info">
                  <p>Keep your account secure with a strong password.</p>
                  <p>We recommend changing your password regularly.</p>
                </div>
                <button
                  onClick={() => setShowPasswordChange(true)}
                  className="profile-btn profile-btn-primary"
                >
                  Change Password
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    
    {/* Image Upload Modal */}
    {showUploadModal && (
      <div className="profile-upload-modal-overlay" onClick={cancelImageUpload}>
        <div className="profile-upload-modal" onClick={(e) => e.stopPropagation()}>
          <div className="profile-upload-modal-header">
            <h3 className="profile-upload-modal-title">Upload Profile Picture</h3>
            <button 
              onClick={cancelImageUpload}
              className="profile-upload-modal-close"
            >
              <XMarkIcon className="profile-upload-modal-close-icon" />
            </button>
          </div>
          
          <div className="profile-upload-modal-content">
            <div className="profile-upload-modal-preview">
              {tempImagePreview && (
                <img 
                  src={tempImagePreview} 
                  alt="Preview" 
                  className="profile-upload-modal-image"
                />
              )}
            </div>
            
            <div className="profile-upload-modal-info">
              <p className="profile-upload-modal-text">
                This will replace your current profile picture.
              </p>
              <p className="profile-upload-modal-subtext">
                Supported formats: JPEG, PNG, GIF, WebP (Max 10MB)
              </p>
            </div>
          </div>
          
          <div className="profile-upload-modal-actions">
            <button
              onClick={cancelImageUpload}
              className="profile-btn profile-btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={confirmImageUpload}
              className="profile-btn profile-btn-primary"
            >
              Upload Picture
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default Profile;
