import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import {
  ChatBubbleLeftRightIcon,
  FireIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TagIcon,
  EyeIcon,
  ChatBubbleLeftIcon,
  HeartIcon,
  ArrowPathIcon,
  XMarkIcon,
  ExclamationCircleIcon,
  UserGroupIcon,
  PaperAirplaneIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  PhotoIcon,
  CheckCircleIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartSolidIcon,
  LockClosedIcon as LockSolidIcon,
} from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import CustomSelect from '../components/CustomSelect';

interface Reply {
  _id: string;
  content: string;
  author: {
    _id: string;
    name: string;
    email: string;
    role?: string;
  };
  parentReplyId?: string | null;
  createdAt: string;
  likes?: string[];
}

interface ForumThread {
  _id: string;
  title: string;
  author: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  category: string;
  subcategory?: string;
  createdAt: string;
  lastActivity?: string;
  content: string;
  views: number;
  replyCount: number;
  replies?: Reply[];
  likes?: string[];
  isPinned: boolean;
  isLocked: boolean;
  isBookmarked?: boolean;
  tags: string[];
  images?: string[];
  lastReply?: {
    author: string;
    time: string;
  };
  status: string;
}

const forumCategories = [
  { name: 'All Categories', value: 'all' },
  { name: 'General Discussion', value: 'general' },
  { name: 'Technical Support', value: 'technical' },
  { name: 'Marketing & Sales', value: 'marketing' },
  { name: 'Operations', value: 'operations' },
  { name: 'Equipment', value: 'equipment' },
  { name: 'Suppliers', value: 'suppliers' },
  { name: 'Help & Questions', value: 'help' },
  { name: 'Announcements', value: 'announcements' },
];

