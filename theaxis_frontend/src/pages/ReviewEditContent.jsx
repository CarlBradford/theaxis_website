import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useAuth } from '../hooks/useAuth';
import { categoriesAPI, usersAPI, articlesAPI } from '../services/apiService';
import { reviewQueueService } from '../services/reviewQueueService';
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
import SuccessModal from '../components/SuccessModal';
import '../styles/createarticle.css';
import '../styles/article-preview.css';

const ReviewEditContent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
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
  const [isLoading, setIsLoading] = useState(true);
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
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationData, setNotificationData] = useState({ title: '', message: '', type: 'success' });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [articleStatus, setArticleStatus] = useState('');
  const [articleDataLoaded, setArticleDataLoaded] = useState(false);
  const contentRef = useRef(null);

  // Debug formData changes
  useEffect(() => {
    console.log('FormData changed:', formData);
    console.log('Publication date in formData:', formData.publicationDate);
  }, [formData]);

  // Notification modal helper functions
  const showNotification = (title, message, type = 'success') => {
    setNotificationData({ title, message, type });
    setShowNotificationModal(true);
  };

  const closeNotification = () => {
    setShowNotificationModal(false);
    setNotificationData({ title: '', message: '', type: 'success' });
  };

  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await categoriesAPI.getCategories();
        const categoriesData = response.data?.items || response.items || [];
        setCategories(categoriesData);
        console.log('Categories loaded successfully:', categoriesData);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        console.error('Error details:', error.response?.data || error.message);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Load article data after categories are loaded (only once)
  useEffect(() => {
    if (id && categories.length > 0 && !articleDataLoaded) {
      console.log('Loading article data after categories are loaded');
      loadArticleData();
      setArticleDataLoaded(true);
    }
  }, [id, categories.length, articleDataLoaded]); // Only depend on categories.length, not the entire array

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

  const loadArticleData = async () => {
    // Prevent loading if data is already loaded or if form has data
    if (articleDataLoaded || formData.title) {
      console.log('Article data already loaded or form has data, skipping load');
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await articlesAPI.getArticle(id);
      const article = response.data;
      
      console.log('Fetched article data:', article);
      console.log('Article content:', article.content);
      console.log('Article media caption:', article.mediaCaption);
      console.log('Article featured image:', article.featuredImage);
      console.log('Article publication date:', article.publicationDate);
      console.log('Article categories:', article.categories);
      console.log('Article categories type:', typeof article.categories);
      console.log('Article categories length:', article.categories?.length);
      console.log('First category:', article.categories?.[0]);
      console.log('Available categories from API:', categories);
      console.log('Article tags:', article.tags);
      
      // Transform article data to match form structure
      const authors = [];
      
      // Add main author
      if (article.author) {
        authors.push({
          id: article.author.id,
          name: `${article.author.firstName} ${article.author.lastName}`.trim() || article.author.username
        });
      }
      
      // Add additional authors
      if (article.articleAuthors && article.articleAuthors.length > 0) {
        article.articleAuthors.forEach(author => {
          const authorName = `${author.user.firstName} ${author.user.lastName}`.trim() || author.user.username;
          if (!authors.some(a => a.id === author.user.id)) {
            authors.push({
              id: author.user.id,
              name: authorName
            });
          }
        });
      }

      // Format publication date properly
      let formattedDate = '';
      console.log('Raw publication date from API:', article.publicationDate);
      console.log('Publication date type:', typeof article.publicationDate);
      if (article.publicationDate) {
        const date = new Date(article.publicationDate);
        console.log('Parsed date object:', date);
        console.log('Date is valid:', !isNaN(date.getTime()));
        formattedDate = date.toISOString().split('T')[0];
        console.log('Formatted publication date:', formattedDate);
      } else {
        console.log('No publication date found in article data');
      }

      // Handle category properly
      let categoryName = '';
      if (article.categories && article.categories.length > 0) {
        const articleCategory = article.categories[0];
        console.log('Article category object:', articleCategory);
        
        // If the category is an object with name property
        if (typeof articleCategory === 'object' && articleCategory.name) {
          categoryName = articleCategory.name;
        }
        // If the category is an object with id, find the name from available categories
        else if (typeof articleCategory === 'object' && articleCategory.id) {
          const foundCategory = categories.find(cat => cat.id === articleCategory.id);
          categoryName = foundCategory ? foundCategory.name : '';
          console.log('Found category by ID:', foundCategory);
        }
        // If the category is already a string (name)
        else if (typeof articleCategory === 'string') {
          categoryName = articleCategory;
        }
      }
      
      console.log('Final category name:', categoryName);

      setFormData({
        title: article.title || '',
        authors: authors,
        category: categoryName,
        tags: article.tags ? article.tags.map(tag => tag.name) : [],
        publicationDate: formattedDate,
        content: article.content || '',
        mediaCaption: article.mediaCaption || '',
        featuredImage: article.featuredImage || ''
      });

      // Store the article status
      setArticleStatus(article.status || '');

      console.log('Set form data:', {
        title: article.title || '',
        authors: authors,
        category: categoryName,
        tags: article.tags ? article.tags.map(tag => tag.name) : [],
        publicationDate: formattedDate,
        content: article.content || '',
        mediaCaption: article.mediaCaption || '',
        featuredImage: article.featuredImage || ''
      });
      console.log('Form data publicationDate specifically:', formattedDate);

      // Set uploaded file state if there's an existing featured image
      if (article.featuredImage) {
        // Create a mock file object for existing images
        const mockFile = {
          name: article.featuredImage.split('/').pop() || 'existing-image.jpg',
          size: 0,
          type: 'image/jpeg'
        };
        setUploadedFile(mockFile);
        console.log('Set uploaded file:', mockFile);
      }

      // Set content in rich text editor after form data is set
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.innerHTML = article.content || '';
          console.log('Set content in editor:', article.content);
        }
      }, 100);
    } catch (error) {
      console.error('Failed to load article:', error);
      showNotification('Error', 'Failed to load article data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log('Input change:', name, value);
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
  const validateForm = (isDraft = false) => {
    const newErrors = {};
    
    // Get the desired status from the form
    const form = document.querySelector('.create-article-form');
    const articleStatus = form?.dataset.articleStatus || 'DRAFT';
    const isDraftSave = isDraft || articleStatus === 'DRAFT';
    
    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters long';
    } else if (formData.title.trim().length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }
    
    // Content validation - more lenient for drafts
    if (!formData.content.trim()) {
      if (!isDraftSave) {
        newErrors.content = 'Content is required';
      }
    } else if (formData.content.trim().length < 10) {
      if (!isDraftSave) {
        newErrors.content = 'Content must be at least 10 characters long';
      }
    }
    
    // Publication date validation - required only when publishing
    const isPublishing = articleStatus === 'PUBLISHED';
    if (isPublishing) {
      if (!formData.publicationDate) {
        newErrors.publicationDate = 'Publication date is required when publishing';
      }
    }
    
    // Media caption validation
    if (formData.mediaCaption && formData.mediaCaption.length > 500) {
      newErrors.mediaCaption = 'Media caption must be less than 500 characters';
    }
    
    // Authors validation - more lenient for drafts
    if (formData.authors.length === 0) {
      if (!isDraftSave) {
        newErrors.authors = 'At least one author is required';
      }
    }
    
    // Category validation - more lenient for drafts
    if (!formData.category) {
      if (!isDraftSave) {
        newErrors.category = 'Category is required';
      }
    }
    
    // Tags validation - more lenient for drafts
    if (formData.tags.length === 0) {
      if (!isDraftSave) {
        newErrors.tags = 'At least one tag is required';
      }
    } else if (formData.tags.length > 10) {
      newErrors.tags = 'Maximum 10 tags allowed';
    }
    
    // Media validation (optional but if provided, should be valid)
    if (uploadError) {
      newErrors.media = uploadError;
    }
    
    setErrors(newErrors);
    console.log('Validation result:', Object.keys(newErrors).length === 0 ? 'PASSED' : 'FAILED', 'Errors:', newErrors);
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

  const addTag = () => {
    if (newTag.trim()) {
      const tagExists = formData.tags.some(tag => tag.toLowerCase() === newTag.trim().toLowerCase());
      
      if (!tagExists) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag.trim()]
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

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Simulate file upload - replace with actual upload logic
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const fileUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, featuredImage: fileUrl }));
      setUploadedFile(file);
      
      // Clear media error when file is uploaded successfully
      if (errors.media) {
        setErrors(prev => ({
          ...prev,
          media: null
        }));
      }
    } catch (error) {
      setUploadError('Failed to upload file');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (status = 'DRAFT', contentOnly = false) => {
    console.log('handleSave called with status:', status, 'contentOnly:', contentOnly);
    // Trigger form submission with specific status
    const form = document.querySelector('.create-article-form');
    if (form) {
      // Store the desired status in a data attribute
      form.dataset.articleStatus = status;
      form.dataset.contentOnly = contentOnly;
      console.log('Form dataset set to:', form.dataset.articleStatus, 'contentOnly:', form.dataset.contentOnly);
      form.requestSubmit();
    } else {
      console.error('Form not found!');
    }
  };

  const handleSaveAsDraft = () => {
    // For draft saves, we can be more lenient with validation
    if (!validateForm(true)) {
      return;
    }
    handleSave('DRAFT');
  };

  const handleSubmitToSectionHead = () => {
    console.log('Submitting to Section Head');
    handleSave('IN_REVIEW');
  };

  const handleSendToEIC = async () => {
    console.log('Sending to EIC');
    console.log('Current article status:', articleStatus);
    
    // For sending to EIC, we need to use the review action endpoint to set reviewer
    if (!validateForm(false)) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // First update the article content
      const articleData = {
        title: formData.title.trim(),
        content: formData.content.trim() || '',
        featuredImage: formData.featuredImage || '',
        mediaCaption: formData.mediaCaption.trim() || '',
        publicationDate: formData.publicationDate && formData.publicationDate.trim() ? 
          (() => {
            const date = new Date(formData.publicationDate);
            return !isNaN(date.getTime()) ? date.toISOString() : undefined;
          })() : undefined,
        categories: formData.category && formData.category.trim() ? 
          [categories.find(cat => cat.name === formData.category)?.slug].filter(Boolean) : [],
        tags: formData.tags && formData.tags.length > 0 ? formData.tags.map(tag => 
          tag.toLowerCase()
             .trim()
             .replace(/[^a-z0-9\s-]/g, '')
             .replace(/\s+/g, '-')
             .replace(/-+/g, '-')
        ).filter(Boolean) : [],
        authors: formData.authors && formData.authors.length > 0 ? 
          formData.authors.filter(author => author.id).map(author => author.id) : []
      };

      // Update article content first
      await articlesAPI.updateArticle(id, articleData);
      
      // Check if we need to change status to IN_REVIEW first
      if (articleStatus === 'NEEDS_REVISION') {
        console.log('Article is in NEEDS_REVISION, changing to IN_REVIEW first');
        // Use the regular status update endpoint to change from NEEDS_REVISION to IN_REVIEW
        await articlesAPI.updateArticleStatus(id, 'IN_REVIEW');
      }
      
      // Then use review action to approve and set reviewer
      console.log('Approving article for EIC review');
      await reviewQueueService.updateArticleStatus(id, 'approve-to-eic');
      
      // Show success message
      setSuccessMessage(`Article "${formData.title}" sent to EIC successfully!`);
      setShowSuccessModal(true);
      
      // Navigate back to review queue
      setTimeout(() => {
        navigate('/content/pending');
      }, 1500);
      
    } catch (error) {
      console.error('Error sending to EIC:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Failed to send article to EIC';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors.map(err => err.msg).join(', ');
      }
      
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = () => {
    setShowPublishModal(true);
  };

  const confirmPublish = () => {
    setShowPublishModal(false);
    console.log('Publishing/Updating article');
    // For published articles, only update content without changing status
    if (articleStatus === 'PUBLISHED') {
      handleSave('PUBLISHED', true); // true indicates content-only update
    } else {
      handleSave('PUBLISHED');
    }
  };

  const cancelPublish = () => {
    setShowPublishModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Get the desired status from the form
    const form = e.target;
    const articleStatus = form.dataset.articleStatus || 'DRAFT';
    const contentOnly = form.dataset.contentOnly === 'true';
    const isDraftSave = articleStatus === 'DRAFT';
    
    console.log('handleSubmit called with status:', articleStatus, 'isDraftSave:', isDraftSave, 'contentOnly:', contentOnly);
    
    if (!validateForm(isDraftSave)) {
      console.log('Validation failed - keeping form data intact');
      setIsSubmitting(false);
      return;
    }
    
    console.log('Validation passed, proceeding with submission');
    setIsSubmitting(true);
    
    try {

      // Prepare data for API (send all fields that backend now supports)
      const articleData = {
        title: formData.title.trim(),
        content: formData.content.trim() || '', // Allow empty content for drafts
        featuredImage: formData.featuredImage || '',
        mediaCaption: formData.mediaCaption.trim() || '',
        publicationDate: formData.publicationDate && formData.publicationDate.trim() ? 
          (() => {
            const date = new Date(formData.publicationDate);
            return !isNaN(date.getTime()) ? date.toISOString() : undefined;
          })() : undefined,
        // Convert category name to slug for backend - ensure it's an array
        categories: formData.category && formData.category.trim() ? 
          [categories.find(cat => cat.name === formData.category)?.slug].filter(Boolean) : [],
        // Convert tags to slugs for backend - ensure it's an array
        tags: formData.tags && formData.tags.length > 0 ? formData.tags.map(tag => 
          tag.toLowerCase()
             .trim()
             .replace(/[^a-z0-9\s-]/g, '')
             .replace(/\s+/g, '-')
             .replace(/-+/g, '-')
        ).filter(Boolean) : [],
        // Send author IDs as expected by backend - ensure it's an array
        authors: formData.authors && formData.authors.length > 0 ? 
          formData.authors.filter(author => author.id).map(author => author.id) : []
      };

      // Validate data before sending
      console.log('Validating article data before sending...');
      console.log('Title length:', articleData.title?.length);
      console.log('Content length:', articleData.content?.length);
      console.log('Publication date:', articleData.publicationDate);
      console.log('Categories:', articleData.categories);
      console.log('Tags:', articleData.tags);
      console.log('Authors:', articleData.authors);
      
      if (!articleData.title || articleData.title.length < 3) {
        showNotification('Error', 'Title must be at least 3 characters long', 'error');
        setIsSubmitting(false);
        return;
      }

      if (!articleData.content || articleData.content.length < 1) {
        showNotification('Error', 'Content cannot be empty', 'error');
        setIsSubmitting(false);
        return;
      }

      console.log('Submitting article data:', articleData);
      console.log('Article ID:', id);
      console.log('Request body:', JSON.stringify(articleData, null, 2));

      // Update article content first
      try {
        await articlesAPI.updateArticle(id, articleData);
      } catch (updateError) {
        console.error('Error updating article:', updateError);
        console.error('Error response:', updateError.response?.data);
        console.error('Error status:', updateError.response?.status);
        console.error('Error headers:', updateError.response?.headers);
        console.error('Full error object:', updateError);
        
        let errorMessage = 'Failed to update article. Please try again.';
        if (updateError.response?.status === 400) {
          errorMessage = 'Invalid data provided. Please check your input.';
        } else if (updateError.response?.status === 403) {
          errorMessage = 'You do not have permission to edit this article.';
        } else if (updateError.response?.status === 404) {
          errorMessage = 'Article not found.';
        }
        
        showNotification('Error', errorMessage, 'error');
        setIsSubmitting(false);
        return;
      }
      
      // If status is not DRAFT and not content-only update, also update the status separately
      if (articleStatus !== 'DRAFT' && !contentOnly) {
        console.log('Updating article status to:', articleStatus);
        try {
          await articlesAPI.updateArticleStatus(id, articleStatus);
        } catch (statusError) {
          console.error('Status update failed:', statusError);
          // If status update fails, show error but don't fail the entire operation
          showNotification('Warning', 'Article content updated, but status change failed. Please try updating the status separately.', 'warning');
          setTimeout(() => {
            navigate('/content/pending');
          }, 2000);
          return;
        }
      }
      
      // Show success message based on status
      let successMessage = '';
      if (contentOnly) {
        successMessage = `Article "${formData.title}" updated successfully!`;
      } else {
        switch (articleStatus) {
          case 'DRAFT':
            successMessage = `Article "${formData.title}" saved successfully!`;
            break;
          case 'IN_REVIEW':
            successMessage = `Article "${formData.title}" submitted for review!`;
            break;
          case 'APPROVED':
            successMessage = `Article "${formData.title}" sent to EIC successfully!`;
            break;
          case 'PUBLISHED':
            successMessage = `Article "${formData.title}" published successfully!`;
            break;
          default:
            successMessage = `Article "${formData.title}" updated successfully!`;
        }
      }
      
      showNotification('Success', successMessage, 'success');
      
      // Navigate back to review queue after a short delay to show the notification
      setTimeout(() => {
        navigate('/content/pending');
      }, 1500);

    } catch (error) {
      console.error('Error updating article:', error);
      
      let errorMessage = 'Failed to update article. Please try again.';
      if (error.response?.status === 403) {
        errorMessage = 'You can only edit your own articles.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Article not found.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Please log in to edit articles.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      showNotification('Error', errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleCancel = () => {
    navigate('/content/pending');
  };

  // Rich text editor functions
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

  if (isLoading) {
    return (
      <div className="create-article-container">
        <div className="create-article-loading">
          <div className="create-article-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-article-container">
      <div className="create-article-content">
        {/* Header */}
        <div className="create-article-header">
          <h1 className="create-article-title">{articleStatus === 'PUBLISHED' ? 'Update Content' : 'Edit Content'}</h1>
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
                {articleStatus !== 'PUBLISHED' && (
                  <button
                    type="button"
                    onClick={handleSaveAsDraft}
                    disabled={isSubmitting}
                    className="create-article-save-btn"
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </button>
                )}
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
                {articleStatus !== 'PUBLISHED' && (
                  <button
                    type="button"
                    onClick={handleSaveAsDraft}
                    disabled={isSubmitting}
                    className="create-article-save-btn"
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </button>
                )}
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
                {articleStatus !== 'PUBLISHED' && (
                  <button
                    type="button"
                    onClick={handleSaveAsDraft}
                    disabled={isSubmitting}
                    className="create-article-save-btn"
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isSubmitting}
                  className="create-article-publish-btn"
                >
                  {isSubmitting ? (articleStatus === 'PUBLISHED' ? 'Updating...' : 'Publishing...') : (articleStatus === 'PUBLISHED' ? 'Update' : 'Publish')}
                </button>
              </>
            )}
            
            {user?.role === 'SYSTEM_ADMIN' && (
              <>
                {articleStatus !== 'PUBLISHED' && (
                  <button
                    type="button"
                    onClick={handleSaveAsDraft}
                    disabled={isSubmitting}
                    className="create-article-save-btn"
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isSubmitting}
                  className="create-article-publish-btn"
                >
                  {isSubmitting ? (articleStatus === 'PUBLISHED' ? 'Updating...' : 'Publishing...') : (articleStatus === 'PUBLISHED' ? 'Update' : 'Publish')}
                </button>
              </>
            )}
            
            {/* Fallback for other roles */}
            {!['STAFF', 'SECTION_HEAD', 'EDITOR_IN_CHIEF', 'SYSTEM_ADMIN'].includes(user?.role) && (
              <>
                {articleStatus !== 'PUBLISHED' && (
                  <button
                    type="button"
                    onClick={handleSaveAsDraft}
                    disabled={isSubmitting}
                    className="create-article-save-btn"
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </button>
                )}
              </>
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
                        <div key={author.id || author.name} className="create-article-author-tag">
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
                          onChange={(e) => setNewAuthor(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addAuthor();
                            }
                          }}
                          placeholder="Add author..."
                        />
                      </div>
                    </div>
                    
                    {/* Author Suggestions Dropdown */}
                    {showAuthorSuggestions && authorSuggestions.length > 0 && (
                      <div className="create-article-author-suggestions">
                        {authorSuggestions.map((user, index) => (
                          <div
                            key={user.id}
                            className={`create-article-author-suggestion ${
                              index === selectedSuggestionIndex ? 'selected' : ''
                            }`}
                            onClick={() => addAuthor(user)}
                          >
                            <div className="create-article-author-suggestion-name">
                              {`${user.firstName} ${user.lastName}`.trim() || user.username}
                            </div>
                            <div className="create-article-author-suggestion-username">
                              @{user.username}
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
                        onClick={() => setUploadedFile(null)}
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
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                          }
                        }}
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

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Success"
        message={successMessage}
        buttonText="OK"
      />

      {/* Publish Modal */}
      {showPublishModal && (
        <div className="simple-publish-modal-overlay">
          <div className="simple-publish-modal">
            <div className="simple-publish-modal-header">
              <h3 className="simple-publish-modal-title">
                {articleStatus === 'PUBLISHED' ? 'Update Article' : 'Publish Article'}
              </h3>
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
                {articleStatus === 'PUBLISHED' 
                  ? `Are you sure you want to update "${formData.title}"?`
                  : `Are you sure you want to publish "${formData.title}"?`
                }
              </p>
              <p className="simple-publish-details">
                Category: {formData.category || 'Uncategorized'}
              </p>
              <p className="simple-publish-note">
                {articleStatus === 'PUBLISHED' 
                  ? 'This will update the article content and keep it live for readers.'
                  : 'This will make the article live and visible to readers. This action cannot be undone.'
                }
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
                {articleStatus === 'PUBLISHED' ? 'Update Article' : 'Publish Article'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewEditContent;
