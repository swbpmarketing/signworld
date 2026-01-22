import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { usePreviewMode } from '../context/PreviewModeContext';
import api from '../config/axios';
import toast from 'react-hot-toast';
import {
  BugAntIcon,
  LightBulbIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
  ChevronUpIcon,
  ChatBubbleLeftIcon,
  ClockIcon,
  UserCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  SparklesIcon,
  PencilIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface BugReport {
  _id: string;
  title: string;
  description: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  type: 'bug' | 'feature';
  status: 'pending' | 'in_progress' | 'rejected' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  author: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  };
  attachments?: {
    url: string;
    filename: string;
    mimetype: string;
  }[];
  comments: {
    _id: string;
    user: {
      _id: string;
      name: string;
      email: string;
      profileImage?: string;
    };
    text: string;
    createdAt: string;
  }[];
  votes: string[];
  votesCount: number;
  commentsCount: number;
  hasVoted: boolean;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface NewReportForm {
  title: string;
  description: string;
  stepsToReproduce: string;
  expectedBehavior: string;
  actualBehavior: string;
  type: 'bug' | 'feature';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

const statusConfig = {
  pending: {
    label: 'Bug/Feature',
    color: 'border-red-500',
    headerBg: 'bg-red-500/10',
    headerText: 'text-red-500',
    icon: BugAntIcon,
  },
  in_progress: {
    label: 'In Progress',
    color: 'border-blue-500',
    headerBg: 'bg-blue-500/10',
    headerText: 'text-blue-500',
    icon: ArrowPathIcon,
  },
  rejected: {
    label: 'Rejected',
    color: 'border-orange-500',
    headerBg: 'bg-orange-500/10',
    headerText: 'text-orange-500',
    icon: XCircleIcon,
  },
  completed: {
    label: 'Completed',
    color: 'border-green-500',
    headerBg: 'bg-green-500/10',
    headerText: 'text-green-500',
    icon: CheckCircleIcon,
  },
};

const priorityConfig = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
};

const initialFormState: NewReportForm = {
  title: '',
  description: '',
  stepsToReproduce: '',
  expectedBehavior: '',
  actualBehavior: '',
  type: 'bug',
  priority: 'medium',
};

const BugReports = () => {
  const { user } = useAuth();
  const { getEffectiveRole } = usePreviewMode();
  const queryClient = useQueryClient();
  const effectiveRole = getEffectiveRole();
  const isAdmin = effectiveRole === 'admin';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [showMyReportsOnly, setShowMyReportsOnly] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);
  const [editingReport, setEditingReport] = useState<BugReport | null>(null);
  const [newReport, setNewReport] = useState<NewReportForm>(initialFormState);
  const [editReport, setEditReport] = useState<NewReportForm>(initialFormState);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxAttachments, setLightboxAttachments] = useState<{ url: string; mimetype: string; filename: string }[]>([]);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);

  // Fetch bug reports
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['bugReports'],
    queryFn: async () => {
      const response = await api.get('/bug-reports');
      return response.data.data as BugReport[];
    },
  });

  // Create report mutation
  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post('/bug-reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bugReports'] });
      setShowCreateModal(false);
      setNewReport(initialFormState);
      setAttachments([]);
      toast.success('Feedback submitted successfully!');
    },
    onError: () => {
      toast.error('Failed to submit feedback');
    },
  });

  // Update report mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<NewReportForm> }) => {
      const response = await api.put(`/bug-reports/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bugReports'] });
      setShowEditModal(false);
      setEditingReport(null);
      setEditReport(initialFormState);
      toast.success('Report updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update report');
    },
  });

  // Delete report mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/bug-reports/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bugReports'] });
      setShowDetailModal(false);
      setSelectedReport(null);
      toast.success('Report deleted successfully!');
    },
    onError: () => {
      toast.error('Failed to delete report');
    },
  });

  // Update status mutation (admin only)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await api.put(`/bug-reports/${id}/status`, { status });
      return { id, data: response.data };
    },
    onSuccess: async ({ id }) => {
      queryClient.invalidateQueries({ queryKey: ['bugReports'] });
      toast.success('Status updated successfully');
      // Refresh the selected report
      if (selectedReport && selectedReport._id === id) {
        try {
          const response = await api.get(`/bug-reports/${id}`);
          setSelectedReport(response.data.data);
        } catch (error) {
          console.error('Failed to refresh report:', error);
        }
      }
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/bug-reports/${id}/vote`);
      return { id, data: response.data };
    },
    onSuccess: async ({ id }) => {
      queryClient.invalidateQueries({ queryKey: ['bugReports'] });
      // Refresh the selected report
      if (selectedReport && selectedReport._id === id) {
        try {
          const response = await api.get(`/bug-reports/${id}`);
          setSelectedReport(response.data.data);
        } catch (error) {
          console.error('Failed to refresh report:', error);
        }
      }
    },
    onError: () => {
      toast.error('Failed to vote');
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      const response = await api.post(`/bug-reports/${id}/comment`, { text });
      return { id, data: response.data };
    },
    onSuccess: async ({ id }) => {
      queryClient.invalidateQueries({ queryKey: ['bugReports'] });
      setNewComment('');
      toast.success('Comment added');
      // Refresh the selected report to show new comment
      if (selectedReport && selectedReport._id === id) {
        try {
          const response = await api.get(`/bug-reports/${id}`);
          setSelectedReport(response.data.data);
        } catch (error) {
          console.error('Failed to refresh report:', error);
        }
      }
    },
    onError: () => {
      toast.error('Failed to add comment');
    },
  });

  // Filter reports by search query and user filter
  const filteredReports = reportsData?.filter(report => {
    // Filter by current user if "My Reports" is enabled
    if (showMyReportsOnly && user && report.author._id !== user._id) {
      return false;
    }

    // Filter by search query
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      report.title.toLowerCase().includes(query) ||
      report.description.toLowerCase().includes(query) ||
      report._id.toLowerCase().includes(query)
    );
  }) || [];

  // Group reports by status
  const reportsByStatus = {
    pending: filteredReports.filter(r => r.status === 'pending'),
    in_progress: filteredReports.filter(r => r.status === 'in_progress'),
    rejected: filteredReports.filter(r => r.status === 'rejected'),
    completed: filteredReports.filter(r => r.status === 'completed'),
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReport.title.trim() || !newReport.description.trim()) {
      toast.error('Please fill in title and description');
      return;
    }

    const formData = new FormData();
    formData.append('title', newReport.title);
    formData.append('description', newReport.description);
    formData.append('type', newReport.type);
    formData.append('priority', newReport.priority);
    if (newReport.stepsToReproduce) {
      formData.append('stepsToReproduce', newReport.stepsToReproduce);
    }
    if (newReport.expectedBehavior) {
      formData.append('expectedBehavior', newReport.expectedBehavior);
    }
    if (newReport.actualBehavior) {
      formData.append('actualBehavior', newReport.actualBehavior);
    }
    attachments.forEach(file => {
      formData.append('attachments', file);
    });

    createMutation.mutate(formData);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files).filter(file => {
        // Check file size (50MB limit)
        if (file.size > 50 * 1024 * 1024) {
          toast.error(`${file.name} is too large. Max size is 50MB.`);
          return false;
        }
        // Check file type
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
          toast.error(`${file.name} is not an image or video.`);
          return false;
        }
        return true;
      });
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleEnhanceWithAI = async () => {
    if (!newReport.description.trim()) {
      toast.error('Please add a description first');
      return;
    }

    setIsEnhancing(true);
    try {
      const response = await api.post('/ai/enhance-feedback', {
        description: newReport.description,
        type: newReport.type,
      });

      if (response.data.success) {
        setNewReport(prev => ({
          ...prev,
          description: response.data.data.enhancedDescription || prev.description,
          stepsToReproduce: response.data.data.stepsToReproduce || prev.stepsToReproduce,
          expectedBehavior: response.data.data.expectedBehavior || prev.expectedBehavior,
          actualBehavior: response.data.data.actualBehavior || prev.actualBehavior,
        }));
        toast.success('Description enhanced!');
      }
    } catch {
      toast.error('Failed to enhance with AI');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleStatusChange = (reportId: string, newStatus: string) => {
    updateStatusMutation.mutate({ id: reportId, status: newStatus });
  };

  const handleVote = (reportId: string) => {
    voteMutation.mutate(reportId);
  };

  const handleAddComment = (reportId: string) => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate({ id: reportId, text: newComment });
  };

  const openDetailModal = (report: BugReport) => {
    setSelectedReport(report);
    setShowDetailModal(true);
    setShowActionsMenu(false);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setNewReport(initialFormState);
    setAttachments([]);
  };

  const openEditModal = (report: BugReport) => {
    setEditingReport(report);
    setEditReport({
      title: report.title,
      description: report.description,
      stepsToReproduce: report.stepsToReproduce || '',
      expectedBehavior: report.expectedBehavior || '',
      actualBehavior: report.actualBehavior || '',
      type: report.type,
      priority: report.priority,
    });
    setShowEditModal(true);
    setShowDetailModal(false);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingReport(null);
    setEditReport(initialFormState);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReport) return;
    if (!editReport.title.trim() || !editReport.description.trim()) {
      toast.error('Please fill in title and description');
      return;
    }

    updateMutation.mutate({ id: editingReport._id, data: editReport });
  };

  const handleDelete = (reportId: string) => {
    setReportToDelete(reportId);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (reportToDelete) {
      deleteMutation.mutate(reportToDelete);
      setShowDeleteModal(false);
      setReportToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setReportToDelete(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  const isImage = (mimetype: string) => mimetype.startsWith('image/');
  const isVideo = (mimetype: string) => mimetype.startsWith('video/');

  const openLightbox = (attachments: { url: string; mimetype: string; filename: string }[], index: number) => {
    setLightboxAttachments(attachments);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setLightboxIndex(0);
    setLightboxAttachments([]);
  };

  const navigateLightbox = useCallback((direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setLightboxIndex(prev => (prev === 0 ? lightboxAttachments.length - 1 : prev - 1));
    } else {
      setLightboxIndex(prev => (prev === lightboxAttachments.length - 1 ? 0 : prev + 1));
    }
  }, [lightboxAttachments.length]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          closeLightbox();
          break;
        case 'ArrowLeft':
          navigateLightbox('prev');
          break;
        case 'ArrowRight':
          navigateLightbox('next');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, navigateLightbox]);

  // Close actions menu when clicking outside
  useEffect(() => {
    if (!showActionsMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.actions-menu')) {
        setShowActionsMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showActionsMenu]);

  // Keyboard navigation for delete modal
  useEffect(() => {
    if (!showDeleteModal || !reportToDelete) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDeleteModal(false);
        setReportToDelete(null);
      } else if (e.key === 'Enter' && !deleteMutation.isPending) {
        deleteMutation.mutate(reportToDelete);
        setShowDeleteModal(false);
        setReportToDelete(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDeleteModal, reportToDelete, deleteMutation]);

  // Kanban Card Component
  const KanbanCard = ({ report }: { report: BugReport }) => (
    <div
      data-tour="bug-card"
      className="bg-white dark:bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm"
      onClick={() => openDetailModal(report)}
    >
      {/* Header with type badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {report.type === 'bug' ? (
            <BugAntIcon className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0" />
          ) : (
            <LightBulbIcon className="h-4 w-4 text-yellow-500 dark:text-yellow-400 flex-shrink-0" />
          )}
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">
            {report.type === 'bug' ? 'Bug' : 'Feature'}
          </span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${priorityConfig[report.priority].color}`}>
          {priorityConfig[report.priority].label}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
        {report.title}
      </h4>

      {/* Description preview */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
        {report.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          {/* Votes */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleVote(report._id);
            }}
            className={`flex items-center gap-1 hover:text-primary-400 transition-colors ${
              report.hasVoted ? 'text-primary-400' : ''
            }`}
          >
            <ChevronUpIcon className="h-4 w-4" />
            <span>{report.votesCount}</span>
          </button>

          {/* Comments */}
          <div className="flex items-center gap-1">
            <ChatBubbleLeftIcon className="h-4 w-4" />
            <span>{report.commentsCount}</span>
          </div>
        </div>

        {/* Time */}
        <span className="flex items-center gap-1">
          <ClockIcon className="h-3 w-3" />
          {formatTimeAgo(report.createdAt)}
        </span>
      </div>
    </div>
  );

  // Kanban Column Component
  const KanbanColumn = ({
    status,
    reports,
  }: {
    status: keyof typeof statusConfig;
    reports: BugReport[];
  }) => {
    const config = statusConfig[status];
    const StatusIcon = config.icon;

    return (
      <div data-tour="bug-status-columns" className={`flex-1 min-w-[280px] bg-gray-100 dark:bg-gray-900/50 rounded-xl border-t-4 ${config.color}`}>
        {/* Column Header */}
        <div className={`px-4 py-3 ${config.headerBg} rounded-t-lg border-b border-gray-200 dark:border-gray-700`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusIcon className={`h-5 w-5 ${config.headerText}`} />
              <h3 className={`font-semibold ${config.headerText}`}>{config.label}</h3>
              <span className="text-sm text-gray-500 ml-1">{reports.length}</span>
            </div>
            {status === 'pending' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <PlusIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Column Content */}
        <div className="p-3 space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto scrollbar-hide">
          {reports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No items</p>
            </div>
          ) : (
            reports.map(report => (
              <KanbanCard key={report._id} report={report} />
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6" data-tour="bug-reports-content">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary-600/10 rounded-xl">
            <BugAntIcon className="h-8 w-8 text-primary-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Bug Reports & Feature Requests
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Track and manage feedback to improve the app
            </p>
          </div>
        </div>

        <button
          data-tour="report-bug-button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
        >
          <PlusIcon className="h-5 w-5" />
          Submit Feedback
        </button>
      </div>

      {/* Search Bar and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div data-tour="bug-filters" className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by #, title, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <button
          data-tour="my-reports"
          onClick={() => setShowMyReportsOnly(!showMyReportsOnly)}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
            showMyReportsOnly
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <UserCircleIcon className="h-5 w-5" />
          My Reports
        </button>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary-600"></div>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          <KanbanColumn status="pending" reports={reportsByStatus.pending} />
          <KanbanColumn status="in_progress" reports={reportsByStatus.in_progress} />
          <KanbanColumn status="rejected" reports={reportsByStatus.rejected} />
          <KanbanColumn status="completed" reports={reportsByStatus.completed} />
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60" onClick={closeCreateModal} />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Submit Feedback</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Report a bug or request a new feature. We appreciate your feedback!
                    </p>
                  </div>
                  <button
                    onClick={closeCreateModal}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateSubmit} className="p-6 space-y-5">
                {/* Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setNewReport({ ...newReport, type: 'bug' })}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                        newReport.type === 'bug'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <BugAntIcon className="h-5 w-5" />
                      Bug Report
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewReport({ ...newReport, type: 'feature' })}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                        newReport.type === 'feature'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <LightBulbIcon className="h-5 w-5" />
                      Feature Request
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newReport.title}
                    onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                    placeholder="Brief description of the bug"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newReport.description}
                    onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                    placeholder="Describe what happened..."
                    rows={3}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    required
                  />
                </div>

                {/* Steps to Reproduce - only show for bugs */}
                {newReport.type === 'bug' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Steps to Reproduce
                    </label>
                    <textarea
                      value={newReport.stepsToReproduce}
                      onChange={(e) => setNewReport({ ...newReport, stepsToReproduce: e.target.value })}
                      placeholder="1. Go to... 2. Click on... 3. See error"
                      rows={3}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">Help us reproduce the issue</p>
                  </div>
                )}

                {/* Expected & Actual Behavior - only show for bugs */}
                {newReport.type === 'bug' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Expected Behavior
                      </label>
                      <input
                        type="text"
                        value={newReport.expectedBehavior}
                        onChange={(e) => setNewReport({ ...newReport, expectedBehavior: e.target.value })}
                        placeholder="What should happen?"
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Actual Behavior
                      </label>
                      <input
                        type="text"
                        value={newReport.actualBehavior}
                        onChange={(e) => setNewReport({ ...newReport, actualBehavior: e.target.value })}
                        placeholder="What actually happened?"
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                )}

                {/* Attachments */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Attachments
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <ArrowUpTrayIcon className="h-5 w-5" />
                    Upload Screenshot/Video
                  </button>
                  <p className="text-xs text-gray-500 mt-1.5">Accepted: Images and videos up to 50MB</p>

                  {/* Attachment previews */}
                  {attachments.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                      {attachments.map((file, index) => (
                        <div
                          key={index}
                          className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700"
                        >
                          {file.type.startsWith('image/') ? (
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className="w-full h-24 object-cover"
                            />
                          ) : file.type.startsWith('video/') ? (
                            <div className="relative w-full h-24 bg-gray-800 flex items-center justify-center">
                              <video
                                src={URL.createObjectURL(file)}
                                className="w-full h-24 object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                                  <svg className="w-5 h-5 text-gray-800 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-24 flex items-center justify-center">
                              <span className="text-gray-500 text-xs">{file.name}</span>
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                            <p className="text-white text-xs truncate">{file.name}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={handleEnhanceWithAI}
                    disabled={isEnhancing || !newReport.description.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <SparklesIcon className="h-5 w-5" />
                    {isEnhancing ? 'Enhancing...' : 'Enhance with AI'}
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={closeCreateModal}
                      className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createMutation.isPending}
                      className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {createMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60" onClick={closeEditModal} />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Report</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Update your bug report or feature request
                    </p>
                  </div>
                  <button
                    onClick={closeEditModal}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleEditSubmit} className="p-6 space-y-5">
                {/* Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setEditReport({ ...editReport, type: 'bug' })}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                        editReport.type === 'bug'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <BugAntIcon className="h-5 w-5" />
                      Bug Report
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditReport({ ...editReport, type: 'feature' })}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                        editReport.type === 'feature'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <LightBulbIcon className="h-5 w-5" />
                      Feature Request
                    </button>
                  </div>
                </div>

                {/* Priority Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['low', 'medium', 'high', 'critical'] as const).map((priority) => (
                      <button
                        key={priority}
                        type="button"
                        onClick={() => setEditReport({ ...editReport, priority })}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          editReport.priority === priority
                            ? priorityConfig[priority].color
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {priorityConfig[priority].label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editReport.title}
                    onChange={(e) => setEditReport({ ...editReport, title: e.target.value })}
                    placeholder="Brief description of the bug"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editReport.description}
                    onChange={(e) => setEditReport({ ...editReport, description: e.target.value })}
                    placeholder="Describe what happened..."
                    rows={3}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    required
                  />
                </div>

                {/* Steps to Reproduce - only show for bugs */}
                {editReport.type === 'bug' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Steps to Reproduce
                    </label>
                    <textarea
                      value={editReport.stepsToReproduce}
                      onChange={(e) => setEditReport({ ...editReport, stepsToReproduce: e.target.value })}
                      placeholder="1. Go to... 2. Click on... 3. See error"
                      rows={3}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">Help us reproduce the issue</p>
                  </div>
                )}

                {/* Expected & Actual Behavior - only show for bugs */}
                {editReport.type === 'bug' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Expected Behavior
                      </label>
                      <input
                        type="text"
                        value={editReport.expectedBehavior}
                        onChange={(e) => setEditReport({ ...editReport, expectedBehavior: e.target.value })}
                        placeholder="What should happen?"
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Actual Behavior
                      </label>
                      <input
                        type="text"
                        value={editReport.actualBehavior}
                        onChange={(e) => setEditReport({ ...editReport, actualBehavior: e.target.value })}
                        placeholder="What actually happened?"
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/70" onClick={cancelDelete} />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
              {/* Modal Content */}
              <div className="p-6">
                {/* Icon */}
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>

                {/* Title and Message */}
                <div className="mt-4 text-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Delete Report
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Are you sure you want to delete this report? This action cannot be undone.
                  </p>
                </div>

                {/* Buttons */}
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={cancelDelete}
                    className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    disabled={deleteMutation.isPending}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxOpen && lightboxAttachments.length > 0 && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center">
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-4 text-white/80 text-sm bg-white/10 px-3 py-1 rounded-full">
            {lightboxIndex + 1} / {lightboxAttachments.length}
          </div>

          {/* Navigation buttons */}
          {lightboxAttachments.length > 1 && (
            <>
              <button
                onClick={() => navigateLightbox('prev')}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => navigateLightbox('next')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Content */}
          <div className="max-w-[90vw] max-h-[85vh] flex items-center justify-center">
            {isImage(lightboxAttachments[lightboxIndex].mimetype) ? (
              <img
                src={lightboxAttachments[lightboxIndex].url}
                alt={lightboxAttachments[lightboxIndex].filename}
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
              />
            ) : isVideo(lightboxAttachments[lightboxIndex].mimetype) ? (
              <video
                src={lightboxAttachments[lightboxIndex].url}
                controls
                autoPlay
                className="max-w-full max-h-[85vh] rounded-lg"
              />
            ) : (
              <div className="text-white text-center">
                <p className="text-lg mb-4">{lightboxAttachments[lightboxIndex].filename}</p>
                <a
                  href={lightboxAttachments[lightboxIndex].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                >
                  Download File
                </a>
              </div>
            )}
          </div>

          {/* Filename */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-white/10 px-4 py-2 rounded-full max-w-[80vw] truncate">
            {lightboxAttachments[lightboxIndex].filename}
          </div>

          {/* Thumbnail strip */}
          {lightboxAttachments.length > 1 && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 bg-white/10 p-2 rounded-lg max-w-[80vw] overflow-x-auto">
              {lightboxAttachments.map((attachment, index) => (
                <button
                  key={index}
                  onClick={() => setLightboxIndex(index)}
                  className={`flex-shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-colors ${
                    index === lightboxIndex ? 'border-primary-500' : 'border-transparent hover:border-white/50'
                  }`}
                >
                  {isImage(attachment.mimetype) ? (
                    <img src={attachment.url} alt="" className="w-full h-full object-cover" />
                  ) : isVideo(attachment.mimetype) ? (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                      <span className="text-white text-xs">File</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60" onClick={() => {
              setShowDetailModal(false);
              setShowActionsMenu(false);
            }} />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 z-10">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {selectedReport.type === 'bug' ? (
                      <BugAntIcon className="h-6 w-6 text-red-500 dark:text-red-400" />
                    ) : (
                      <LightBulbIcon className="h-6 w-6 text-yellow-500 dark:text-yellow-400" />
                    )}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${priorityConfig[selectedReport.priority].color}`}>
                      {priorityConfig[selectedReport.priority].label}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusConfig[selectedReport.status].headerBg} ${statusConfig[selectedReport.status].headerText}`}>
                      {statusConfig[selectedReport.status].label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Edit/Delete Menu - Only show to author or admin */}
                    {(isAdmin || selectedReport.author._id === user?.id) && (
                      <div className="relative actions-menu">
                        <button
                          onClick={() => setShowActionsMenu(!showActionsMenu)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <EllipsisVerticalIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                        </button>
                        {showActionsMenu && (
                          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 z-20">
                            <button
                              onClick={() => {
                                setShowActionsMenu(false);
                                openEditModal(selectedReport);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                            >
                              <PencilIcon className="h-4 w-4" />
                              Edit Report
                            </button>
                            <button
                              onClick={() => {
                                setShowActionsMenu(false);
                                handleDelete(selectedReport._id);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                            >
                              <TrashIcon className="h-4 w-4" />
                              Delete Report
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        setShowActionsMenu(false);
                      }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <XMarkIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-3">
                  {selectedReport.title}
                </h2>
              </div>

              {/* Content */}
              <div className="px-6 py-4 space-y-6">
                {/* Meta info */}
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    {selectedReport.author.profileImage ? (
                      <img
                        src={selectedReport.author.profileImage}
                        alt={selectedReport.author.name}
                        className="h-6 w-6 rounded-full object-cover"
                      />
                    ) : (
                      <UserCircleIcon className="h-6 w-6" />
                    )}
                    <span>{selectedReport.author.name}</span>
                  </div>
                  <span>|</span>
                  <span>{formatDate(selectedReport.createdAt)}</span>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {selectedReport.description}
                  </p>
                </div>

                {/* Steps to reproduce */}
                {selectedReport.stepsToReproduce && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Steps to Reproduce</h3>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {selectedReport.stepsToReproduce}
                    </p>
                  </div>
                )}

                {/* Expected/Actual behavior */}
                {(selectedReport.expectedBehavior || selectedReport.actualBehavior) && (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedReport.expectedBehavior && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Expected Behavior</h3>
                        <p className="text-gray-700 dark:text-gray-300">{selectedReport.expectedBehavior}</p>
                      </div>
                    )}
                    {selectedReport.actualBehavior && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Actual Behavior</h3>
                        <p className="text-gray-700 dark:text-gray-300">{selectedReport.actualBehavior}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Attachments */}
                {selectedReport.attachments && selectedReport.attachments.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Attachments ({selectedReport.attachments.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedReport.attachments.map((attachment, index) => (
                        <div
                          key={index}
                          className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 cursor-pointer hover:border-primary-500 transition-colors"
                          onClick={() => openLightbox(selectedReport.attachments!, index)}
                        >
                          {isImage(attachment.mimetype) ? (
                            <img
                              src={attachment.url}
                              alt={attachment.filename}
                              className="w-full h-28 object-cover"
                            />
                          ) : isVideo(attachment.mimetype) ? (
                            <div className="relative w-full h-28 bg-gray-800">
                              <video
                                src={attachment.url}
                                className="w-full h-28 object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <svg className="w-6 h-6 text-gray-800 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-28 flex items-center justify-center">
                              <span className="text-gray-500 text-sm">{attachment.filename}</span>
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                            <p className="text-white text-xs truncate">{attachment.filename}</p>
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full transition-opacity">
                              View
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Status Control */}
                {isAdmin && (
                  <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Update Status (Admin)</h3>
                    <div className="flex flex-wrap gap-2">
                      {(['pending', 'in_progress', 'rejected', 'completed'] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(selectedReport._id, status)}
                          disabled={selectedReport.status === status}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedReport.status === status
                              ? `${statusConfig[status].headerBg} ${statusConfig[status].headerText}`
                              : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                          }`}
                        >
                          {statusConfig[status].label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vote section */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleVote(selectedReport._id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      selectedReport.hasVoted
                        ? 'bg-primary-600/20 text-primary-600 dark:text-primary-400 border border-primary-500'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <ChevronUpIcon className="h-5 w-5" />
                    <span className="font-medium">{selectedReport.votesCount}</span>
                    <span>votes</span>
                  </button>
                </div>

                {/* Comments section */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Comments ({selectedReport.commentsCount})
                  </h3>

                  {/* Comment list */}
                  <div className="space-y-3 mb-4">
                    {selectedReport.comments.length === 0 ? (
                      <p className="text-gray-500 text-sm">No comments yet</p>
                    ) : (
                      selectedReport.comments.map((comment) => (
                        <div key={comment._id} className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            {comment.user.profileImage ? (
                              <img
                                src={comment.user.profileImage}
                                alt={comment.user.name}
                                className="h-6 w-6 rounded-full object-cover"
                              />
                            ) : (
                              <UserCircleIcon className="h-6 w-6 text-gray-400" />
                            )}
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              {comment.user.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatTimeAgo(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{comment.text}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add comment */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment(selectedReport._id);
                        }
                      }}
                    />
                    <button
                      onClick={() => handleAddComment(selectedReport._id)}
                      disabled={!newComment.trim() || addCommentMutation.isPending}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BugReports;
