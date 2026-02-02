import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePreviewMode } from '../context/PreviewModeContext';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';
import socketService from '../services/socketService';
import {
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  BookmarkIcon,
  FlagIcon,
  ShareIcon,
  BellIcon,
  EllipsisHorizontalIcon,
  ChatBubbleLeftIcon,
  HeartIcon,
  EyeIcon,
  CalendarIcon,
  TagIcon,
  LockClosedIcon,
  FireIcon,
  PaperClipIcon,
  PhotoIcon,
  FaceSmileIcon,
} from '@heroicons/react/24/outline';
import {
  BookmarkIcon as BookmarkSolidIcon,
  HeartIcon as HeartSolidIcon,
  ChevronUpIcon as ChevronUpSolidIcon,
  ChevronDownIcon as ChevronDownSolidIcon,
} from '@heroicons/react/24/solid';
import CustomSelect from '../components/CustomSelect';

interface Reply {
  id: number;
  author: string;
  authorAvatar: string;
  authorRole: string;
  content: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
  votes: number;
  userVote: 'up' | 'down' | null;
  replies?: Reply[];
  attachments?: {
    name: string;
    size: string;
    type: string;
  }[];
}

interface ThreadData {
  id: number;
  title: string;
  author: string;
  authorAvatar: string;
  authorRole: string;
  category: string;
  subcategory?: string;
  createdAt: string;
  lastActivity: string;
  content: string;
  views: number;
  replies: number;
  likes: number;
  isPinned: boolean;
  isLocked: boolean;
  isBookmarked: boolean;
  isSubscribed: boolean;
  tags: string[];
  attachments?: {
    name: string;
    size: string;
    type: string;
  }[];
}

const mockThread: ThreadData = {
  id: 1,
  title: "New vinyl cutting techniques that increased our efficiency by 40%",
  author: "David Martinez",
  authorAvatar: "DM",
  authorRole: "Owner - 5 years",
  category: "Technical Support",
  subcategory: "Equipment",
  createdAt: "January 15, 2024 at 2:30 PM",
  lastActivity: "5 minutes ago",
  content: `Hey everyone! I wanted to share some new techniques we've been using that have dramatically improved our vinyl cutting efficiency.

## The Problem
We were spending way too much time on weeding and application, especially for complex designs. Our team was getting frustrated, and jobs were backing up.

## What We Changed

### 1. **Blade Pressure Optimization**
We created a pressure chart for different vinyl types:
- **Oracal 651**: 120g pressure, 60° blade
- **3M IJ35C**: 100g pressure, 45° blade  
- **Avery Supreme**: 110g pressure, 60° blade

### 2. **Weeding Station Setup**
We built a dedicated weeding station with:
- LED light table (game changer!)
- Ergonomic seating at proper height
- All tools within arm's reach
- Magnifying lamp for detailed work

### 3. **Pre-Cut Preparation**
Before cutting, we now:
- Let vinyl acclimate to room temperature (minimum 2 hours)
- Clean the cutting mat religiously
- Run a test cut on scrap material
- Check blade sharpness every morning

## The Results
- **40% faster weeding time** on average
- **60% reduction in material waste**
- **Team morale improved significantly**
- **Customer complaints about bubbles/lifting down 80%**

## Pro Tips
1. 🎯 Always keep spare blades on hand - change them more often than you think
2. 🌡️ Temperature matters! Keep your workspace between 65-75°F
3. 📐 Use a weeding box technique for intricate designs
4. 💡 Good lighting is worth the investment

Happy to answer any questions about our setup or techniques. What efficiency improvements have you guys discovered?

**Edit**: Wow, thanks for all the responses! I'll try to answer everyone's questions below.`,
  views: 1234,
  replies: 45,
  likes: 89,
  isPinned: true,
  isLocked: false,
  isBookmarked: false,
  isSubscribed: true,
  tags: ["vinyl", "efficiency", "tips", "equipment"],
  attachments: [
    { name: "pressure-chart.pdf", size: "245 KB", type: "pdf" },
    { name: "weeding-station-setup.jpg", size: "1.2 MB", type: "image" }
  ]
};

