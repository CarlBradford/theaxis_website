import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useAuth } from '../hooks/useAuth';
import { categoriesAPI, usersAPI, articlesAPI } from '../services/apiService';
import { 
  ChevronDownIcon,
  PaperClipIcon,
  EyeIcon,
  XMarkIcon,
  BoldIcon,
  ItalicIcon,
  ListBulletIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import ArticlePreviewModal from '../components/ArticlePreviewModal';
import NotificationModal from '../components/NotificationModal';
import '../styles/createarticle.css';
import '../styles/article-preview.css';

const CreateArticle = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    authors: [], // Will store objects: { id, name }
    category: '',
    tags: [], // Will store tag strings
    publicationDate: '',
    content: '',
    mediaCaption: '',
    featuredImage: ''
  });
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newAuthor, setNewAuthor] = useState('');
  const [newTag, setNewTag] = useState('');
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [errors, setErrors] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [authorError, setAuthorError] = useState(null);
  const [tagError, setTagError] = useState(null);
  const [showAuthorSuggestions, setShowAuthorSuggestions] = useState(false);
  const [authorSuggestions, setAuthorSuggestions] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [showPreview, setShowPreview] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationData, setNotificationData] = useState({ title: '', message: '', type: 'success' });
  const [showPublishModal, setShowPublishModal] = useState(false);
  const contentRef = useRef(null);

  // Notification modal helper functions
  const showNotification = (title, message, type = 'success') => {
    setNotificationData({ title, message, type });
    setShowNotificationModal(true);
  };

  const closeNotification = () => {
    setShowNotificationModal(false);
    setNotificationData({ title: '', message: '', type: 'success' });
  };

  // Auto-fill current user as first author when component loads
  useEffect(() => {
    if (user && user.firstName && user.lastName) {
      const fullName = `${user.firstName} ${user.lastName}`;
      setFormData(prev => ({
        ...prev,
        authors: [{ id: user.id, name: fullName }]
      }));
    }
  }, [user]);

  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await categoriesAPI.getCategories();
        const categoriesData = response.data?.items || [];
        setCategories(categoriesData);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch available users for author selection
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const response = await usersAPI.getUsers();
        console.log('Users API response:', response);
        console.log('Response data:', response.data);
        console.log('Response data type:', typeof response.data);
        
        // Handle different response structures
        let users = [];
        if (Array.isArray(response.data)) {
          users = response.data;
        } else if (response.data && Array.isArray(response.data.users)) {
          users = response.data.users;
        } else if (response.data && Array.isArray(response.data.items)) {
          users = response.data.items;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          users = response.data.data;
        } else {
          console.error('Unexpected response structure:', response.data);
          users = [];
        }
        
        console.log('Processed users:', users);
        console.log('Users count:', users.length);
        setAvailableUsers(users);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        console.error('Error details:', error.response?.data || error.message);
        setAvailableUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Validation functions
  const validateForm = () => {
    const newErrors = {};
    
    // Get the desired article status from form data attribute
    const form = document.querySelector('.create-article-form');
    const articleStatus = form?.dataset?.articleStatus || 'DRAFT';
    const isPublishing = articleStatus === 'PUBLISHED';
    
    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters long';
    } else if (formData.title.trim().length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }
    
    // Content validation
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    } else if (formData.content.trim().length < 10) {
      newErrors.content = 'Content must be at least 10 characters long';
    }
    
    // Publication date validation - required only when publishing
    if (isPublishing) {
      if (!formData.publicationDate) {
        newErrors.publicationDate = 'Publication date is required when publishing';
      }
    }
    
    // Media caption validation
    if (formData.mediaCaption && formData.mediaCaption.length > 500) {
      newErrors.mediaCaption = 'Media caption must be less than 500 characters';
    }
    
    // Authors validation
    if (formData.authors.length === 0) {
      newErrors.authors = 'At least one author is required';
    }
    
    // Category validation
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    // Tags validation
    if (formData.tags.length === 0) {
      newErrors.tags = 'At least one tag is required';
    } else if (formData.tags.length > 10) {
      newErrors.tags = 'Maximum 10 tags allowed';
    }
    
    // Media validation (optional but if provided, should be valid)
    if (uploadError) {
      newErrors.media = uploadError;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateFile = (file) => {
    const maxSize = 100 * 1024 * 1024; // 100MB
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/ogg',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!file) {
      return 'No file selected';
    }
    
    if (file.size > maxSize) {
      return 'File size must be less than 100MB';
    }
    
    if (!allowedTypes.includes(file.type)) {
      return 'File type not supported. Please upload images, videos, PDFs, or Word documents';
    }
    
    return null;
  };

  const addAuthor = () => {
    if (newAuthor.trim()) {
      console.log('Adding author:', newAuthor.trim());
      console.log('Available users:', availableUsers);
      console.log('Available users type:', typeof availableUsers);
      console.log('Available users is array:', Array.isArray(availableUsers));
      
      // Ensure availableUsers is an array
      if (!Array.isArray(availableUsers)) {
        console.error('availableUsers is not an array:', availableUsers);
        showNotification('Error', 'Unable to load users. Please refresh the page and try again.', 'error');
        return;
      }
      
      // Find user by name (firstName + lastName or username)
      const foundUser = availableUsers.find(user => {
        const fullName = `${user.firstName} ${user.lastName}`;
        const searchTerm = newAuthor.trim().toLowerCase();
        const nameMatch = fullName.toLowerCase().includes(searchTerm);
        const usernameMatch = user.username.toLowerCase().includes(searchTerm);
        
        console.log(`Checking user: ${fullName} (${user.username}) - Name match: ${nameMatch}, Username match: ${usernameMatch}`);
        
        return nameMatch || usernameMatch;
      });

      console.log('Found user:', foundUser);

      if (foundUser) {
        const authorObject = { id: foundUser.id, name: `${foundUser.firstName} ${foundUser.lastName}` };
        
        // Check if author already exists
        const authorExists = formData.authors.some(author => author.id === foundUser.id);
        
        if (!authorExists) {
          setFormData(prev => ({
            ...prev,
            authors: [...prev.authors, authorObject]
          }));
          setNewAuthor('');
          
          // Clear authors error when author is added
          if (errors.authors) {
            setErrors(prev => ({
              ...prev,
              authors: null
            }));
          }
        } else {
          setAuthorError('This author is already added');
          setTimeout(() => setAuthorError(null), 3000);
        }
      } else {
        setAuthorError('User not found. Please check the name and try again.');
        setTimeout(() => setAuthorError(null), 3000);
      }
    }
  };

  const removeAuthor = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      authors: prev.authors.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleNewAuthorKeyPress = (e) => {
    console.log('Author key press:', e.key);
    
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showAuthorSuggestions && selectedSuggestionIndex >= 0) {
        // Select the highlighted suggestion
        selectAuthorSuggestion(authorSuggestions[selectedSuggestionIndex]);
      } else {
        console.log('Enter pressed, calling addAuthor');
        addAuthor();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (showAuthorSuggestions) {
        setSelectedSuggestionIndex(prev => 
          prev < authorSuggestions.length - 1 ? prev + 1 : 0
        );
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (showAuthorSuggestions) {
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : authorSuggestions.length - 1
        );
      }
    } else if (e.key === 'Escape') {
      setShowAuthorSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  const handleNewAuthorBlur = () => {
    console.log('Author input blur, newAuthor:', newAuthor);
    if (newAuthor.trim()) {
      console.log('Calling addAuthor from blur');
      addAuthor();
    }
    // Hide suggestions when input loses focus
    setTimeout(() => setShowAuthorSuggestions(false), 150);
  };

  // Generate author suggestions based on input
  const generateAuthorSuggestions = (input) => {
    if (!Array.isArray(availableUsers)) {
      setAuthorSuggestions([]);
      setShowAuthorSuggestions(false);
      return;
    }

    const searchTerm = input.trim().toLowerCase();
    const suggestions = availableUsers
      .filter(user => {
        // If no input, show all users (up to 5)
        if (!input.trim()) {
          return true;
        }
        
        const fullName = `${user.firstName} ${user.lastName}`;
        const firstName = user.firstName.toLowerCase();
        const lastName = user.lastName.toLowerCase();
        const username = user.username.toLowerCase();
        
        return (
          fullName.toLowerCase().includes(searchTerm) ||
          firstName.includes(searchTerm) ||
          lastName.includes(searchTerm) ||
          username.includes(searchTerm)
        );
      })
      .slice(0, 5) // Limit to 5 suggestions
      .map(user => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName
      }));

    setAuthorSuggestions(suggestions);
    setShowAuthorSuggestions(suggestions.length > 0);
    setSelectedSuggestionIndex(-1);
  };

  // Handle suggestion selection
  const selectAuthorSuggestion = (suggestion) => {
    const authorObject = { id: suggestion.id, name: suggestion.name };
    
    // Check if author already exists
    const authorExists = formData.authors.some(author => author.id === suggestion.id);
    
    if (!authorExists) {
      setFormData(prev => ({
        ...prev,
        authors: [...prev.authors, authorObject]
      }));
      setNewAuthor('');
      setShowAuthorSuggestions(false);
      setAuthorSuggestions([]);
      
      // Clear authors error when author is added
      if (errors.authors) {
        setErrors(prev => ({
          ...prev,
          authors: null
        }));
      }
    } else {
      setAuthorError('This author is already added');
      setTimeout(() => setAuthorError(null), 3000);
    }
  };

  const addTag = () => {
    if (newTag.trim()) {
      const tagText = newTag.trim();
      
      // Check if tag already exists (case insensitive)
      const tagExists = formData.tags.some(tag => tag.toLowerCase() === tagText.toLowerCase());
      
      if (!tagExists) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tagText]
        }));
        setNewTag('');
        
        // Clear tags error when tag is added
        if (errors.tags) {
          setErrors(prev => ({
            ...prev,
            tags: null
          }));
        }
      } else {
        setTagError('This tag is already added');
        setTimeout(() => setTagError(null), 3000);
      }
    }
  };

  const removeTag = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleNewTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleNewTagBlur = () => {
    if (newTag.trim()) {
      addTag();
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        // Try different selectors for different field types
        let errorElement = document.querySelector(`[name="${firstErrorField}"]`);
        
        // If not found, try specific selectors for complex fields
        if (!errorElement) {
          if (firstErrorField === 'authors') {
            errorElement = document.querySelector('.create-article-authors-container');
          } else if (firstErrorField === 'tags') {
            errorElement = document.querySelector('.create-article-tags-container');
          } else if (firstErrorField === 'content') {
            errorElement = document.querySelector('.create-article-rich-text-editor');
          } else if (firstErrorField === 'media') {
            errorElement = document.querySelector('.create-article-media-input-container');
          }
        }
        
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Try to focus if it's a focusable element
          if (errorElement.focus && typeof errorElement.focus === 'function') {
            errorElement.focus();
          }
        }
      }
      return;
    }
    
    setIsSubmitting(true);
    setErrors({}); // Clear any existing errors

    try {

      // Get the desired status from the form
      const form = e.target;
      const articleStatus = form.dataset.articleStatus || 'DRAFT';

      // Prepare data for submission
      const articleData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        featuredImage: formData.featuredImage || '',
        mediaCaption: formData.mediaCaption?.trim() || '',
        ...(formData.publicationDate && { publicationDate: formData.publicationDate }),
        status: articleStatus, // Include the status
        // Send author IDs (excluding the current user who is the primary author)
        authors: formData.authors.filter(author => author.id !== user.id).map(author => author.id),
        // Process tags - convert names to slugs
        tags: formData.tags.length > 0 ? formData.tags.map(tag => 
          tag.toLowerCase()
             .trim()
             .replace(/[^a-z0-9\s-]/g, '')
             .replace(/\s+/g, '-')
             .replace(/-+/g, '-')
        ) : [],
        // Process categories - convert names to slugs
        categories: formData.category ? [categories.find(cat => cat.name === formData.category)?.slug].filter(Boolean) : []
      };

      console.log('Submitting article data:', articleData);
      
      // Create the article via API
      const response = await articlesAPI.createArticle(articleData);
      console.log('Article created successfully:', response);
      
      // Show success message based on status
      let successMessage = '';
      switch (articleStatus) {
        case 'DRAFT':
          successMessage = `Article "${formData.title}" saved as draft!`;
          break;
        case 'IN_REVIEW':
          successMessage = `Article "${formData.title}" submitted for review!`;
          break;
        case 'PUBLISHED':
          successMessage = `Article "${formData.title}" published successfully!`;
          break;
        default:
          successMessage = `Article "${formData.title}" created successfully!`;
      }
      
      // Show success toast
      showNotification('Success', successMessage, 'success');
      
      // Navigate back to my content after a short delay to show the toast
      setTimeout(() => {
        navigate('/content/mycontent');
      }, 1500);
      
    } catch (error) {
      console.error('Failed to create article:', error);
      
      // Handle different types of errors
      let errorMessage = 'Failed to create article. Please try again.';
      let fieldErrors = {};
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        
        // If it's a validation error, show the specific validation errors
        if (error.response.data.details && Array.isArray(error.response.data.details)) {
          const validationErrors = error.response.data.details.map(err => err.msg || err.message).join(', ');
          errorMessage = `Validation failed: ${validationErrors}`;
          
          // Map server validation errors to form fields
          error.response.data.details.forEach(err => {
            if (err.path) {
              fieldErrors[err.path] = err.msg || err.message;
            }
          });
        }
      } else if (error.response?.status === 401) {
        errorMessage = 'You are not authorized to create articles. Please log in again.';
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid data provided. Please check your input and try again.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      }
      
      // Set field-specific errors
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
      }
      
      // Show error message
      // Show error toast
      showNotification('Error', errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleContentChange = (e) => {
    if (contentRef.current) {
      setFormData(prev => ({
        ...prev,
        content: contentRef.current.innerHTML
      }));
      
      // Clear content error when user starts typing
      if (errors.content) {
        setErrors(prev => ({
          ...prev,
          content: null
        }));
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    
    // Get plain text from clipboard
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    
    // Insert plain text without formatting
    document.execCommand('insertText', false, text);
    
    // Trigger content change
    handleContentChange();
  };

  const executeCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    contentRef.current.focus();
    handleContentChange();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file before upload
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      setUploadedFile(null);
      return;
    }
    
    setUploadedFile(file);
    setIsUploading(true);
    setUploadError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
      console.log('Auth token:', localStorage.getItem('token') ? 'Present' : 'Missing');
      
      // Upload file to media endpoint
      const uploadResponse = await fetch('http://localhost:3001/api/media/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      console.log('Upload response status:', uploadResponse.status);
      
      if (uploadResponse.ok) {
        const uploadData = await uploadResponse.json();
        console.log('File uploaded successfully:', uploadData);
        // Store the file URL for later use in article creation
        const imageUrl = uploadData.data.url || uploadData.data.path;
        const fullImageUrl = imageUrl.startsWith('http') 
          ? imageUrl 
          : `http://localhost:3001${imageUrl}`;
        
        setFormData(prev => ({
          ...prev,
          featuredImage: fullImageUrl
        }));
        setUploadError(null);
        
        // Clear media validation error
        if (errors.media) {
          setErrors(prev => ({
            ...prev,
            media: null
          }));
        }
      } else {
        const errorData = await uploadResponse.json().catch(() => ({}));
        console.error('File upload failed:', uploadResponse.status, errorData);
        
        let errorMessage = 'File upload failed';
        if (uploadResponse.status === 413) {
          errorMessage = 'File too large. Please choose a smaller file.';
        } else if (uploadResponse.status === 415) {
          errorMessage = 'File type not supported. Please choose a different file.';
        } else if (uploadResponse.status === 401) {
          errorMessage = 'Authentication required. Please log in again.';
        } else if (uploadResponse.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
        
        setUploadError(errorMessage);
        setUploadedFile(null);
      }
    } catch (error) {
      console.error('File upload error:', error);
      
      let errorMessage = 'Failed to upload file. Please try again.';
      if (error.name === 'NetworkError' || !navigator.onLine) {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      setUploadError(errorMessage);
      setUploadedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    
    // Validate file before upload
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      setUploadedFile(null);
      return;
    }
    
    setUploadedFile(file);
    setIsUploading(true);
    setUploadError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload file to media endpoint
      const uploadResponse = await fetch('http://localhost:3001/api/media/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      if (uploadResponse.ok) {
        const uploadData = await uploadResponse.json();
        console.log('File uploaded successfully:', uploadData);
        // Store the file URL for later use in article creation
        const imageUrl = uploadData.data.url || uploadData.data.path;
        const fullImageUrl = imageUrl.startsWith('http') 
          ? imageUrl 
          : `http://localhost:3001${imageUrl}`;
        
        setFormData(prev => ({
          ...prev,
          featuredImage: fullImageUrl
        }));
        setUploadError(null);
        
        // Clear media validation error
        if (errors.media) {
          setErrors(prev => ({
            ...prev,
            media: null
          }));
        }
      } else {
        const errorData = await uploadResponse.json().catch(() => ({}));
        console.error('File upload failed:', uploadResponse.status, errorData);
        
        let errorMessage = 'File upload failed';
        if (uploadResponse.status === 413) {
          errorMessage = 'File too large. Please choose a smaller file.';
        } else if (uploadResponse.status === 415) {
          errorMessage = 'File type not supported. Please choose a different file.';
        } else if (uploadResponse.status === 401) {
          errorMessage = 'Authentication required. Please log in again.';
        } else if (uploadResponse.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
        
        setUploadError(errorMessage);
        setUploadedFile(null);
      }
    } catch (error) {
      console.error('File upload error:', error);
      
      let errorMessage = 'Failed to upload file. Please try again.';
      if (error.name === 'NetworkError' || !navigator.onLine) {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      setUploadError(errorMessage);
      setUploadedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setUploadError(null);
    setFormData(prev => ({
      ...prev,
      featuredImage: ''
    }));
    
    // Clear media validation error
    if (errors.media) {
      setErrors(prev => ({
        ...prev,
        media: null
      }));
    }
  };

  const handleSave = async (status = 'DRAFT') => {
    // Trigger form submission with specific status
    const form = document.querySelector('.create-article-form');
    if (form) {
      // Store the desired status in a data attribute
      form.dataset.articleStatus = status;
      form.requestSubmit();
    }
  };

  const handleSaveAsDraft = () => {
    handleSave('DRAFT');
  };

  const handleSubmitToSectionHead = () => {
    handleSave('IN_REVIEW');
  };

  const handleSendToEIC = () => {
    handleSave('IN_REVIEW');
  };

  const handlePublish = () => {
    setShowPublishModal(true);
  };

  const confirmPublish = () => {
    setShowPublishModal(false);
    handleSave('PUBLISHED');
  };

  const cancelPublish = () => {
    setShowPublishModal(false);
  };

  const handleCancel = () => {
    navigate('/content/mycontent');
  };

  const handlePreview = () => {
    // Debug: Log the current form data to see what's in featuredImage
    console.log('Preview formData:', formData);
    console.log('Featured image URL:', formData.featuredImage);
    console.log('Media caption:', formData.mediaCaption);
    
    // Show the preview modal with current form data
    setShowPreview(true);
  };

  return (
    <div className="create-article-container">
      <div className="create-article-content">
        {/* Header */}
        <div className="create-article-header">
          <h1 className="create-article-title">Create Content</h1>
          <div className="create-article-header-buttons">
            <button
              type="button"
              onClick={handlePreview}
              className="create-article-preview-btn"
            >
              <EyeIcon className="create-article-preview-icon" />
              Preview
            </button>
            {/* Role-based buttons */}
            {user?.role === 'STAFF' && (
              <>
                <button
                  type="button"
                  onClick={handleSaveAsDraft}
                  disabled={isSubmitting}
                  className="create-article-save-btn"
                >
                  {isSubmitting ? 'Saving...' : 'Save as Draft'}
                </button>
                <button
                  type="button"
                  onClick={handleSubmitToSectionHead}
                  disabled={isSubmitting}
                  className="create-article-submit-btn"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit to Section Head'}
                </button>
              </>
            )}
            
            {user?.role === 'SECTION_HEAD' && (
              <>
                <button
                  type="button"
                  onClick={handleSaveAsDraft}
                  disabled={isSubmitting}
                  className="create-article-save-btn"
                >
                  {isSubmitting ? 'Saving...' : 'Save as Draft'}
                </button>
                <button
                  type="button"
                  onClick={handleSendToEIC}
                  disabled={isSubmitting}
                  className="create-article-submit-btn"
                >
                  {isSubmitting ? 'Sending...' : 'Send to EIC'}
                </button>
              </>
            )}
            
            {user?.role === 'EDITOR_IN_CHIEF' && (
              <>
                <button
                  type="button"
                  onClick={handleSaveAsDraft}
                  disabled={isSubmitting}
                  className="create-article-save-btn"
                >
                  {isSubmitting ? 'Saving...' : 'Save as Draft'}
                </button>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isSubmitting}
                  className="create-article-publish-btn"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish'}
                </button>
              </>
            )}
            
            {user?.role === 'SYSTEM_ADMIN' && (
              <>
                <button
                  type="button"
                  onClick={handleSaveAsDraft}
                  disabled={isSubmitting}
                  className="create-article-save-btn"
                >
                  {isSubmitting ? 'Saving...' : 'Save as Draft'}
                </button>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isSubmitting}
                  className="create-article-publish-btn"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish'}
                </button>
              </>
            )}
            
            {/* Fallback for other roles */}
            {!['STAFF', 'SECTION_HEAD', 'EDITOR_IN_CHIEF', 'SYSTEM_ADMIN'].includes(user?.role) && (
              <button
                type="button"
                onClick={handleSaveAsDraft}
                disabled={isSubmitting}
                className="create-article-save-btn"
              >
                {isSubmitting ? 'Saving...' : 'Save as Draft'}
              </button>
            )}
            <button
              type="button"
              onClick={handleCancel}
              className="create-article-cancel-btn"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Form */}
        <form className="create-article-form" onSubmit={handleSubmit}>
          {/* Two Column Layout */}
          <div className="create-article-section">
            <div className="create-article-two-columns">
              {/* Column 1 - Main Content */}
              <div className="create-article-main-column">
                <div className="create-article-field">
                  <label className="create-article-label">Title:</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={`create-article-input ${errors.title ? 'error' : ''}`}
                    placeholder="Enter article title"
                  />
                  {errors.title && (
                    <div className="create-article-error">{errors.title}</div>
                  )}
                </div>

                <div className="create-article-author-date-row">
                  <div className="create-article-field">
                    <label className="create-article-label">Author/s:</label>
                    <div className={`create-article-authors-container ${errors.authors ? 'error' : ''}`}>
                      {/* Display existing authors */}
                      {formData.authors.map((author, index) => (
                        <div key={author.id} className="create-article-author-tag">
                          <span className="create-article-author-name">{author.name}</span>
                          <button
                            type="button"
                            onClick={() => removeAuthor(index)}
                            className="create-article-author-remove"
                            title="Remove author"
                          >
                            <XMarkIcon className="create-article-author-remove-icon" />
                          </button>
                        </div>
                      ))}
                      {/* Add new author input */}
                      <div className="create-article-add-author">
                        <input
                          type="text"
                          value={newAuthor}
                          onChange={(e) => {
                            console.log('Author input change:', e.target.value);
                            setNewAuthor(e.target.value);
                            // Clear author error when user starts typing
                            if (authorError) {
                              setAuthorError(null);
                            }
                            // Generate suggestions as user types
                            generateAuthorSuggestions(e.target.value);
                          }}
                          onFocus={() => {
                            // Show suggestions when user focuses on the input
                            if (availableUsers && Array.isArray(availableUsers)) {
                              generateAuthorSuggestions(newAuthor);
                            }
                          }}
                          onKeyPress={handleNewAuthorKeyPress}
                          onBlur={handleNewAuthorBlur}
                          placeholder="Add author..."
                        />
                      </div>
                    </div>
                    
                    {/* Author Suggestions Dropdown */}
                    {showAuthorSuggestions && authorSuggestions.length > 0 && (
                      <div className="create-article-author-suggestions">
                        {authorSuggestions.map((suggestion, index) => (
                          <div
                            key={suggestion.id}
                            className={`create-article-author-suggestion ${
                              index === selectedSuggestionIndex ? 'selected' : ''
                            }`}
                            onClick={() => selectAuthorSuggestion(suggestion)}
                          >
                            <div className="create-article-author-suggestion-name">
                              {suggestion.name}
                            </div>
                            <div className="create-article-author-suggestion-username">
                              @{suggestion.username}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {errors.authors && (
                      <div className="create-article-error">{errors.authors}</div>
                    )}
                    {authorError && (
                      <div className="create-article-error create-article-error-dismissible">
                        {authorError}
                        <button
                          type="button"
                          onClick={() => setAuthorError(null)}
                          className="create-article-error-close"
                          title="Dismiss"
                        >
                          <XMarkIcon className="create-article-error-close-icon" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="create-article-field">
                    <label className="create-article-label">Publication Date:</label>
                    <input
                      type="date"
                      name="publicationDate"
                      value={formData.publicationDate}
                      onChange={handleInputChange}
                      className={`create-article-input ${errors.publicationDate ? 'error' : ''}`}
                    />
                    {errors.publicationDate && (
                      <div className="create-article-error">{errors.publicationDate}</div>
                    )}
                  </div>
                </div>

                <div className="create-article-field">
                  <label className="create-article-label">Content:</label>
                  <div className={`create-article-rich-text-editor ${errors.content ? 'error' : ''}`}>
                    <div className="create-article-editor-toolbar">
                      <button
                        type="button"
                        onClick={() => executeCommand('bold')}
                        className="create-article-editor-btn"
                        title="Bold"
                      >
                        <BoldIcon className="create-article-editor-icon" />
                      </button>
                      <button
                        type="button"
                        onClick={() => executeCommand('italic')}
                        className="create-article-editor-btn"
                        title="Italic"
                      >
                        <ItalicIcon className="create-article-editor-icon" />
                      </button>
                      <button
                        type="button"
                        onClick={() => executeCommand('insertUnorderedList')}
                        className="create-article-editor-btn"
                        title="Bullet List"
                      >
                        <ListBulletIcon className="create-article-editor-icon" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const url = prompt('Enter URL:');
                          if (url) executeCommand('createLink', url);
                        }}
                        className="create-article-editor-btn"
                        title="Insert Link"
                      >
                        <LinkIcon className="create-article-editor-icon" />
                      </button>
                    </div>
                    <div
                      ref={contentRef}
                      contentEditable
                      className="create-article-editor-content"
                      onInput={handleContentChange}
                      onPaste={handlePaste}
                      suppressContentEditableWarning={true}
                      data-placeholder="Write your article content here..."
                    />
                  </div>
                  {errors.content && (
                    <div className="create-article-error">{errors.content}</div>
                  )}
                </div>

                <div className="create-article-media-row">
                  <label className="create-article-media-label">Upload media</label>
                  <div className={`create-article-media-input-container ${(uploadError || errors.media) ? 'error' : ''}`}>
                    <input
                      type="text"
                      className={`create-article-media-input ${(uploadError || errors.media) ? 'error' : ''}`}
                      placeholder={isUploading ? "Uploading..." : "Upload Media"}
                      readOnly
                      value={uploadedFile ? uploadedFile.name : ''}
                      onClick={() => !isUploading && document.getElementById('file-input').click()}
                    />
                    {uploadedFile && !isUploading && (
                      <button
                        type="button"
                        onClick={removeFile}
                        className="create-article-file-remove"
                        title="Remove file"
                      >
                        <XMarkIcon className="create-article-remove-icon" />
                      </button>
                    )}
                    {isUploading && (
                      <div className="create-article-upload-spinner"></div>
                    )}
                  </div>
                  <input
                    id="file-input"
                    type="file"
                    onChange={handleFileUpload}
                    className="create-article-file-input"
                    accept="image/*,video/*,.pdf,.doc,.docx"
                    disabled={isUploading}
                  />
                  {(uploadError || errors.media) && (
                    <div className="create-article-error">{uploadError || errors.media}</div>
                  )}
                </div>

                <div className="create-article-media-row">
                  <label className="create-article-media-label">Media Caption</label>
                  <input
                    type="text"
                    name="mediaCaption"
                    value={formData.mediaCaption}
                    onChange={handleInputChange}
                    className={`create-article-media-input ${errors.mediaCaption ? 'error' : ''}`}
                    placeholder="Enter media caption"
                  />
                  {errors.mediaCaption && (
                    <div className="create-article-error">{errors.mediaCaption}</div>
                  )}
                </div>
              </div>

              {/* Column 2 - Category and Tags */}
              <div className="create-article-side-column">
                <div className="create-article-field">
                  <label className="create-article-label">Category:</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={`create-article-input ${errors.category ? 'error' : ''}`}
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <div className="create-article-error">{errors.category}</div>
                  )}
                </div>

                <div className="create-article-field">
                  <label className="create-article-label">Tags</label>
                  <div className={`create-article-tags-container ${errors.tags ? 'error' : ''}`}>
                    {/* Display existing tags */}
                    {formData.tags.map((tag, index) => (
                      <div key={index} className="create-article-tag">
                        <span className="create-article-tag-name">{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeTag(index)}
                          className="create-article-tag-remove"
                          title="Remove tag"
                        >
                          <XMarkIcon className="create-article-tag-remove-icon" />
                        </button>
                      </div>
                    ))}
                    {/* Add new tag input */}
                    <div className="create-article-add-tag">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => {
                          setNewTag(e.target.value);
                          // Clear tag error when user starts typing
                          if (tagError) {
                            setTagError(null);
                          }
                        }}
                        onKeyPress={handleNewTagKeyPress}
                        onBlur={handleNewTagBlur}
                        placeholder="Add tag..."
                      />
                    </div>
                  </div>
                  {errors.tags && (
                    <div className="create-article-error">{errors.tags}</div>
                  )}
                  {tagError && (
                    <div className="create-article-error create-article-error-dismissible">
                      {tagError}
                      <button
                        type="button"
                        onClick={() => setTagError(null)}
                        className="create-article-error-close"
                        title="Dismiss"
                      >
                        <XMarkIcon className="create-article-error-close-icon" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Preview Modal */}
      <ArticlePreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        articleData={formData}
      />

      {/* Notification Modal */}
      {showNotificationModal && (
        <NotificationModal
          key={`notification-${notificationData.type}-${Date.now()}`}
          isOpen={showNotificationModal}
          onClose={closeNotification}
          title={notificationData.title}
          message={notificationData.message}
          type={notificationData.type}
          duration={3000}
        />
      )}

      {/* Publish Modal */}
      {showPublishModal && (
        <div className="simple-publish-modal-overlay">
          <div className="simple-publish-modal">
            <div className="simple-publish-modal-header">
              <h3 className="simple-publish-modal-title">Publish Article</h3>
              <button
                onClick={cancelPublish}
                className="simple-publish-modal-close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="simple-publish-modal-content">
              <p className="simple-publish-warning-text">
                Are you sure you want to publish <strong>"{formData.title}"</strong>?
              </p>
              <p className="simple-publish-details">
                Category: {formData.category || 'Uncategorized'}
              </p>
              <p className="simple-publish-note">
                This will make the article live and visible to readers. This action cannot be undone.
              </p>
            </div>
            
            <div className="simple-publish-modal-buttons">
              <button
                onClick={cancelPublish}
                className="simple-publish-modal-button cancel"
              >
                Cancel
              </button>
              <button
                onClick={confirmPublish}
                className="simple-publish-modal-button publish"
              >
                Publish Article
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateArticle;
