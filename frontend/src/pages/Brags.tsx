import { useState, useEffect, useCallback } from 'react';
import {
  TrophyIcon,
  ChartBarIcon,
  ClockIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  FireIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  XMarkIcon,
  PhotoIcon,
  EyeIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClipboardDocumentListIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import {
  getBrags,
  getBragById,
  toggleLike,
  getPublicStats,
  getMyStats,
  createBrag,
  addComment,
  moderateBrag,
  updateBrag,
  deleteBrag,
  getMyBrags,
  type Brag,
  type GetBragsParams
} from '../services/bragsService';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import toast from 'react-hot-toast';
import CustomSelect from '../components/CustomSelect';
import socketService from '../services/socketService';

const categories = [
  { name: 'All Stories', count: 0 },
  { name: 'sales', count: 0 },
  { name: 'growth', count: 0 },
  { name: 'marketing', count: 0 },
  { name: 'customer-service', count: 0 },
  { name: 'operations', count: 0 },
  { name: 'community', count: 0 },
  { name: 'other', count: 0 }
];

const Brags = () => {
  const { user } = useAuth();
  const { canManage, canEditItem, canDeleteItem } = usePermissions();
  const [selectedCategory, setSelectedCategory] = useState('All Stories');
  const [stories, setStories] = useState<Brag[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // My Stories state (for owners)
  const [showMyStories, setShowMyStories] = useState(false);
  const [myStories, setMyStories] = useState<Brag[]>([]);
  const [loadingMyStories, setLoadingMyStories] = useState(false);

  // Edit story state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStory, setEditingStory] = useState<Brag | null>(null);
  const [editStoryData, setEditStoryData] = useState({
    title: '',
    content: '',
    tags: [] as string[],
  });
  const [editTagInput, setEditTagInput] = useState('');
  const [editFeaturedImage, setEditFeaturedImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [updatingStory, setUpdatingStory] = useState(false);
  const [deletingStoryId, setDeletingStoryId] = useState<string | null>(null);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setSearchQuery(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };
  const [stats, setStats] = useState<{
    publishedStories: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
  } | null>(null);
  const [sortBy, setSortBy] = useState<'popular' | 'likes' | 'views' | 'oldest' | '-createdAt'>('-createdAt');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [loadingMore, setLoadingMore] = useState(false);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Brag | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Create story form state
  const [newStory, setNewStory] = useState({
    title: '',
    content: '',
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');
  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Admin moderation state
  const [pendingStories, setPendingStories] = useState<Brag[]>([]);
  const [showModerationPanel, setShowModerationPanel] = useState(false);
  const [loadingPending, setLoadingPending] = useState(false);
  const [moderatingId, setModeratingId] = useState<string | null>(null);

  // Fetch statistics (owner-specific for owner role, public for others)
  const fetchStats = async () => {
    try {
      // Use owner-specific stats for owner role
      if (user?.role === 'owner') {
        const response = await getMyStats();
        setStats(response.data);
      } else {
        const response = await getPublicStats();
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Fetch pending stories (admin only)
  const fetchPendingStories = async () => {
    if (!canManage('successStories')) return;

    try {
      setLoadingPending(true);
      const response = await getBrags({ status: 'pending' });
      setPendingStories(response.data);
    } catch (err) {
      console.error('Error fetching pending stories:', err);
    } finally {
      setLoadingPending(false);
    }
  };

  // Fetch user's own stories
  const fetchMyStories = async () => {
    if (!user) return;

    try {
      setLoadingMyStories(true);
      const response = await getMyBrags();
      setMyStories(response.data);
    } catch (err) {
      console.error('Error fetching my stories:', err);
      toast.error('Failed to load your stories');
    } finally {
      setLoadingMyStories(false);
    }
  };

  // Handle edit story
  const handleOpenEditModal = (story: Brag) => {
    setEditingStory(story);
    setEditStoryData({
      title: story.title,
      content: story.content,
      tags: story.tags || [],
    });
    setEditImagePreview(story.featuredImage || null);
    setEditFeaturedImage(null);
    setShowEditModal(true);
  };

  // Handle update story
  const handleUpdateStory = async () => {
    if (!editingStory) return;

    if (!editStoryData.title.trim() || !editStoryData.content.trim()) {
      toast.error('Please provide a title and content');
      return;
    }

    try {
      setUpdatingStory(true);
      await updateBrag(editingStory._id, {
        title: editStoryData.title.trim(),
        content: editStoryData.content.trim(),
        tags: editStoryData.tags,
        featuredImage: editFeaturedImage || undefined,
      });
      toast.success('Story updated successfully!');
      setShowEditModal(false);
      setEditingStory(null);
      setEditStoryData({ title: '', content: '', tags: [] });
      setEditFeaturedImage(null);
      setEditImagePreview(null);

      // Refresh stories
      fetchStories();
      if (showMyStories) {
        fetchMyStories();
      }
    } catch (err: any) {
      console.error('Error updating story:', err);
      toast.error(err.response?.data?.error || 'Failed to update story');
    } finally {
      setUpdatingStory(false);
    }
  };

  // Handle delete story
  const handleDeleteStory = async (storyId: string) => {
    if (!window.confirm('Are you sure you want to delete this story? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingStoryId(storyId);
      await deleteBrag(storyId);
      toast.success('Story deleted successfully!');

      // Remove from stories lists
      setStories(prev => prev.filter(s => s._id !== storyId));
      setMyStories(prev => prev.filter(s => s._id !== storyId));

      // Close detail modal if open
      if (selectedStory?._id === storyId) {
        setShowDetailModal(false);
        setSelectedStory(null);
      }

      fetchStats();
    } catch (err: any) {
      console.error('Error deleting story:', err);
      toast.error(err.response?.data?.error || 'Failed to delete story');
    } finally {
      setDeletingStoryId(null);
    }
  };

  // Handle edit tag functions
  const handleAddEditTag = () => {
    if (editTagInput.trim() && !editStoryData.tags.includes(editTagInput.trim().toLowerCase())) {
      setEditStoryData({
        ...editStoryData,
        tags: [...editStoryData.tags, editTagInput.trim().toLowerCase()],
      });
      setEditTagInput('');
    }
  };

  const handleRemoveEditTag = (tagToRemove: string) => {
    setEditStoryData({
      ...editStoryData,
      tags: editStoryData.tags.filter(tag => tag !== tagToRemove),
    });
  };

  // Handle edit image selection
  const handleEditImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image must be less than 10MB');
        return;
      }
      setEditFeaturedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveEditImage = () => {
    setEditFeaturedImage(null);
    setEditImagePreview(null);
  };

  // Handle moderation (approve/reject)
  const handleModerate = async (storyId: string, status: 'approved' | 'rejected', notes?: string) => {
    try {
      setModeratingId(storyId);
      await moderateBrag(storyId, { status, moderatorNotes: notes });
      toast.success(`Story ${status}!`);
      // Remove from pending list
      setPendingStories(prev => prev.filter(s => s._id !== storyId));
      // Refresh published stories if approved
      if (status === 'approved') {
        fetchStories();
        fetchStats();
      }
    } catch (err: any) {
      console.error('Error moderating story:', err);
      toast.error(err.response?.data?.error || 'Failed to moderate story');
    } finally {
      setModeratingId(null);
    }
  };

  // Fetch stories
  const fetchStories = async (page: number = 1, append: boolean = false) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError('');

      const params: GetBragsParams = {
        page,
        limit: pagination.limit,
        sort: sortBy,
      };

      if (selectedCategory !== 'All Stories') {
        params.tag = selectedCategory;
      }

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await getBrags(params);

      if (append) {
        setStories(prev => [...prev, ...response.data]);
      } else {
        setStories(response.data);
      }

      setPagination(response.pagination);
    } catch (err: any) {
      console.error('Error fetching brags:', err);
      setError(err.response?.data?.error || 'Failed to load success stories. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchStories();
    fetchStats();
    if (canManage('successStories')) {
      fetchPendingStories();
    }
  }, [user, canManage]);

  // Re-fetch when filters change
  useEffect(() => {
    if (!loading) {
      fetchStories(1, false);
    }
  }, [selectedCategory, searchQuery, sortBy]);

  // Socket.io real-time updates
  useEffect(() => {
    // Connect to socket
    socketService.connect();
    socketService.joinRoom('brags');

    // Handle real-time like updates
    const handleLikeUpdate = (data: { storyId: string; likesCount: number; userId: string; isLiked: boolean }) => {
      console.log('Real-time like update:', data);

      // Update stories list
      setStories(prevStories =>
        prevStories.map(story =>
          story._id === data.storyId
            ? { ...story, likesCount: data.likesCount }
            : story
        )
      );

      // Update selected story if viewing
      setSelectedStory(prev => {
        if (prev && prev._id === data.storyId) {
          return { ...prev, likesCount: data.likesCount };
        }
        return prev;
      });

      // Update my stories if viewing
      setMyStories(prev =>
        prev.map(story =>
          story._id === data.storyId
            ? { ...story, likesCount: data.likesCount }
            : story
        )
      );
    };

    // Handle real-time comment updates
    const handleCommentUpdate = (data: { storyId: string; comment: any; commentsCount: number }) => {
      console.log('Real-time comment update:', data);

      // Update stories list
      setStories(prevStories =>
        prevStories.map(story =>
          story._id === data.storyId
            ? {
                ...story,
                commentsCount: data.commentsCount,
                comments: [...(story.comments || []), data.comment]
              }
            : story
        )
      );

      // Update selected story if viewing
      setSelectedStory(prev => {
        if (prev && prev._id === data.storyId) {
          // Check if comment already exists (to avoid duplicates from own action)
          const commentExists = prev.comments?.some(c => c._id === data.comment._id);
          if (!commentExists) {
            return {
              ...prev,
              commentsCount: data.commentsCount,
              comments: [...(prev.comments || []), data.comment]
            };
          }
        }
        return prev;
      });

      // Update my stories if viewing
      setMyStories(prev =>
        prev.map(story =>
          story._id === data.storyId
            ? { ...story, commentsCount: data.commentsCount }
            : story
        )
      );
    };

    // Handle new story (when approved)
    const handleNewStory = (data: { story: Brag }) => {
      console.log('Real-time new story:', data);

      // Add new story to the top of the list (if not already there)
      setStories(prevStories => {
        const exists = prevStories.some(s => s._id === data.story._id);
        if (!exists) {
          return [data.story, ...prevStories];
        }
        return prevStories;
      });

      // Update stats
      fetchStats();
    };

    // Subscribe to events
    socketService.on('brag:like', handleLikeUpdate);
    socketService.on('brag:comment', handleCommentUpdate);
    socketService.on('brag:new', handleNewStory);

    // Cleanup on unmount
    return () => {
      socketService.off('brag:like', handleLikeUpdate);
      socketService.off('brag:comment', handleCommentUpdate);
      socketService.off('brag:new', handleNewStory);
      socketService.leaveRoom('brags');
    };
  }, []);

  // Handle like/unlike
  const handleLike = async (storyId: string) => {
    if (!user) {
      // Show login prompt or redirect
      toast.error('Please log in to like stories');
      return;
    }

    try {
      const response = await toggleLike(storyId);

      const updatedLikes = response.data.isLiked
        ? [...(selectedStory?.likes || []), user.id]
        : (selectedStory?.likes || []).filter(id => id !== user.id);

      // Update the story in the list
      setStories(prevStories =>
        prevStories.map(story =>
          story._id === storyId
            ? {
                ...story,
                likesCount: response.data.likes,
                isLiked: response.data.isLiked,
                likes: response.data.isLiked
                  ? [...story.likes, user.id]
                  : story.likes.filter(id => id !== user.id)
              }
            : story
        )
      );

      // Also update selectedStory if it's the same story (for modal view)
      if (selectedStory && selectedStory._id === storyId) {
        setSelectedStory(prev => prev ? {
          ...prev,
          likesCount: response.data.likes,
          isLiked: response.data.isLiked,
          likes: updatedLikes
        } : null);
      }
    } catch (err: any) {
      console.error('Error toggling like:', err);
      toast.error(err.response?.data?.error || 'Failed to like story');
    }
  };

  // Handle category click
  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Load more stories
  const handleLoadMore = () => {
    if (pagination.page < pagination.pages) {
      fetchStories(pagination.page + 1, true);
    }
  };

  // Format date as MM/DD/YYYY HH:MM AM/PM
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    const formattedHours = String(hours).padStart(2, '0');

    return `${month}/${day}/${year} ${formattedHours}:${minutes} ${ampm}`;
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Handle open story detail
  const handleOpenStory = async (story: Brag) => {
    // Set the story immediately for a responsive UI
    setSelectedStory(story);
    setShowDetailModal(true);

    try {
      // Fetch the full story data from API (this also increments view count)
      const response = await getBragById(story._id);
      setSelectedStory(response.data);

      // Also update the story in the stories list with the new view count
      setStories(prevStories =>
        prevStories.map(s =>
          s._id === story._id ? { ...s, views: response.data.views } : s
        )
      );
    } catch (err) {
      console.error('Error fetching story details:', err);
      // Keep showing the local data if API fails
    }
  };

  // Handle close story detail
  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedStory(null);
    setNewComment('');
  };

  // Handle create story
  const handleCreateStory = async () => {
    if (!user) {
      toast.error('Please log in to share your story');
      return;
    }

    if (!newStory.title.trim() || !newStory.content.trim()) {
      toast.error('Please provide a title and content');
      return;
    }

    try {
      setSubmitting(true);
      await createBrag({
        title: newStory.title.trim(),
        content: newStory.content.trim(),
        tags: newStory.tags,
        featuredImage: featuredImage || undefined,
      });
      toast.success('Story submitted for review!');
      setShowCreateModal(false);
      setNewStory({ title: '', content: '', tags: [] });
      setTagInput('');
      setFeaturedImage(null);
      setImagePreview(null);
      fetchStories();
    } catch (err: any) {
      console.error('Error creating story:', err);
      toast.error(err.response?.data?.error || 'Failed to create story');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle add tag
  const handleAddTag = () => {
    if (tagInput.trim() && !newStory.tags.includes(tagInput.trim().toLowerCase())) {
      setNewStory({
        ...newStory,
        tags: [...newStory.tags, tagInput.trim().toLowerCase()],
      });
      setTagInput('');
    }
  };

  // Handle remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    setNewStory({
      ...newStory,
      tags: newStory.tags.filter(tag => tag !== tagToRemove),
    });
  };

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image must be less than 10MB');
        return;
      }
      setFeaturedImage(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle remove image
  const handleRemoveImage = () => {
    setFeaturedImage(null);
    setImagePreview(null);
  };

  // Handle add comment
  const handleAddComment = async () => {
    if (!user) {
      toast.error('Please log in to comment');
      return;
    }

    if (!selectedStory || !newComment.trim()) {
      return;
    }

    try {
      setSubmittingComment(true);
      const response = await addComment(selectedStory._id, newComment.trim());
      toast.success('Comment added!');
      setNewComment('');

      // Update the selected story with the new comment
      setSelectedStory(prev => prev ? {
        ...prev,
        comments: [...prev.comments, response.data],
        commentsCount: prev.commentsCount + 1
      } : null);

      // Also update the story in the stories list
      setStories(prevStories =>
        prevStories.map(story =>
          story._id === selectedStory._id
            ? {
                ...story,
                comments: [...story.comments, response.data],
                commentsCount: story.commentsCount + 1
              }
            : story
        )
      );

      // Refresh stats
      fetchStats();
    } catch (err: any) {
      console.error('Error adding comment:', err);
      toast.error(err.response?.data?.error || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center">
                <TrophyIcon className="h-8 w-8 mr-3" />
                Success Stories
              </h1>
              <p className="mt-3 text-lg text-primary-100">
                Celebrating achievements and milestones from our Sign Company community
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
              {canManage('successStories') && (
                <button
                  className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 transition-colors duration-200"
                  onClick={() => {
                    setShowModerationPanel(true);
                    fetchPendingStories();
                  }}
                >
                  <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
                  Review Pending
                  {pendingStories.length > 0 && (
                    <span className="ml-2 bg-white text-yellow-600 text-xs font-bold px-2 py-0.5 rounded-full">
                      {pendingStories.length}
                    </span>
                  )}
                </button>
              )}
              {user && (
                <button
                  className={`inline-flex items-center px-4 py-2 font-medium rounded-lg transition-colors duration-200 ${
                    showMyStories
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                  onClick={() => {
                    setShowMyStories(!showMyStories);
                    if (!showMyStories) {
                      fetchMyStories();
                    }
                  }}
                >
                  <UserIcon className="h-5 w-5 mr-2" />
                  My Stories
                </button>
              )}
              <button
                className="inline-flex items-center px-4 py-2 bg-white text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors duration-200"
                onClick={() => setShowCreateModal(true)}
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Share Your Story
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <FireIcon className="h-8 w-8 text-orange-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {stats?.publishedStories || pagination.total || 0}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {user?.role === 'owner' ? 'My Stories' : 'Success Stories'}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <ChartBarIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {(stats?.totalViews || 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {user?.role === 'owner' ? 'My Views' : 'Total Views'}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <HeartIcon className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {(stats?.totalLikes || 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {user?.role === 'owner' ? 'My Likes' : 'Total Likes'}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <ChatBubbleLeftIcon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {(stats?.totalComments || 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {user?.role === 'owner' ? 'My Comments' : 'Total Comments'}
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search success stories..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Search</span>
            </button>
          </div>
          <div className="w-40">
            <CustomSelect
              value={sortBy}
              onChange={(value) => setSortBy(value as any)}
              options={[
                { value: '-createdAt', label: 'Newest First' },
                { value: 'popular', label: 'Most Popular' },
                { value: 'likes', label: 'Most Liked' },
                { value: 'views', label: 'Most Viewed' },
                { value: 'oldest', label: 'Oldest First' },
              ]}
            />
          </div>
        </form>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sticky top-20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Categories</h3>
            <nav className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => handleCategoryClick(category.name)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg flex items-center justify-between transition-all duration-200 ${
                    selectedCategory === category.name
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium border-l-4 border-primary-600 dark:border-primary-500'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <span className="capitalize">{category.name === 'customer-service' ? 'Customer Service' : category.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Stories Grid */}
        <div className="lg:col-span-3 space-y-6">
          {/* My Stories Section */}
          {showMyStories && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                  <UserIcon className="h-5 w-5 mr-2 text-primary-600" />
                  My Stories
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Manage your submitted success stories
                </p>
              </div>
              <div className="p-6">
                {loadingMyStories ? (
                  <div className="flex items-center justify-center py-8">
                    <ArrowPathIcon className="h-8 w-8 text-primary-600 animate-spin" />
                  </div>
                ) : myStories.length === 0 ? (
                  <div className="text-center py-8">
                    <TrophyIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">You haven't shared any stories yet.</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Share Your First Story
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myStories.map((story) => (
                      <div
                        key={story._id}
                        className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                              {story.title}
                            </h4>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              story.status === 'approved'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : story.status === 'pending'
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            }`}>
                              {story.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(story.createdAt)} • {story.likesCount} likes • {story.commentsCount} comments
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleOpenEditModal(story)}
                            className="p-2 text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStory(story._id)}
                            disabled={deletingStoryId === story._id}
                            className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingStoryId === story._id ? (
                              <ArrowPathIcon className="h-5 w-5 animate-spin" />
                            ) : (
                              <TrashIcon className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && !showMyStories && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <ArrowPathIcon className="h-12 w-12 text-primary-600 dark:text-primary-400 animate-spin" />
                <p className="text-gray-600 dark:text-gray-400">Loading success stories...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && !showMyStories && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 flex items-start space-x-3">
              <ExclamationCircleIcon className="h-6 w-6 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error loading stories</h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
                <button
                  onClick={() => fetchStories()}
                  className="mt-3 inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && stories.length === 0 && !showMyStories && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
              <TrophyIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No stories found</h3>
              <p className="text-gray-500 dark:text-gray-400">Try adjusting your filters or search query</p>
            </div>
          )}

          {/* Stories List */}
          {!loading && !error && stories.length > 0 && (
            <>
              {showMyStories && (
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6">All Published Stories</h3>
              )}
              {stories.map((story) => (
                <article
                  key={story._id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => handleOpenStory(story)}
                >
                  <div className="flex flex-col">
                    {/* Featured Image */}
                    {story.featuredImage && (
                      <div className="w-full h-48 sm:h-64 relative">
                        <img
                          src={story.featuredImage}
                          alt={story.title}
                          className="w-full h-full object-cover"
                        />
                        {/* Edit/Delete buttons for own stories */}
                        {canEditItem('successStories', story.author._id) && (
                          <div className="absolute top-2 right-2 flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditModal(story);
                              }}
                              className="p-2 bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg shadow-sm transition-colors"
                              title="Edit"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteStory(story._id);
                              }}
                              disabled={deletingStoryId === story._id}
                              className="p-2 bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              {deletingStoryId === story._id ? (
                                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                              ) : (
                                <TrashIcon className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex-1 p-6">
                      {/* Story Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold">
                            {getInitials(story.author.name)}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{story.author.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {story.author.location || 'Location'} • {formatDate(story.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {story.tags && story.tags.length > 0 && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 capitalize">
                              {story.tags[0]}
                            </span>
                          )}
                          {/* Edit/Delete buttons for own stories (no featured image) */}
                          {!story.featuredImage && canEditItem('successStories', story.author._id) && (
                            <div className="flex gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditModal(story);
                                }}
                                className="p-1.5 text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteStory(story._id);
                                }}
                                disabled={deletingStoryId === story._id}
                                className="p-1.5 text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                                title="Delete"
                              >
                                {deletingStoryId === story._id ? (
                                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                ) : (
                                  <TrashIcon className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Story Content */}
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 hover:text-primary-600 dark:hover:text-primary-400 transition-colors line-clamp-2">
                        {story.title}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {story.content.substring(0, 200)}...
                      </p>

                      {/* Tags and Actions */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                          {story.tags && story.tags.slice(1, 3).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 capitalize"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLike(story._id);
                            }}
                            className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          >
                            {story.isLiked || (user && story.likes.includes(user.id)) ? (
                              <HeartSolidIcon className="h-5 w-5 text-red-500 dark:text-red-400" />
                            ) : (
                              <HeartIcon className="h-5 w-5" />
                            )}
                            <span className="text-sm">{story.likesCount}</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenStory(story);
                            }}
                            className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                          >
                            <ChatBubbleLeftIcon className="h-5 w-5" />
                            <span className="text-sm">{story.commentsCount}</span>
                          </button>
                          <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                            <ClockIcon className="h-5 w-5" />
                            <span className="text-sm">{story.views} views</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}

              {/* Load More */}
              {pagination.page < pagination.pages && (
                <div className="text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingMore ? (
                      <>
                        <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Load More Stories
                        <span className="ml-2 text-sm">
                          ({stories.length} of {pagination.total})
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Story Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm dark:bg-opacity-70 flex items-center justify-center p-4 z-50"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Share Your Success Story</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-5">
              {!user && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">Please log in to share your story.</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={newStory.title}
                  onChange={(e) => setNewStory({ ...newStory, title: e.target.value })}
                  placeholder="Give your story a catchy title"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  maxLength={200}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {newStory.title.length}/200 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Story *
                </label>
                <textarea
                  value={newStory.content}
                  onChange={(e) => setNewStory({ ...newStory, content: e.target.value })}
                  placeholder="Tell us about your success! What did you achieve? How did you do it? What did you learn?"
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                />
              </div>

              {/* Featured Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Featured Image (Optional)
                </label>
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {featuredImage?.name} ({(featuredImage?.size || 0 / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary-500 dark:hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <PhotoIcon className="h-10 w-10 text-gray-400 dark:text-gray-500 mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-medium text-primary-600 dark:text-primary-400">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageSelect}
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags (Optional)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Type a tag and press Enter"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.slice(1).map(cat => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => {
                        if (!newStory.tags.includes(cat.name)) {
                          setNewStory({ ...newStory, tags: [...newStory.tags, cat.name] });
                        }
                      }}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        newStory.tags.includes(cat.name)
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
                {newStory.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {newStory.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateStory}
                disabled={submitting || !newStory.title.trim() || !newStory.content.trim() || !user}
                className="flex-1 py-3 px-4 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="h-5 w-5" />
                    Submit Story
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Story Detail Modal */}
      {showDetailModal && selectedStory && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm dark:bg-opacity-70 flex items-center justify-center p-4 z-50"
          onClick={handleCloseDetail}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold">
                  {getInitials(selectedStory.author.name)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedStory.author.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(selectedStory.createdAt)}</p>
                </div>
              </div>
              <button
                onClick={handleCloseDetail}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Featured Image */}
            {selectedStory.featuredImage && (
              <div className="w-full h-64 sm:h-80">
                <img
                  src={selectedStory.featuredImage}
                  alt={selectedStory.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                {selectedStory.title}
              </h2>

              {/* Additional Images Gallery */}
              {selectedStory.images && selectedStory.images.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Gallery</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedStory.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image.url}
                          alt={image.caption || `Image ${index + 1}`}
                          className="w-full h-24 sm:h-32 object-cover rounded-lg"
                        />
                        {image.caption && (
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-end justify-center transition-all rounded-lg">
                            <p className="text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity truncate">
                              {image.caption}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedStory.tags && selectedStory.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedStory.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {selectedStory.content}
                </p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleLike(selectedStory._id)}
                  className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  {selectedStory.isLiked || (user && selectedStory.likes.includes(user.id)) ? (
                    <HeartSolidIcon className="h-6 w-6 text-red-500" />
                  ) : (
                    <HeartIcon className="h-6 w-6" />
                  )}
                  <span className="font-medium">{selectedStory.likesCount} likes</span>
                </button>
                <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <ChatBubbleLeftIcon className="h-6 w-6" />
                  <span className="font-medium">{selectedStory.commentsCount} comments</span>
                </span>
                <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <EyeIcon className="h-6 w-6" />
                  <span className="font-medium">{selectedStory.views} views</span>
                </span>
              </div>

              {/* Comments List */}
              {selectedStory.comments && selectedStory.comments.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Comments ({selectedStory.comments.length})
                  </h4>
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {selectedStory.comments.map((comment) => (
                      <div key={comment._id} className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                          {getInitials(comment.user?.name || 'U')}
                        </div>
                        <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-4 py-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                              {comment.user?.name || 'Unknown User'}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{comment.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Comment */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Add a Comment</h4>
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {user ? getInitials(user.name) : '?'}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={user ? "Share your thoughts..." : "Please log in to comment"}
                      disabled={!user}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={handleAddComment}
                        disabled={submittingComment || !newComment.trim() || !user}
                        className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {submittingComment ? (
                          <>
                            <ArrowPathIcon className="h-4 w-4 animate-spin" />
                            Posting...
                          </>
                        ) : (
                          <>
                            <PaperAirplaneIcon className="h-4 w-4" />
                            Post Comment
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Story Modal */}
      {showEditModal && editingStory && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm dark:bg-opacity-70 flex items-center justify-center p-4 z-50"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Edit Your Story</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-5">
              {editingStory.status === 'pending' && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    This story is pending approval. Your changes will be saved but still require admin review.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={editStoryData.title}
                  onChange={(e) => setEditStoryData({ ...editStoryData, title: e.target.value })}
                  placeholder="Give your story a catchy title"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  maxLength={200}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {editStoryData.title.length}/200 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Story *
                </label>
                <textarea
                  value={editStoryData.content}
                  onChange={(e) => setEditStoryData({ ...editStoryData, content: e.target.value })}
                  placeholder="Tell us about your success!"
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                />
              </div>

              {/* Featured Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Featured Image
                </label>
                {editImagePreview ? (
                  <div className="relative">
                    <img
                      src={editImagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveEditImage}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary-500 dark:hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <PhotoIcon className="h-10 w-10 text-gray-400 dark:text-gray-500 mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-medium text-primary-600 dark:text-primary-400">Click to upload</span> a new image
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleEditImageSelect}
                    />
                  </label>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={editTagInput}
                    onChange={(e) => setEditTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddEditTag();
                      }
                    }}
                    placeholder="Type a tag and press Enter"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddEditTag}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.slice(1).map(cat => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => {
                        if (!editStoryData.tags.includes(cat.name)) {
                          setEditStoryData({ ...editStoryData, tags: [...editStoryData.tags, cat.name] });
                        }
                      }}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        editStoryData.tags.includes(cat.name)
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
                {editStoryData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {editStoryData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveEditTag(tag)}
                          className="ml-2 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStory}
                disabled={updatingStory || !editStoryData.title.trim() || !editStoryData.content.trim()}
                className="flex-1 py-3 px-4 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {updatingStory ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Moderation Panel Modal */}
      {showModerationPanel && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm dark:bg-opacity-70 flex items-center justify-center p-4 z-50"
          onClick={() => setShowModerationPanel(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Review Pending Stories</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {pendingStories.length} {pendingStories.length === 1 ? 'story' : 'stories'} waiting for approval
                </p>
              </div>
              <button
                onClick={() => setShowModerationPanel(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
              {loadingPending ? (
                <div className="flex items-center justify-center py-12">
                  <ArrowPathIcon className="h-8 w-8 text-primary-600 animate-spin" />
                </div>
              ) : pendingStories.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">All caught up!</h4>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">No stories pending review</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingStories.map((story) => (
                    <div
                      key={story._id}
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 border border-gray-200 dark:border-gray-600"
                    >
                      {/* Story Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold">
                            {getInitials(story.author.name)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{story.author.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {story.author.email} • {formatDate(story.createdAt)}
                            </p>
                          </div>
                        </div>
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full">
                          Pending
                        </span>
                      </div>

                      {/* Story Content Preview */}
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {story.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
                        {story.content}
                      </p>

                      {/* Tags */}
                      {story.tags && story.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {story.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Featured Image */}
                      {story.featuredImage && (
                        <div className="mb-4">
                          <img
                            src={story.featuredImage}
                            alt={story.title}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <button
                          onClick={() => handleModerate(story._id, 'approved')}
                          disabled={moderatingId === story._id}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {moderatingId === story._id ? (
                            <ArrowPathIcon className="h-5 w-5 animate-spin" />
                          ) : (
                            <CheckCircleIcon className="h-5 w-5" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => handleModerate(story._id, 'rejected')}
                          disabled={moderatingId === story._id}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {moderatingId === story._id ? (
                            <ArrowPathIcon className="h-5 w-5 animate-spin" />
                          ) : (
                            <XCircleIcon className="h-5 w-5" />
                          )}
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Brags;