const mockReplies: Reply[] = [
  {
    id: 1,
    author: "Sarah Chen",
    authorAvatar: "SC",
    authorRole: "Owner - 8 years",
    content: `This is fantastic, David! We've been struggling with the same issues. The LED light table tip is gold - just ordered one.

Question about the blade pressure: do you adjust for different thicknesses of the same vinyl brand? We use a lot of Oracal 651 but in different mil thicknesses.`,
    createdAt: "3 hours ago",
    likes: 12,
    isLiked: false,
    votes: 8,
    userVote: null,
    replies: [
      {
        id: 2,
        author: "David Martinez",
        authorAvatar: "DM",
        authorRole: "Owner - 5 years",
        content: `Great question, Sarah! Yes, we definitely adjust:
- 2.5 mil: 120g
- 3.2 mil: 130g
- 4 mil: 140-150g

The key is doing test cuts. We keep a binder with samples and settings for quick reference.`,
        createdAt: "2 hours ago",
        likes: 8,
        isLiked: true,
        votes: 5,
        userVote: 'up'
      }
    ]
  },
  {
    id: 3,
    author: "Mike Johnson",
    authorAvatar: "MJ",
    authorRole: "Production Manager - 3 years",
    content: `The weeding box technique you mentioned - can you elaborate? We're always looking for ways to handle intricate designs better.

Also, what brand of LED light table did you go with? There are so many options out there.`,
    createdAt: "2 hours ago",
    likes: 6,
    isLiked: false,
    votes: 4,
    userVote: null
  },
  {
    id: 4,
    author: "Lisa Thompson",
    authorAvatar: "LT",
    authorRole: "Owner - 10 years",
    content: `This is why I love this community! 🙌

We implemented something similar last year and saw huge improvements. One thing to add: we also started using a vinyl storage system with humidity control. Made a big difference in consistency.

For anyone on the fence about investing in better equipment - DO IT. The ROI is real.`,
    createdAt: "1 hour ago",
    likes: 15,
    isLiked: true,
    votes: 12,
    userVote: 'up',
    attachments: [
      { name: "storage-system.jpg", size: "890 KB", type: "image" }
    ]
  }
];