const Forum = () => {
  const { user } = useAuth();
  const { canEditItem, canDeleteItem, canManage } = usePermissions();

  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);

  // My Threads state
  const [showMyThreads, setShowMyThreads] = useState(false);
  const [myThreads, setMyThreads] = useState<ForumThread[]>([]);
  const [loadingMyThreads, setLoadingMyThreads] = useState(false);

  // Edit thread state
  const [showEditThreadModal, setShowEditThreadModal] = useState(false);
  const [editingThread, setEditingThread] = useState<ForumThread | null>(null);
  const [editThreadData, setEditThreadData] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: [] as string[],
  });
  const [editTagInput, setEditTagInput] = useState('');
  const [updatingThread, setUpdatingThread] = useState(false);
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setSearchQuery(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newThread, setNewThread] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<'latest' | 'hot' | 'top' | 'unanswered'>('latest');
  const [stats, setStats] = useState({
    totalThreads: 0,
    todayThreads: 0,
    totalReplies: 0,
    activeMembers: 0,
    trendingTags: [] as { name: string; count: number }[]
  });
  const [submitting, setSubmitting] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Detail modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedThread, setSelectedThread] = useState<ForumThread | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [newReply, setNewReply] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Reply menu and editing state
  const [openReplyMenu, setOpenReplyMenu] = useState<string | null>(null);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editedReplyContent, setEditedReplyContent] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [replyToDelete, setReplyToDelete] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyingToAuthor, setReplyingToAuthor] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  // Fetch threads from API
  const fetchThreads = async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError('');

      // Map sort options to API sort values
      const sortMap = {
        latest: '-createdAt',
        hot: '-views',
        top: '-likes',
        unanswered: 'replies'
      };

      // Find the category value from forumCategories
      const categoryObj = forumCategories.find(c => c.name === selectedCategory);
      const categoryValue = categoryObj?.value;

      const queryParams = new URLSearchParams({
        page: pageNum.toString(),
        limit: '10',
        sort: sortMap[sortBy],
        ...(categoryValue && categoryValue !== 'all' && { category: categoryValue }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/forum?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        if (append) {
          setThreads(prev => [...prev, ...data.data]);
        } else {
          setThreads(data.data);
        }
        setTotalPages(data.pagination.pages);
        setPage(pageNum);
      } else {
        setError(data.error || 'Failed to load threads');
      }
    } catch (err) {
      console.error('Error fetching threads:', err);
      setError('Failed to load forum threads. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Fetch single thread details
  const fetchThreadDetails = async (threadId: string) => {
    try {
      setLoadingThread(true);
      const response = await fetch(`/api/forum/${threadId}`);
      const data = await response.json();

      if (data.success) {
        setSelectedThread(data.data);
      } else {
        toast.error(data.error || 'Failed to load thread');
        setShowDetailModal(false);
      }
    } catch (err) {
      console.error('Error fetching thread:', err);
      toast.error('Failed to load thread details');
      setShowDetailModal(false);
    } finally {
      setLoadingThread(false);
    }
  };

  // Fetch forum stats
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/forum/stats/overview');
      const data = await response.json();

      if (data.success) {
        setStats({
          totalThreads: data.data.totalThreads || 0,
          todayThreads: data.data.todayThreads || 0,
          totalReplies: data.data.totalReplies || 0,
          activeMembers: data.data.activeMembers || 0,
          trendingTags: data.data.trendingTags || []
        });
      }
    } catch (err) {
      console.error('Error fetching forum stats:', err);
    }
  };

  // Fetch user's own threads
  const fetchMyThreads = async () => {
    if (!user) return;

    try {
      setLoadingMyThreads(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/forum/my-threads', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setMyThreads(data.data);
      } else {
        toast.error(data.error || 'Failed to load your threads');
      }
    } catch (err) {
      console.error('Error fetching my threads:', err);
      toast.error('Failed to load your threads');
    } finally {
      setLoadingMyThreads(false);
    }
  };

  // Handle open edit thread modal
  const handleOpenEditThread = (thread: ForumThread) => {
    setEditingThread(thread);
    setEditThreadData({
      title: thread.title,
      content: thread.content,
      category: thread.category,
      tags: thread.tags || [],
    });
    setShowEditThreadModal(true);
  };

  // Handle update thread
  const handleUpdateThread = async () => {
    if (!editingThread) return;

    if (!editThreadData.title.trim() || !editThreadData.content.trim()) {
      toast.error('Please provide a title and content');
      return;
    }

    try {
      setUpdatingThread(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/forum/${editingThread._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editThreadData.title.trim(),
          content: editThreadData.content.trim(),
          category: editThreadData.category,
          tags: editThreadData.tags,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Thread updated successfully!');
        setShowEditThreadModal(false);
        setEditingThread(null);
        setEditThreadData({ title: '', content: '', category: 'general', tags: [] });

        // Refresh threads
        fetchThreads();
        if (showMyThreads) {
          fetchMyThreads();
        }
        // Update selected thread if viewing in detail modal
        if (selectedThread && selectedThread._id === editingThread._id) {
          setSelectedThread(data.data);
        }
      } else {
        toast.error(data.error || 'Failed to update thread');
      }
    } catch (err) {
      console.error('Error updating thread:', err);
      toast.error('Failed to update thread');
    } finally {
      setUpdatingThread(false);
    }
  };

  // Handle delete thread
  const handleDeleteThread = async (threadId: string) => {
    if (!window.confirm('Are you sure you want to delete this thread? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingThreadId(threadId);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/forum/${threadId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Thread deleted successfully!');

        // Remove from threads lists
        setThreads(prev => prev.filter(t => t._id !== threadId));
        setMyThreads(prev => prev.filter(t => t._id !== threadId));

        // Close detail modal if open
        if (selectedThread?._id === threadId) {
          setShowDetailModal(false);
          setSelectedThread(null);
        }

        fetchStats();
      } else {
        toast.error(data.error || 'Failed to delete thread');
      }
    } catch (err) {
      console.error('Error deleting thread:', err);
      toast.error('Failed to delete thread');
    } finally {
      setDeletingThreadId(null);
    }
  };

  // Handle edit tag functions for thread
  const handleAddEditThreadTag = () => {
    if (editTagInput.trim() && !editThreadData.tags.includes(editTagInput.trim().toLowerCase())) {
      setEditThreadData({
        ...editThreadData,
        tags: [...editThreadData.tags, editTagInput.trim().toLowerCase()],
      });
      setEditTagInput('');
    }
  };

  const handleRemoveEditThreadTag = (tagToRemove: string) => {
    setEditThreadData({
      ...editThreadData,
      tags: editThreadData.tags.filter(tag => tag !== tagToRemove),
    });
  };

  // Load threads and stats on component mount and when filters change
  useEffect(() => {
    setPage(1);
    fetchThreads(1, false);
    fetchStats();
  }, [selectedCategory, sortBy]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading) {
        fetchThreads(1, false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle open thread detail
  const handleOpenThread = (thread: ForumThread) => {
    setSelectedThread(thread);
    setShowDetailModal(true);
    fetchThreadDetails(thread._id);
  };

  // Handle close thread detail
  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedThread(null);
    setNewReply('');
  };

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const totalFiles = selectedImages.length + newFiles.length;

    if (totalFiles > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    // Validate file types and sizes
    const validFiles = newFiles.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    setSelectedImages(prev => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle remove image
  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Handle create thread
  const handleCreateThread = async () => {
    if (!newThread.title || !newThread.content) {
      toast.error('Please provide both title and content');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');

      // Use FormData to support file uploads
      const formData = new FormData();
      formData.append('title', newThread.title);
      formData.append('content', newThread.content);
      formData.append('category', newThread.category);
      formData.append('tags', JSON.stringify(newThread.tags));

      // Append images
      selectedImages.forEach(image => {
        formData.append('images', image);
      });

      const response = await fetch('/api/forum', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Thread created successfully!');
        setShowCreateModal(false);
        setNewThread({
          title: '',
          content: '',
          category: 'general',
          tags: [],
        });
        setTagInput('');
        setSelectedImages([]);
        setImagePreviews([]);
        fetchThreads();
        fetchStats();
      } else {
        toast.error(data.error || 'Failed to create thread');
      }
    } catch (err) {
      console.error('Error creating thread:', err);
      toast.error('Failed to create thread');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle add tag
  const handleAddTag = () => {
    if (tagInput.trim() && !newThread.tags.includes(tagInput.trim().toLowerCase())) {
      setNewThread({
        ...newThread,
        tags: [...newThread.tags, tagInput.trim().toLowerCase()],
      });
      setTagInput('');
    }
  };

  // Handle remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    setNewThread({
      ...newThread,
      tags: newThread.tags.filter(tag => tag !== tagToRemove),
    });
  };

  // Handle like/unlike thread
  const handleLikeThread = async (e: React.MouseEvent, threadId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please login to like threads');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/forum/${threadId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setThreads(prevThreads =>
          prevThreads.map(thread =>
            thread._id === threadId
              ? {
                  ...thread,
                  likes: data.data.isLiked
                    ? [...(thread.likes || []), user._id]
                    : (thread.likes || []).filter((userId: string) => userId !== user._id)
                }
              : thread
          )
        );

        // Also update selectedThread if viewing in modal
        if (selectedThread && selectedThread._id === threadId) {
          setSelectedThread(prev => prev ? {
            ...prev,
            likes: data.data.isLiked
              ? [...(prev.likes || []), user._id]
              : (prev.likes || []).filter((userId: string) => userId !== user._id)
          } : null);
        }

        toast.success(data.data.isLiked ? 'Thread liked!' : 'Thread unliked');
      }
    } catch (err) {
      console.error('Error liking thread:', err);
      toast.error('Failed to like thread');
    }
  };

  // Handle post reply
  const handlePostReply = async () => {
    if (!user) {
      toast.error('Please login to post a reply');
      return;
    }

    if (!newReply.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    if (!selectedThread) {
      toast.error('No thread selected');
      return;
    }

    try {
      setSubmittingReply(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/forum/${selectedThread._id}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newReply,
          parentReplyId: replyingToId || null
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Reply posted successfully!');
        setNewReply('');
        setReplyingToId(null);
        setReplyingToAuthor(null);
        // Refresh thread details to show new reply
        fetchThreadDetails(selectedThread._id);
        // Update reply count in threads list
        setThreads(prev => prev.map(t =>
          t._id === selectedThread._id
            ? { ...t, replyCount: (t.replyCount || 0) + 1 }
            : t
        ));
      } else {
        toast.error(data.error || 'Failed to post reply');
      }
    } catch (err) {
      console.error('Error posting reply:', err);
      toast.error('Failed to post reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Handle start editing reply
  const handleStartEditReply = (reply: Reply) => {
    setEditingReplyId(reply._id);
    setEditedReplyContent(reply.content);
    setOpenReplyMenu(null);
  };

  // Handle cancel edit reply
  const handleCancelEditReply = () => {
    setEditingReplyId(null);
    setEditedReplyContent('');
  };

  // Handle save edited reply
  const handleSaveEditReply = async (replyId: string) => {
    if (!editedReplyContent.trim()) {
      toast.error('Reply content cannot be empty');
      return;
    }

    if (!selectedThread) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/forum/${selectedThread._id}/replies/${replyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: editedReplyContent }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Reply updated successfully!');
        setEditingReplyId(null);
        setEditedReplyContent('');
        fetchThreadDetails(selectedThread._id);
      } else {
        toast.error(data.error || 'Failed to update reply');
      }
    } catch (err) {
      console.error('Error updating reply:', err);
      toast.error('Failed to update reply');
    }
  };

  // Handle delete reply click
  const handleDeleteReplyClick = (replyId: string) => {
    setReplyToDelete(replyId);
    setShowDeleteModal(true);
    setOpenReplyMenu(null);
  };

  // Confirm delete reply
  const confirmDeleteReply = async () => {
    if (!replyToDelete || !selectedThread) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/forum/${selectedThread._id}/replies/${replyToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Reply deleted successfully!');
        fetchThreadDetails(selectedThread._id);
        // Update reply count in threads list
        setThreads(prev => prev.map(t =>
          t._id === selectedThread._id
            ? { ...t, replyCount: Math.max((t.replyCount || 0) - 1, 0) }
            : t
        ));
      } else {
        toast.error(data.error || 'Failed to delete reply');
      }
    } catch (err) {
      console.error('Error deleting reply:', err);
      toast.error('Failed to delete reply');
    } finally {
      setShowDeleteModal(false);
      setReplyToDelete(null);
    }
  };

  // Handle like/unlike reply
  const handleLikeReply = async (replyId: string) => {
    if (!user) {
      toast.error('Please login to like replies');
      return;
    }

    if (!selectedThread) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/forum/${selectedThread._id}/replies/${replyId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        // Update the reply likes in selectedThread
        setSelectedThread(prev => {
          if (!prev) return null;
          return {
            ...prev,
            replies: prev.replies?.map(reply =>
              reply._id === replyId
                ? {
                    ...reply,
                    likes: data.data.isLiked
                      ? [...(reply.likes || []), user._id]
                      : (reply.likes || []).filter(id => id !== user._id)
                  }
                : reply
            )
          };
        });
      } else {
        toast.error(data.error || 'Failed to like reply');
      }
    } catch (err) {
      console.error('Error liking reply:', err);
      toast.error('Failed to like reply');
    }
  };

  // Handle reply to specific comment
  // If replying to a nested reply, we flatten it to use the original parent as parentReplyId
  const handleReplyToComment = (reply: Reply, authorName: string) => {
    if (!user) {
      toast.error('Please login to reply');
      return;
    }
    // If this reply already has a parent (it's nested), use that parent instead
    // This keeps all replies at one level of nesting (like Facebook)
    const parentId = reply.parentReplyId ? String(reply.parentReplyId) : reply._id;

    // Track which reply we're responding to
    setReplyingToId(parentId);
    setReplyingToAuthor(authorName);
    // Pre-fill reply with @mention
    setNewReply(`@${authorName} `);
    // Focus on the reply textarea (scroll to it)
    const replyTextarea = document.querySelector('textarea[placeholder="Share your thoughts..."]');
    if (replyTextarea) {
      (replyTextarea as HTMLTextAreaElement).focus();
    }
  };

  // Cancel replying to a specific comment
  const handleCancelReplyTo = () => {
    setReplyingToId(null);
    setReplyingToAuthor(null);
    setNewReply('');
  };

  // Toggle expanded replies for a parent
  const toggleExpandReplies = (replyId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(replyId)) {
        newSet.delete(replyId);
      } else {
        newSet.add(replyId);
      }
      return newSet;
    });
  };

  // Handle load more threads
  const handleLoadMore = () => {
    if (page < totalPages) {
      fetchThreads(page + 1, true);
    }
  };

  // Handle category selection
  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(categoryName);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return diffMins <= 1 ? 'just now' : `${diffMins}m ago`;
      }
      return `${diffHours}h ago`;
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

  // Organize replies into parent-child structure
  const organizeReplies = (replies: Reply[]) => {
    const parentReplies: Reply[] = [];
    const childRepliesMap: { [key: string]: Reply[] } = {};

    replies.forEach(reply => {
      // Convert parentReplyId to string for proper comparison (MongoDB ObjectIds)
      const parentId = reply.parentReplyId ? String(reply.parentReplyId) : null;
      if (!parentId) {
        parentReplies.push(reply);
      } else {
        if (!childRepliesMap[parentId]) {
          childRepliesMap[parentId] = [];
        }
        childRepliesMap[parentId].push(reply);
      }
    });

    return { parentReplies, childRepliesMap };
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center">
                <ChatBubbleLeftRightIcon className="h-8 w-8 mr-3" />
                Community Forum
              </h1>
              <p className="mt-3 text-lg text-primary-100">
                Connect, share, and learn from fellow Sign Company owners
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
              {user && (
                <button
                  className={`inline-flex items-center px-4 py-2 font-medium rounded-lg transition-colors duration-200 ${
                    showMyThreads
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                  onClick={() => {
                    setShowMyThreads(!showMyThreads);
                    if (!showMyThreads) {
                      fetchMyThreads();
                    }
                  }}
                >
                  <UserIcon className="h-5 w-5 mr-2" />
                  My Threads
                </button>
              )}
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-white text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors duration-200"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                New Thread
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
            {stats.totalThreads.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Threads</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <ChatBubbleLeftIcon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {stats.totalReplies.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Replies</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <ClockIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {stats.todayThreads.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Today's Threads</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <UserGroupIcon className="h-8 w-8 text-purple-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {stats.activeMembers.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Active Members</p>
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
                placeholder="Search threads, topics, or users..."
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
                { value: 'latest', label: 'Latest' },
                { value: 'hot', label: 'Most Active' },
                { value: 'top', label: 'Most Liked' },
                { value: 'unanswered', label: 'Unanswered' },
              ]}
            />
          </div>
        </form>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sticky top-20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Categories</h3>
            <nav className="space-y-2">
              {forumCategories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => handleCategoryClick(category.name)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg flex items-center justify-between transition-all duration-200 ${
                    selectedCategory === category.name
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium border-l-4 border-primary-600 dark:border-primary-500'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <span>{category.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Trending Tags */}
          {stats.trendingTags.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <TagIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                Trending Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {stats.trendingTags.map((tag) => (
                  <button
                    key={tag.name}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    #{tag.name}
                    <span className="ml-1 text-gray-500 dark:text-gray-400">({tag.count})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Thread List */}
        <div className="lg:col-span-3 space-y-6">
          {/* My Threads Section */}
          {showMyThreads && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                  <UserIcon className="h-5 w-5 mr-2 text-primary-600" />
                  My Threads
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Manage your forum discussions
                </p>
              </div>
              <div className="p-6">
                {loadingMyThreads ? (
                  <div className="flex items-center justify-center py-8">
                    <ArrowPathIcon className="h-8 w-8 text-primary-600 animate-spin" />
                  </div>
                ) : myThreads.length === 0 ? (
                  <div className="text-center py-8">
                    <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">You haven't created any threads yet.</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Create Your First Thread
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myThreads.map((thread) => (
                      <div
                        key={thread._id}
                        className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleOpenThread(thread)}>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                              {thread.title}
                            </h4>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              thread.status === 'active'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }`}>
                              {thread.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(thread.createdAt)} • {thread.views} views • {thread.replyCount} replies • {thread.likes?.length || 0} likes
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditThread(thread);
                            }}
                            className="p-2 text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteThread(thread._id);
                            }}
                            disabled={deletingThreadId === thread._id}
                            className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingThreadId === thread._id ? (
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
          {loading && !showMyThreads && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <ArrowPathIcon className="h-12 w-12 text-primary-600 dark:text-primary-400 animate-spin" />
                <p className="text-gray-600 dark:text-gray-400">Loading threads...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && !showMyThreads && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 flex items-start space-x-3">
              <ExclamationCircleIcon className="h-6 w-6 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error loading threads</h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
                <button
                  onClick={() => fetchThreads()}
                  className="mt-3 inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && threads.length === 0 && !showMyThreads && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
              <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No threads found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Be the first to start a discussion!</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create First Thread
              </button>
            </div>
          )}

          {/* Threads List */}
          {!loading && !error && threads.length > 0 && (
            <>
              {showMyThreads && (
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6">All Forum Threads</h3>
              )}
              {threads.map((thread) => (
                <article
                  key={thread._id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => handleOpenThread(thread)}
                >
                  <div className="p-6">
                    {/* Thread Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold">
                          {getInitials(thread.author?.name || 'Unknown')}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {thread.author?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {thread.author?.role || 'Member'} • {formatDate(thread.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Edit/Delete buttons for own threads */}
                        {canEditItem('forum', thread.author?._id) && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditThread(thread);
                              }}
                              className="p-1.5 text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteThread(thread._id);
                              }}
                              disabled={deletingThreadId === thread._id}
                              className="p-1.5 text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              {deletingThreadId === thread._id ? (
                                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                              ) : (
                                <TrashIcon className="h-4 w-4" />
                              )}
                            </button>
                          </>
                        )}
                        {thread.isPinned && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                            <FireIcon className="h-3 w-3 mr-1" />
                            Pinned
                          </span>
                        )}
                        {thread.isLocked && (
                          <LockSolidIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        )}
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 capitalize">
                          {thread.category}
                        </span>
                      </div>
                    </div>

                    {/* Thread Content */}
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 hover:text-primary-600 dark:hover:text-primary-400 transition-colors line-clamp-2">
                      {thread.title}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {thread.content}
                    </p>

                    {/* Tags */}
                    {thread.tags && thread.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        {thread.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                          >
                            #{tag}
                          </span>
                        ))}
                        {thread.tags.length > 4 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            +{thread.tags.length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Facebook-style Image Grid */}
                    {thread.images && thread.images.length > 0 && (
                      <div className="mb-4 -mx-6">
                        {thread.images.length === 1 && (
                          <img
                            src={thread.images[0]}
                            alt={thread.title}
                            className="w-full h-64 object-cover"
                          />
                        )}
                        {thread.images.length === 2 && (
                          <div className="grid grid-cols-2 gap-0.5">
                            {thread.images.map((image, index) => (
                              <img
                                key={index}
                                src={image}
                                alt={`${thread.title} - ${index + 1}`}
                                className="w-full h-48 object-cover"
                              />
                            ))}
                          </div>
                        )}
                        {thread.images.length === 3 && (
                          <div className="grid grid-cols-2 gap-0.5">
                            <img
                              src={thread.images[0]}
                              alt={`${thread.title} - 1`}
                              className="w-full h-48 object-cover row-span-2"
                            />
                            <img
                              src={thread.images[1]}
                              alt={`${thread.title} - 2`}
                              className="w-full h-24 object-cover"
                            />
                            <img
                              src={thread.images[2]}
                              alt={`${thread.title} - 3`}
                              className="w-full h-24 object-cover"
                            />
                          </div>
                        )}
                        {thread.images.length === 4 && (
                          <div className="grid grid-cols-2 gap-0.5">
                            {thread.images.map((image, index) => (
                              <img
                                key={index}
                                src={image}
                                alt={`${thread.title} - ${index + 1}`}
                                className="w-full h-32 object-cover"
                              />
                            ))}
                          </div>
                        )}
                        {thread.images.length >= 5 && (
                          <div className="flex flex-col gap-0.5">
                            {/* Top row - 2 large images */}
                            <div className="grid grid-cols-2 gap-0.5">
                              {thread.images.slice(0, 2).map((image, index) => (
                                <img
                                  key={index}
                                  src={image}
                                  alt={`${thread.title} - ${index + 1}`}
                                  className="w-full h-40 object-cover"
                                />
                              ))}
                            </div>
                            {/* Bottom row - 3 smaller images */}
                            <div className="grid grid-cols-3 gap-0.5">
                              {thread.images.slice(2, 5).map((image, index) => (
                                <div key={index} className="relative">
                                  <img
                                    src={image}
                                    alt={`${thread.title} - ${index + 3}`}
                                    className="w-full h-28 object-cover"
                                  />
                                  {/* Show +X overlay on the last image if there are more */}
                                  {index === 2 && thread.images!.length > 5 && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                      <span className="text-white text-2xl font-semibold">
                                        +{thread.images!.length - 5}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Thread Stats */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex flex-wrap items-center gap-4">
                        <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm">
                          <EyeIcon className="h-5 w-5" />
                          {(thread.views || 0).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm">
                          <ChatBubbleLeftIcon className="h-5 w-5" />
                          {thread.replyCount || 0}
                        </span>
                        <button
                          onClick={(e) => handleLikeThread(e, thread._id)}
                          className={`flex items-center gap-1 transition-colors text-sm ${
                            user && thread.likes?.includes(user._id)
                              ? 'text-red-500 hover:text-red-600'
                              : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
                          }`}
                        >
                          {user && thread.likes?.includes(user._id) ? (
                            <HeartSolidIcon className="h-5 w-5" />
                          ) : (
                            <HeartIcon className="h-5 w-5" />
                          )}
                          {thread.likes?.length || 0}
                        </button>
                      </div>
                      {thread.lastReply && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Last reply by <span className="font-medium text-gray-700 dark:text-gray-300">{thread.lastReply.author}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              ))}

              {/* Load More */}
              {page < totalPages && (
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
                        Load More Threads
                        <span className="ml-2 text-sm">
                          ({threads.length} of {stats.totalThreads})
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

      {/* Create Thread Modal */}
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
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Create New Thread</h3>
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
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">Please log in to create a thread.</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={newThread.title}
                  onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
                  placeholder="Enter a descriptive title for your thread"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  maxLength={200}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {newThread.title.length}/200 characters
                </p>
              </div>

              <div>
                <CustomSelect
                  label="Category"
                  required
                  value={newThread.category}
                  onChange={(value) => setNewThread({ ...newThread, category: value })}
                  options={[
                    { value: 'general', label: 'General Discussion' },
                    { value: 'technical', label: 'Technical Support' },
                    { value: 'marketing', label: 'Marketing & Sales' },
                    { value: 'operations', label: 'Operations' },
                    { value: 'equipment', label: 'Equipment' },
                    { value: 'suppliers', label: 'Suppliers' },
                    { value: 'help', label: 'Help & Questions' },
                    { value: 'announcements', label: 'Announcements' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content *
                </label>
                <textarea
                  value={newThread.content}
                  onChange={(e) => setNewThread({ ...newThread, content: e.target.value })}
                  placeholder="Write your thread content here... Be as detailed as possible to get better responses."
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                />
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
                {/* Suggested tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Suggestions:</span>
                  {['vinyl', 'signage', 'printing', 'installation', 'design', 'led', 'vehicle-wrap', 'banner', 'neon', 'channel-letters'].map((suggestedTag) => (
                    <button
                      key={suggestedTag}
                      type="button"
                      onClick={() => {
                        if (!newThread.tags.includes(suggestedTag)) {
                          setNewThread({
                            ...newThread,
                            tags: [...newThread.tags, suggestedTag],
                          });
                        }
                      }}
                      disabled={newThread.tags.includes(suggestedTag)}
                      className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                        newThread.tags.includes(suggestedTag)
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400'
                      }`}
                    >
                      #{suggestedTag}
                    </button>
                  ))}
                </div>
                {newThread.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {newThread.tags.map((tag) => (
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

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Images (Optional)
                </label>
                <div className="space-y-3">
                  {/* Image previews */}
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload button */}
                  {selectedImages.length < 5 && (
                    <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary-500 dark:hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <PhotoIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedImages.length === 0 ? 'Add images' : `Add more (${5 - selectedImages.length} remaining)`}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Max 5 images, 10MB each. Supported: JPG, PNG, GIF, WebP
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedImages([]);
                  setImagePreviews([]);
                }}
                className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateThread}
                disabled={submitting || !newThread.title.trim() || !newThread.content.trim() || !user}
                className="flex-1 py-3 px-4 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="h-5 w-5" />
                    Create Thread
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thread Detail Modal */}
      {showDetailModal && selectedThread && (
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
                  {getInitials(selectedThread.author?.name || 'Unknown')}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedThread.author?.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(selectedThread.createdAt)}</p>
                </div>
              </div>
              <button
                onClick={handleCloseDetail}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {loadingThread ? (
              <div className="flex items-center justify-center py-12">
                <ArrowPathIcon className="h-8 w-8 text-primary-600 animate-spin" />
              </div>
            ) : (
              <div className="p-6">
                {/* Category and Status */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 capitalize">
                    {selectedThread.category}
                  </span>
                  {selectedThread.isPinned && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                      <FireIcon className="h-3 w-3 mr-1" />
                      Pinned
                    </span>
                  )}
                  {selectedThread.isLocked && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                      <LockSolidIcon className="h-3 w-3 mr-1" />
                      Locked
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  {selectedThread.title}
                </h2>

                {/* Tags */}
                {selectedThread.tags && selectedThread.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedThread.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Content */}
                <div className="prose dark:prose-invert max-w-none mb-6">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {selectedThread.content}
                  </p>
                </div>

                {/* Images */}
                {selectedThread.images && selectedThread.images.length > 0 && (
                  <div className="mb-6">
                    <div className={`grid gap-3 ${selectedThread.images.length === 1 ? 'grid-cols-1' : selectedThread.images.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
                      {selectedThread.images.map((image, index) => (
                        <a
                          key={index}
                          href={image}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img
                            src={image}
                            alt={`Thread image ${index + 1}`}
                            className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-600 hover:opacity-90 transition-opacity cursor-pointer"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={(e) => handleLikeThread(e, selectedThread._id)}
                    className={`flex items-center gap-2 transition-colors ${
                      user && selectedThread.likes?.includes(user._id)
                        ? 'text-red-500 hover:text-red-600'
                        : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
                    }`}
                  >
                    {user && selectedThread.likes?.includes(user._id) ? (
                      <HeartSolidIcon className="h-6 w-6" />
                    ) : (
                      <HeartIcon className="h-6 w-6" />
                    )}
                    <span className="font-medium">{selectedThread.likes?.length || 0} likes</span>
                  </button>
                  <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <ChatBubbleLeftIcon className="h-6 w-6" />
                    <span className="font-medium">{selectedThread.replies?.length || selectedThread.replyCount || 0} replies</span>
                  </span>
                  <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <EyeIcon className="h-6 w-6" />
                    <span className="font-medium">{selectedThread.views || 0} views</span>
                  </span>
                </div>

                {/* Replies Section */}
                {selectedThread.replies && selectedThread.replies.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Replies ({selectedThread.replies.length})
                    </h4>
                    <div className="space-y-4">
                      {(() => {
                        const { parentReplies, childRepliesMap } = organizeReplies(selectedThread.replies || []);

                        const renderReply = (reply: Reply, isNested: boolean = false, isLast: boolean = false) => (
                          <div key={reply._id} className="relative">
                            {/* Curved connector line for nested replies - connects to avatar center */}
                            {isNested && (
                              <div className="absolute left-0 top-0 h-4 w-6">
                                <div className="absolute left-0 top-0 h-full w-4 border-l-2 border-b-2 border-gray-300 dark:border-gray-600 rounded-bl-xl" />
                              </div>
                            )}
                            {/* Vertical continuation line for non-last nested items */}
                            {isNested && !isLast && (
                              <div className="absolute left-0 top-4 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600" />
                            )}
                            <div className={`${isNested ? 'ml-6' : ''}`}>
                              <div className="flex items-start gap-3">
                                <div className={`${isNested ? 'h-7 w-7 text-xs' : 'h-8 w-8 text-sm'} rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center text-white font-semibold flex-shrink-0`}>
                                  {getInitials(reply.author?.name || 'Unknown')}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                        {reply.author?.name || 'Unknown'}
                                      </span>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatDate(reply.createdAt)}
                                      </span>
                                    </div>
                                    {/* 3-dot menu - show for reply author or admin */}
                                    {user && (user._id === reply.author?._id || user.role === 'admin') && (
                                      <div className="relative">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenReplyMenu(openReplyMenu === reply._id ? null : reply._id);
                                          }}
                                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                        >
                                          <EllipsisVerticalIcon className="h-5 w-5" />
                                        </button>
                                        {/* Dropdown menu */}
                                        {openReplyMenu === reply._id && (
                                          <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleStartEditReply(reply);
                                              }}
                                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                            >
                                              <PencilIcon className="h-4 w-4" />
                                              Edit
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteReplyClick(reply._id);
                                              }}
                                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            >
                                              <TrashIcon className="h-4 w-4" />
                                              Delete
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  {/* Show edit form or content */}
                                  {editingReplyId === reply._id ? (
                                    <div className="space-y-2">
                                      <textarea
                                        value={editedReplyContent}
                                        onChange={(e) => setEditedReplyContent(e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                                      />
                                      <div className="flex justify-end gap-2">
                                        <button
                                          onClick={handleCancelEditReply}
                                          className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          onClick={() => handleSaveEditReply(reply._id)}
                                          className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                                        >
                                          Save
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
                                        {reply.content}
                                      </p>
                                      {/* Reply actions - like and reply buttons */}
                                      <div className="flex items-center gap-4 mt-2 text-xs">
                                        <span className="text-gray-500 dark:text-gray-400">{formatDate(reply.createdAt)}</span>
                                        <button
                                          onClick={() => handleLikeReply(reply._id)}
                                          className={`font-medium transition-colors ${
                                            user && reply.likes?.includes(user._id)
                                              ? 'text-red-500 hover:text-red-600'
                                              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                          }`}
                                        >
                                          Like{reply.likes && reply.likes.length > 0 ? ` (${reply.likes.length})` : ''}
                                        </button>
                                        {!selectedThread.isLocked && (
                                          <button
                                            onClick={() => handleReplyToComment(reply, reply.author?.name || 'Unknown')}
                                            className="font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                          >
                                            Reply
                                          </button>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            {/* Show "View X replies" or expanded child replies */}
                            {!isNested && childRepliesMap[String(reply._id)] && childRepliesMap[String(reply._id)].length > 0 && (
                              <div className="mt-2 ml-4">
                                {!expandedReplies.has(reply._id) ? (
                                  <button
                                    onClick={() => toggleExpandReplies(reply._id)}
                                    className="relative flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors pl-6"
                                  >
                                    {/* Curved connector to button */}
                                    <div className="absolute left-0 top-0 h-3 w-4 border-l-2 border-b-2 border-gray-300 dark:border-gray-600 rounded-bl-xl" />
                                    View {childRepliesMap[String(reply._id)].length} {childRepliesMap[String(reply._id)].length === 1 ? 'reply' : 'replies'}
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => toggleExpandReplies(reply._id)}
                                      className="relative flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-3 pl-6"
                                    >
                                      {/* Curved connector to button */}
                                      <div className="absolute left-0 top-0 h-3 w-4 border-l-2 border-b-2 border-gray-300 dark:border-gray-600 rounded-bl-xl" />
                                      Hide replies
                                    </button>
                                    <div className="space-y-2">
                                      {childRepliesMap[String(reply._id)].map((childReply, index, arr) =>
                                        renderReply(childReply, true, index === arr.length - 1)
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );

                        return parentReplies.map(reply => renderReply(reply, false));
                      })()}
                    </div>
                  </div>
                )}

                {/* Add Reply */}
                {!selectedThread.isLocked && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Add a Reply</h4>
                    {/* Show replying indicator */}
                    {replyingToId && replyingToAuthor && (
                      <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg">
                        <ArrowUturnLeftIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                        <span className="text-sm text-primary-700 dark:text-primary-300">
                          Replying to <span className="font-medium">{replyingToAuthor}</span>
                        </span>
                        <button
                          onClick={handleCancelReplyTo}
                          className="ml-auto p-1 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-800/30 rounded transition-colors"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {user ? getInitials(user.name) : '?'}
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={newReply}
                          onChange={(e) => setNewReply(e.target.value)}
                          placeholder={user ? "Share your thoughts..." : "Please log in to reply"}
                          disabled={!user}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={handlePostReply}
                            disabled={submittingReply || !newReply.trim() || !user}
                            className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {submittingReply ? (
                              <>
                                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                Posting...
                              </>
                            ) : (
                              <>
                                <PaperAirplaneIcon className="h-4 w-4" />
                                Post Reply
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedThread.isLocked && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-center">
                      <LockSolidIcon className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm">This thread is locked. No new replies can be added.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Thread Modal */}
      {showEditThreadModal && editingThread && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm dark:bg-opacity-70 flex items-center justify-center p-4 z-50"
          onClick={() => setShowEditThreadModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Edit Thread</h3>
              <button
                onClick={() => setShowEditThreadModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={editThreadData.title}
                  onChange={(e) => setEditThreadData({ ...editThreadData, title: e.target.value })}
                  placeholder="Enter a descriptive title for your thread"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  maxLength={200}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {editThreadData.title.length}/200 characters
                </p>
              </div>

              <div>
                <CustomSelect
                  label="Category"
                  required
                  value={editThreadData.category}
                  onChange={(value) => setEditThreadData({ ...editThreadData, category: value })}
                  options={[
                    { value: 'general', label: 'General Discussion' },
                    { value: 'technical', label: 'Technical Support' },
                    { value: 'marketing', label: 'Marketing & Sales' },
                    { value: 'operations', label: 'Operations' },
                    { value: 'equipment', label: 'Equipment' },
                    { value: 'suppliers', label: 'Suppliers' },
                    { value: 'help', label: 'Help & Questions' },
                    { value: 'announcements', label: 'Announcements' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content *
                </label>
                <textarea
                  value={editThreadData.content}
                  onChange={(e) => setEditThreadData({ ...editThreadData, content: e.target.value })}
                  placeholder="Write your thread content here..."
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                />
              </div>

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
                        handleAddEditThreadTag();
                      }
                    }}
                    placeholder="Type a tag and press Enter"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddEditThreadTag}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  >
                    Add
                  </button>
                </div>
                {editThreadData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {editThreadData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveEditThreadTag(tag)}
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
                onClick={() => setShowEditThreadModal(false)}
                className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateThread}
                disabled={updatingThread || !editThreadData.title.trim() || !editThreadData.content.trim()}
                className="flex-1 py-3 px-4 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {updatingThread ? (
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

      {/* Delete Reply Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm dark:bg-opacity-70 flex items-center justify-center p-4 z-50"
          onClick={() => {
            setShowDeleteModal(false);
            setReplyToDelete(null);
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 pb-4">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30">
                <ExclamationCircleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center">
                Delete Reply
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                Are you sure you want to delete this reply? This action cannot be undone.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-6 pt-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setReplyToDelete(null);
                }}
                className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteReply}
                className="flex-1 py-2.5 px-4 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forum;