const ForumThread = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getEffectiveRole } = usePreviewMode();
  const toast = useToast();
  const effectiveRole = getEffectiveRole();

  const [thread, setThread] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('oldest');
  const [expandedReplies, setExpandedReplies] = useState<number[]>([]);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedThread, setEditedThread] = useState({
    title: '',
    content: '',
    category: '',
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editedReplyContent, setEditedReplyContent] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'thread' | 'reply'; id?: string } | null>(null);
  const [showThreadMenu, setShowThreadMenu] = useState(false);

  // Fetch thread data
  useEffect(() => {
    fetchThread();
  }, [id]);

  // Socket.io real-time updates for thread
  useEffect(() => {
    if (!id) return;

    // Connect to socket and join thread room
    socketService.connect();
    socketService.joinRoom('forum');
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('join:thread', id);
    }

    // Handle new reply event
    const handleNewReply = (data: { threadId: string; reply: any; replyCount: number }) => {
      if (data.threadId === id) {
        setThread(prev => {
          if (!prev) return prev;
          // Check if reply already exists
          if (prev.replies?.some((r: any) => r._id === data.reply._id)) {
            return prev;
          }
          return {
            ...prev,
            replies: [...(prev.replies || []), data.reply]
          };
        });
      }
    };

    // Handle thread like event
    const handleThreadLike = (data: { threadId: string; likesCount: number; userId: string; isLiked: boolean }) => {
      if (data.threadId === id) {
        setThread(prev => {
          if (!prev) return prev;
          const currentLikes = prev.likes || [];
          const newLikes = data.isLiked
            ? [...currentLikes, data.userId]
            : currentLikes.filter((l: string) => l !== data.userId);
          return { ...prev, likes: newLikes };
        });
      }
    };

    // Handle reply like event
    const handleReplyLike = (data: { threadId: string; replyId: string; likesCount: number; userId: string; isLiked: boolean }) => {
      if (data.threadId === id) {
        setThread(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            replies: prev.replies?.map((reply: any) =>
              reply._id === data.replyId
                ? {
                    ...reply,
                    likes: data.isLiked
                      ? [...(reply.likes || []), data.userId]
                      : (reply.likes || []).filter((l: string) => l !== data.userId)
                  }
                : reply
            )
          };
        });
      }
    };

    // Subscribe to events
    socketService.on('thread:reply', handleNewReply);
    socketService.on('thread:like', handleThreadLike);
    socketService.on('reply:like', handleReplyLike);

    // Cleanup on unmount
    return () => {
      socketService.off('thread:reply', handleNewReply);
      socketService.off('thread:like', handleThreadLike);
      socketService.off('reply:like', handleReplyLike);
      if (socket) {
        socket.emit('leave:thread', id);
      }
      socketService.leaveRoom('forum');
    };
  }, [id]);

  const fetchThread = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/forum/${id}`);
      const data = await response.json();

      if (data.success) {
        setThread(data.data);
      } else {
        toast.error('Thread not found');
        navigate('/forum');
      }
    } catch (error) {
      console.error('Error fetching thread:', error);
      toast.error('Failed to load thread');
    } finally {
      setLoading(false);
    }
  };

  // Handle like/unlike thread
  const handleLikeThread = async () => {
    if (!user) {
      toast.warning('Please login to like threads');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/forum/${id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setThread({
          ...thread,
          likes: data.data.isLiked
            ? [...(thread.likes || []), user._id]
            : (thread.likes || []).filter((userId: string) => userId !== user._id)
        });
        toast.success(data.data.isLiked ? 'Thread liked!' : 'Thread unliked');
      }
    } catch (error) {
      console.error('Error liking thread:', error);
      toast.error('Failed to like thread');
    }
  };

  // Handle subscribe/unsubscribe
  const handleSubscribe = async () => {
    if (!user) {
      toast.warning('Please login to subscribe');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/forum/${id}/subscribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setThread({
          ...thread,
          subscribers: data.data.isSubscribed
            ? [...(thread.subscribers || []), user._id]
            : (thread.subscribers || []).filter((userId: string) => userId !== user._id)
        });
        toast.success(data.data.isSubscribed ? 'Subscribed to thread' : 'Unsubscribed from thread');
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      toast.error('Failed to subscribe');
    }
  };

  // Handle post reply
  const handlePostReply = async () => {
    if (!user) {
      toast.warning('Please login to post a reply');
      return;
    }

    if (!replyContent.trim()) {
      toast.warning('Please enter a reply');
      return;
    }

    try {
      setSubmittingReply(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/forum/${id}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: replyContent }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Reply posted successfully!');
        setReplyContent('');
        setShowReplyModal(false);
        fetchThread(); // Refresh to get updated replies
      } else {
        toast.error(data.error || 'Failed to post reply');
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error('Failed to post reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Handle like/unlike reply
  const handleLikeReply = async (replyId: string) => {
    if (!user) {
      toast.warning('Please login to like replies');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/forum/${id}/replies/${replyId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        fetchThread(); // Refresh to get updated likes
      }
    } catch (error) {
      console.error('Error liking reply:', error);
      toast.error('Failed to like reply');
    }
  };

  const toggleReplyExpansion = (replyId: number) => {
    setExpandedReplies(prev =>
      prev.includes(replyId)
        ? prev.filter(id => id !== replyId)
        : [...prev, replyId]
    );
  };

  // Handle edit thread
  const handleEditThread = () => {
    setEditedThread({
      title: thread.title,
      content: thread.content,
      category: thread.category,
      tags: thread.tags || [],
    });
    setShowEditModal(true);
  };

  // Handle save edited thread
  const handleSaveEdit = async () => {
    if (!editedThread.title || !editedThread.content) {
      toast.warning('Please provide both title and content');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/forum/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editedThread),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Thread updated successfully!');
        setShowEditModal(false);
        fetchThread(); // Refresh thread data
      } else {
        toast.error(data.error || 'Failed to update thread');
      }
    } catch (error) {
      console.error('Error updating thread:', error);
      toast.error('Failed to update thread');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete thread - show confirmation modal
  const handleDeleteThread = () => {
    setDeleteTarget({ type: 'thread' });
    setShowDeleteModal(true);
  };

  // Confirm delete thread
  const confirmDeleteThread = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/forum/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Thread deleted successfully!');
        navigate('/forum');
      } else {
        toast.error(data.error || 'Failed to delete thread');
      }
    } catch (error) {
      console.error('Error deleting thread:', error);
      toast.error('Failed to delete thread');
    } finally {
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  // Handle add tag
  const handleAddTag = () => {
    if (tagInput.trim() && !editedThread.tags.includes(tagInput.trim())) {
      setEditedThread({
        ...editedThread,
        tags: [...editedThread.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  // Handle remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    setEditedThread({
      ...editedThread,
      tags: editedThread.tags.filter(tag => tag !== tagToRemove),
    });
  };

  // Handle edit reply
  const handleEditReply = (replyId: string, currentContent: string) => {
    setEditingReplyId(replyId);
    setEditedReplyContent(currentContent);
  };

  // Handle save reply edit
  const handleSaveReplyEdit = async (replyId: string) => {
    if (!editedReplyContent.trim()) {
      toast.warning('Please provide reply content');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/forum/${id}/replies/${replyId}`, {
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
        fetchThread(); // Refresh to get updated reply
      } else {
        toast.error(data.error || 'Failed to update reply');
      }
    } catch (error) {
      console.error('Error updating reply:', error);
      toast.error('Failed to update reply');
    }
  };

  // Handle cancel reply edit
  const handleCancelReplyEdit = () => {
    setEditingReplyId(null);
    setEditedReplyContent('');
  };

  // Handle delete reply - show confirmation modal
  const handleDeleteReply = (replyId: string) => {
    setDeleteTarget({ type: 'reply', id: replyId });
    setShowDeleteModal(true);
  };

  // Confirm delete reply
  const confirmDeleteReply = async (replyId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/forum/${id}/replies/${replyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Reply deleted successfully!');
        fetchThread(); // Refresh to remove deleted reply
      } else {
        toast.error(data.error || 'Failed to delete reply');
      }
    } catch (error) {
      console.error('Error deleting reply:', error);
      toast.error('Failed to delete reply');
    } finally {
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  // Handle confirm delete (for both thread and reply)
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'thread') {
      confirmDeleteThread();
    } else if (deleteTarget.type === 'reply' && deleteTarget.id) {
      confirmDeleteReply(deleteTarget.id);
    }
  };

  // Handle cancel delete
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  // Handle copy link
  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
    setShowThreadMenu(false);
  };

  // Handle pin/unpin thread (admin only)
  const handleTogglePin = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/forum/${id}/pin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setThread({ ...thread, isPinned: data.data.isPinned });
        toast.success(data.data.isPinned ? 'Thread pinned!' : 'Thread unpinned');
      } else {
        toast.error(data.error || 'Failed to toggle pin');
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast.error('Failed to toggle pin');
    }
    setShowThreadMenu(false);
  };

  // Handle lock/unlock thread (admin only)
  const handleToggleLock = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/forum/${id}/lock`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setThread({ ...thread, isLocked: data.data.isLocked });
        toast.success(data.data.isLocked ? 'Thread locked!' : 'Thread unlocked');
      } else {
        toast.error(data.error || 'Failed to toggle lock');
      }
    } catch (error) {
      console.error('Error toggling lock:', error);
      toast.error('Failed to toggle lock');
    }
    setShowThreadMenu(false);
  };

  // Handle report thread
  const handleReportThread = () => {
    toast.info('Report feature coming soon');
    setShowThreadMenu(false);
  };

  if (loading && !thread) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>

        {/* Thread Header Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              </div>
              <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
          </div>
        </div>

        {/* Thread Content Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-3">
          <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 w-4/6 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>

        {/* Replies Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="p-6 space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-600 rounded"></div>
                    <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-600 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 dark:text-gray-400">Thread not found</p>
      </div>
    );
  }

  const renderReply = (reply: any, level: number = 0) => {
    const authorName = reply.author?.name || 'Unknown User';
    const authorInitials = authorName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    const isLiked = user && reply.likes?.includes(user._id);
    const isEditing = editingReplyId === reply._id;
    const isAuthorOrAdmin = user && (reply.author?._id === user._id || effectiveRole === 'admin');
    const timeAgo = (() => {
      const seconds = Math.floor((Date.now() - new Date(reply.createdAt).getTime()) / 1000);
      if (seconds < 60) return 'just now';
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
      if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
      return `${Math.floor(seconds / 86400)}d ago`;
    })();

    return (
      <div key={reply._id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
        <div className="p-5 sm:p-6">
          <div className="flex gap-4">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                {authorInitials}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{authorName}</span>
                  <span className="text-gray-400 dark:text-gray-500">·</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{timeAgo}</span>
                  {reply.isEdited && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">edited</span>
                  )}
                </div>
                <div className="flex items-center gap-0.5">
                  {isAuthorOrAdmin && !isEditing && (
                    <>
                      <button
                        onClick={() => handleEditReply(reply._id, reply.content)}
                        className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all"
                        title="Edit"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteReply(reply._id)}
                        className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all"
                        title="Delete"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Reply Content */}
              {isEditing ? (
                <div className="space-y-3 mb-3">
                  <textarea
                    value={editedReplyContent}
                    onChange={(e) => setEditedReplyContent(e.target.value)}
                    className="w-full min-h-[100px] p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none dark:bg-gray-700 dark:text-gray-100 transition-all"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={handleCancelReplyEdit}
                      className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveReplyEdit(reply._id)}
                      disabled={!editedReplyContent.trim()}
                      className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-[15px] text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap leading-relaxed">
                  {reply.content}
                </div>
              )}

              {/* Action Buttons */}
              {!isEditing && (
                <div className="flex items-center gap-1 -ml-2">
                  <button
                    onClick={() => handleLikeReply(reply._id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
                      isLiked
                        ? 'text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                        : 'text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                    }`}
                    title="Like"
                  >
                    {isLiked ? <HeartSolidIcon className="h-4 w-4" /> : <HeartIcon className="h-4 w-4" />}
                    <span className="text-sm font-medium">{reply.likes?.length || 0}</span>
                  </button>

                  <button
                    onClick={() => {
                      setReplyContent(`@${authorName.toLowerCase().replace(/\s+/g, '')} `);
                      setShowReplyModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                    title="Reply"
                  >
                    <ChatBubbleLeftIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">Reply</span>
                  </button>

                  <button
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                    title="Share"
                  >
                    <ShareIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const authorName = thread.author?.name || 'Unknown User';
  const authorInitials = authorName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const isThreadLiked = user && thread.likes?.includes(user._id);
  const isSubscribed = user && thread.subscribers?.some((sub: any) => sub._id === user._id || sub === user._id);

  return (
    <>
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
      <div className="max-w-4xl mx-auto space-y-4 px-4 sm:px-6 lg:px-0">
      {/* Main Thread Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex gap-4">
            {/* Avatar with connecting line */}
            <div className="flex-shrink-0 flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-sm shadow-lg ring-4 ring-white dark:ring-gray-800">
                {authorInitials}
              </div>
              {/* Connecting line to replies */}
              {thread.replies?.length > 0 && (
                <div className="w-0.5 flex-1 mt-3 bg-gradient-to-b from-gray-300 dark:from-gray-600 to-transparent min-h-[40px]"></div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-gray-900 dark:text-gray-100 text-base">{authorName}</span>
                  <span className="text-gray-400 dark:text-gray-500">·</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(thread.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  {thread.isPinned && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 text-orange-700 dark:text-orange-400 text-xs font-semibold rounded-full">
                      <FireIcon className="h-3 w-3" />
                      Pinned
                    </span>
                  )}
                  {thread.isLocked && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-full">
                      <LockClosedIcon className="h-3 w-3" />
                      Locked
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-0.5">
                  {user && (thread.author?._id === user._id || effectiveRole === 'admin') && (
                    <>
                      <button
                        onClick={handleEditThread}
                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all"
                        title="Edit"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={handleDeleteThread}
                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all"
                        title="Delete"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </>
                  )}
                  {/* More Options Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowThreadMenu(!showThreadMenu)}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {showThreadMenu && (
                      <>
                        {/* Backdrop to close menu */}
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowThreadMenu(false)}
                        />
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20 overflow-hidden">
                          {/* Copy Link */}
                          <button
                            onClick={handleCopyLink}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy link
                          </button>

                          {/* Admin-only options */}
                          {effectiveRole === 'admin' && (
                            <>
                              <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                              {/* Pin/Unpin */}
                              <button
                                onClick={handleTogglePin}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <FireIcon className="h-4 w-4" />
                                {thread.isPinned ? 'Unpin thread' : 'Pin thread'}
                              </button>
                              {/* Lock/Unlock */}
                              <button
                                onClick={handleToggleLock}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <LockClosedIcon className="h-4 w-4" />
                                {thread.isLocked ? 'Unlock thread' : 'Lock thread'}
                              </button>
                            </>
                          )}

                          <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                          {/* Report */}
                          <button
                            onClick={handleReportThread}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <FlagIcon className="h-4 w-4" />
                            Report thread
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 leading-tight">{thread.title}</h1>

              {/* Post Content */}
              <div className="text-[15px] text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                {thread.content.split('\n').map((paragraph, idx) => {
                  if (paragraph.startsWith('##')) {
                    return <h2 key={idx} className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 mb-3">{paragraph.replace('## ', '')}</h2>;
                  } else if (paragraph.startsWith('###')) {
                    return <h3 key={idx} className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-4 mb-2">{paragraph.replace('### ', '')}</h3>;
                  } else if (paragraph.startsWith('-')) {
                    return <li key={idx} className="ml-6 mb-1 text-gray-700 dark:text-gray-300">{paragraph.replace('- ', '')}</li>;
                  } else if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                    return <p key={idx} className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{paragraph.replace(/\*\*/g, '')}</p>;
                  } else if (paragraph.match(/^\d+\./)) {
                    return <li key={idx} className="ml-6 mb-1 list-decimal text-gray-700 dark:text-gray-300">{paragraph.replace(/^\d+\.\s*/, '')}</li>;
                  }
                  return <p key={idx} className="mb-2 text-gray-700 dark:text-gray-300">{paragraph}</p>;
                })}
              </div>

              {/* Attachments */}
              {thread.attachments && thread.attachments.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {thread.attachments.map((attachment, idx) => (
                      <button key={idx} className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all group">
                        {attachment.type === 'image' ? (
                          <PhotoIcon className="h-4 w-4 text-primary-500 group-hover:text-primary-600" />
                        ) : (
                          <PaperClipIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                        )}
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{attachment.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {thread.tags && thread.tags.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {thread.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors cursor-pointer">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata Row */}
              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-1.5">
                  <EyeIcon className="h-4 w-4" />
                  <span>{thread.views?.toLocaleString() || 0} views</span>
                </div>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs font-medium">
                  {thread.category}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleLikeThread}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full transition-all ${
                    isThreadLiked
                      ? 'text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                      : 'text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                  }`}
                  title="Like"
                >
                  {isThreadLiked ? <HeartSolidIcon className="h-5 w-5" /> : <HeartIcon className="h-5 w-5" />}
                  <span className="text-sm font-medium">{thread.likes?.length || 0}</span>
                </button>

                <button
                  onClick={() => setShowReplyModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                  title="Reply"
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">{thread.replies?.length || 0}</span>
                </button>

                <button
                  onClick={handleSubscribe}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full transition-all ${
                    isSubscribed
                      ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30'
                      : 'text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                  }`}
                  title={isSubscribed ? 'Unsubscribe' : 'Subscribe'}
                >
                  <BellIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Replies Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <ChatBubbleLeftIcon className="h-5 w-5 text-gray-400" />
            {thread.replies?.length || 0} {thread.replies?.length === 1 ? 'Reply' : 'Replies'}
          </h3>
        </div>
        {thread.replies && thread.replies.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {thread.replies.map((reply: any) => renderReply(reply))}
          </div>
        ) : (
          <div className="p-8 sm:p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">No replies yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Be the first to share your thoughts!</p>
            <button
              onClick={() => setShowReplyModal(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-full hover:bg-primary-700 transition-colors"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4" />
              Write a Reply
            </button>
          </div>
        )}
      </div>
    </div>

      {/* Reply Modal - Enhanced Threads Style */}
      {showReplyModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm dark:bg-opacity-70 flex items-center justify-center p-4 z-50"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100dvh',
            maxHeight: '100vh',
            minHeight: '100vh',
            margin: 0,
            padding: 0,
            transform: 'translateZ(0)',
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden'
          } as React.CSSProperties}
          onClick={() => {
            setShowReplyModal(false);
            setReplyContent('');
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-xl w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowReplyModal(false);
                  setReplyContent('');
                }}
                className="text-[15px] font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                Cancel
              </button>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Reply</h3>
              <button
                onClick={handlePostReply}
                disabled={!replyContent.trim() || submittingReply}
                className={`text-[15px] font-bold px-4 py-1.5 rounded-full transition-all ${
                  replyContent.trim() && !submittingReply
                    ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
              >
                {submittingReply ? 'Posting...' : 'Post'}
              </button>
            </div>

            {/* Original Thread with connecting line */}
            <div className="px-5 py-4">
              <div className="flex gap-3 relative">
                {/* Connecting line */}
                <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

                <div className="flex-shrink-0 relative z-10">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold ring-4 ring-white dark:ring-gray-800">
                    {authorInitials}
                  </div>
                </div>
                <div className="flex-1 min-w-0 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900 dark:text-gray-100 text-[15px]">{authorName}</span>
                    <span className="text-gray-400 dark:text-gray-500">·</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(thread.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-[15px] text-gray-900 dark:text-gray-100 line-clamp-3 mb-2">
                    {thread.content}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Replying to <span className="text-primary-600 dark:text-primary-400">@{authorName.toLowerCase().replace(/\s+/g, '')}</span>
                  </p>
                </div>
              </div>

              {/* Reply Input */}
              <div className="flex gap-3 pt-2">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold">
                    {user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                  </div>
                </div>
                <div className="flex-1">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`Reply to ${authorName}...`}
                    className="w-full min-h-[120px] max-h-[300px] p-0 mt-2 border-0 focus:ring-0 resize-none bg-transparent text-gray-900 dark:text-gray-100 text-[15px] placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
                    autoFocus
                  />
                  {replyContent.length > 0 && (
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                          <PhotoIcon className="h-5 w-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                          <FaceSmileIcon className="h-5 w-5" />
                        </button>
                      </div>
                      <span className={`text-xs font-medium ${
                        replyContent.length > 280 ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        {replyContent.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Thread Modal */}
      {showEditModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm dark:bg-opacity-70 flex items-center justify-center p-4 z-50 overflow-y-auto"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100dvh',
            maxHeight: '100vh',
            minHeight: '100vh',
            margin: 0,
            padding: 0,
            transform: 'translateZ(0)',
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden'
          } as React.CSSProperties}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full my-8">
            <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Thread</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Thread Title *
                </label>
                <input
                  type="text"
                  value={editedThread.title}
                  onChange={(e) => setEditedThread({ ...editedThread, title: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter a descriptive title for your thread"
                  maxLength={200}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {editedThread.title.length}/200 characters
                </p>
              </div>

              {/* Category */}
              <div>
                <CustomSelect
                  label="Category"
                  required
                  value={editedThread.category}
                  onChange={(value) => setEditedThread({ ...editedThread, category: value })}
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

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content *
                </label>
                <textarea
                  value={editedThread.content}
                  onChange={(e) => setEditedThread({ ...editedThread, content: e.target.value })}
                  rows={8}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Write your thread content here..."
                />
              </div>

              {/* Tags */}
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
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Type a tag and press Enter"
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  >
                    Add
                  </button>
                </div>
                {editedThread.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {editedThread.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400"
                      >
                        #{tag}
                        <button
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

            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={loading || !editedThread.title || !editedThread.content}
                className="flex-1 py-3 px-4 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm dark:bg-opacity-70 flex items-center justify-center p-4 z-50"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100dvh',
            maxHeight: '100vh',
            minHeight: '100vh',
            margin: 0,
            padding: 0,
            transform: 'translateZ(0)',
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden'
          } as React.CSSProperties}
          onClick={handleCancelDelete}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 pb-4">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center">
                Delete {deleteTarget?.type === 'thread' ? 'Thread' : 'Reply'}
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                Are you sure you want to delete this {deleteTarget?.type}? This action cannot be undone.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-6 pt-2">
              <button
                onClick={handleCancelDelete}
                className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ForumThread;