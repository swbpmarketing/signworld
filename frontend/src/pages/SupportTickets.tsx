import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { usePreviewMode } from '../context/PreviewModeContext';
import api from '../config/axios';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import {
  LifebuoyIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
  ChatBubbleLeftIcon,
  ClockIcon,
  UserCircleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  PencilIcon,
  TrashIcon,
  PaperAirplaneIcon,
  ExclamationTriangleIcon,
  InboxIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TicketIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

// --- Types ---

interface Attachment {
  url: string;
  filename: string;
  mimetype: string;
}

interface TicketComment {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role?: string;
    profileImage?: string;
  };
  text: string;
  isAdminReply: boolean;
  attachments?: Attachment[];
  createdAt: string;
  editedAt?: string;
}

interface SupportTicket {
  _id: string;
  ticketNumber?: string;
  subject: string;
  description: string;
  category: 'general' | 'billing' | 'technical' | 'account' | 'equipment' | 'other';
  status: 'open' | 'in_progress' | 'awaiting_response' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  author: {
    _id: string;
    name: string;
    email: string;
    role?: string;
    company?: string;
    profileImage?: string;
  };
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  };
  attachments?: Attachment[];
  comments: TicketComment[];
  commentsCount: number;
  resolvedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  awaitingResponse: number;
  resolved: number;
  closed: number;
}

interface NewTicketForm {
  subject: string;
  description: string;
  category: string;
  priority: string;
}

// --- Config ---

const statusConfig: Record<string, { label: string; color: string; borderColor: string; bg: string; text: string; activeBg: string }> = {
  open: { label: 'Open', color: 'bg-yellow-500', borderColor: 'border-l-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-500/20', text: 'text-yellow-700 dark:text-yellow-300', activeBg: 'bg-yellow-500/20 dark:bg-yellow-500/30 text-yellow-700 dark:text-yellow-300 ring-1 ring-yellow-500/50' },
  in_progress: { label: 'In Progress', color: 'bg-blue-500', borderColor: 'border-l-blue-500', bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-300', activeBg: 'bg-blue-500/20 dark:bg-blue-500/30 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/50' },
  awaiting_response: { label: 'Awaiting Response', color: 'bg-purple-500', borderColor: 'border-l-purple-500', bg: 'bg-purple-100 dark:bg-purple-500/20', text: 'text-purple-700 dark:text-purple-300', activeBg: 'bg-purple-500/20 dark:bg-purple-500/30 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500/50' },
  resolved: { label: 'Resolved', color: 'bg-green-500', borderColor: 'border-l-green-500', bg: 'bg-green-100 dark:bg-green-500/20', text: 'text-green-700 dark:text-green-300', activeBg: 'bg-green-500/20 dark:bg-green-500/30 text-green-700 dark:text-green-300 ring-1 ring-green-500/50' },
  closed: { label: 'Closed', color: 'bg-gray-500', borderColor: 'border-l-gray-400', bg: 'bg-gray-100 dark:bg-gray-600/30', text: 'text-gray-600 dark:text-gray-400', activeBg: 'bg-gray-500/20 dark:bg-gray-500/30 text-gray-600 dark:text-gray-400 ring-1 ring-gray-500/50' },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
};

const categoryConfig: Record<string, { label: string; icon: string }> = {
  general: { label: 'General', icon: '📋' },
  billing: { label: 'Billing', icon: '💳' },
  technical: { label: 'Technical', icon: '🔧' },
  account: { label: 'Account', icon: '👤' },
  equipment: { label: 'Equipment', icon: '🖨️' },
  other: { label: 'Other', icon: '📝' },
};

const initialFormState: NewTicketForm = {
  subject: '',
  description: '',
  category: 'general',
  priority: 'medium',
};

// --- Helpers ---

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getInitials(name: string): string {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
}

// --- Component ---

const SupportTickets = () => {
  const { user } = useAuth();
  const { getEffectiveRole } = usePreviewMode();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const effectiveRole = getEffectiveRole();
  const isAdmin = effectiveRole === 'admin';
  const formRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [newTicket, setNewTicket] = useState<NewTicketForm>(initialFormState);
  const [replyText, setReplyText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const [ticketAttachments, setTicketAttachments] = useState<File[]>([]);
  const [replyAttachments, setReplyAttachments] = useState<File[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const ticketFileInputRef = useRef<HTMLInputElement>(null);
  const replyFileInputRef = useRef<HTMLInputElement>(null);

  // --- Queries ---

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['supportTickets'],
    queryFn: async () => {
      const response = await api.get('/support-tickets');
      return response.data.data as SupportTicket[];
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ['supportTicketStats'],
    queryFn: async () => {
      const response = await api.get('/support-tickets/stats');
      return response.data.data as TicketStats;
    },
    enabled: isAdmin,
  });

  // --- Mutations ---

  const createMutation = useMutation({
    mutationFn: async (data: { form: NewTicketForm; files: File[] }) => {
      const formData = new FormData();
      formData.append('subject', data.form.subject);
      formData.append('description', data.form.description);
      formData.append('category', data.form.category);
      formData.append('priority', data.form.priority);
      data.files.forEach(file => formData.append('attachments', file));
      const response = await api.post('/support-tickets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
      queryClient.invalidateQueries({ queryKey: ['supportTicketStats'] });
      setShowCreateForm(false);
      setShowCreateModal(false);
      setNewTicket(initialFormState);
      setTicketAttachments([]);
      toast.success('Support ticket submitted! We\'ll get back to you soon.');
    },
    onError: () => {
      toast.error('Failed to create support ticket');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/support-tickets/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
      queryClient.invalidateQueries({ queryKey: ['supportTicketStats'] });
      setShowDetailModal(false);
      setSelectedTicket(null);
      setShowDeleteModal(false);
      setTicketToDelete(null);
      toast.success('Ticket deleted successfully!');
    },
    onError: () => {
      toast.error('Failed to delete ticket');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await api.put(`/support-tickets/${id}/status`, { status });
      return { id, data: response.data };
    },
    onSuccess: async ({ id, data }) => {
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
      queryClient.invalidateQueries({ queryKey: ['supportTicketStats'] });
      toast.success('Status updated successfully');
      if (selectedTicket && selectedTicket._id === id) {
        setSelectedTicket(data.data);
      }
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ id, text, files }: { id: string; text: string; files: File[] }) => {
      const formData = new FormData();
      formData.append('text', text);
      files.forEach(file => formData.append('attachments', file));
      const response = await api.post(`/support-tickets/${id}/comment`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return { id, data: response.data };
    },
    onSuccess: async ({ id, data }) => {
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
      queryClient.invalidateQueries({ queryKey: ['supportTicketStats'] });
      setReplyText('');
      setReplyAttachments([]);
      toast.success('Reply sent');
      if (selectedTicket && selectedTicket._id === id) {
        if (data.ticket) {
          setSelectedTicket(data.ticket);
        } else {
          try {
            const response = await api.get(`/support-tickets/${id}`);
            setSelectedTicket(response.data.data);
          } catch (error) {
            console.error('Failed to refresh ticket:', error);
          }
        }
      }
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.error || 'Failed to send reply';
      toast.error(msg);
    },
  });

  const editCommentMutation = useMutation({
    mutationFn: async ({ ticketId, commentId, text }: { ticketId: string; commentId: string; text: string }) => {
      const response = await api.put(`/support-tickets/${ticketId}/comment/${commentId}`, { text });
      return { ticketId, data: response.data };
    },
    onSuccess: async ({ ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
      setEditingCommentId(null);
      setEditCommentText('');
      toast.success('Comment updated');
      if (selectedTicket && selectedTicket._id === ticketId) {
        try {
          const response = await api.get(`/support-tickets/${ticketId}`);
          setSelectedTicket(response.data.data);
        } catch (error) {
          console.error('Failed to refresh ticket:', error);
        }
      }
    },
    onError: () => {
      toast.error('Failed to update comment');
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async ({ ticketId, commentId }: { ticketId: string; commentId: string }) => {
      const response = await api.delete(`/support-tickets/${ticketId}/comment/${commentId}`);
      return { ticketId, data: response.data };
    },
    onSuccess: async ({ ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
      toast.success('Comment deleted');
      if (selectedTicket && selectedTicket._id === ticketId) {
        try {
          const response = await api.get(`/support-tickets/${ticketId}`);
          setSelectedTicket(response.data.data);
        } catch (error) {
          console.error('Failed to refresh ticket:', error);
        }
      }
    },
    onError: () => {
      toast.error('Failed to delete comment');
    },
  });

  // --- Handlers ---

  const handleCreateTicket = useCallback(() => {
    if (!newTicket.subject.trim() || !newTicket.description.trim()) {
      toast.error('Please fill in subject and description');
      return;
    }
    createMutation.mutate({ form: newTicket, files: ticketAttachments });
  }, [newTicket, ticketAttachments, createMutation]);

  const handleSendReply = useCallback((ticketId: string) => {
    if (!replyText.trim() && replyAttachments.length === 0) return;
    addCommentMutation.mutate({ id: ticketId, text: replyText, files: replyAttachments });
  }, [replyText, replyAttachments, addCommentMutation]);

  const handleStatusChange = useCallback((ticketId: string, status: string) => {
    updateStatusMutation.mutate({ id: ticketId, status });
  }, [updateStatusMutation]);

  const openTicketDetail = useCallback(async (ticket: SupportTicket) => {
    try {
      const response = await api.get(`/support-tickets/${ticket._id}`);
      setSelectedTicket(response.data.data);
      setShowDetailModal(true);
      setSearchParams({ view: ticket._id });
    } catch {
      setSelectedTicket(ticket);
      setShowDetailModal(true);
    }
  }, [setSearchParams]);

  const closeDetail = useCallback(() => {
    setShowDetailModal(false);
    setSelectedTicket(null);
    setReplyText('');
    setReplyAttachments([]);
    setEditingCommentId(null);
    setEditCommentText('');
    setDeletingCommentId(null);
    searchParams.delete('view');
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams]);

  // Open ticket from URL param
  useEffect(() => {
    const viewId = searchParams.get('view');
    if (viewId && ticketsData && !showDetailModal) {
      const ticket = ticketsData.find(t => t._id === viewId);
      if (ticket) {
        openTicketDetail(ticket);
      }
    }
  }, [searchParams, ticketsData, showDetailModal, openTicketDetail]);

  // Scroll to form when opened
  useEffect(() => {
    if (showCreateForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showCreateForm]);

  // --- Filter ---

  const filteredTickets = ticketsData?.filter(ticket => {
    if (filterStatus !== 'all' && ticket.status !== filterStatus) return false;
    if (filterCategory !== 'all' && ticket.category !== filterCategory) return false;
    if (filterPriority !== 'all' && ticket.priority !== filterPriority) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !ticket.subject.toLowerCase().includes(q) &&
        !ticket.description.toLowerCase().includes(q) &&
        !(ticket.ticketNumber && ticket.ticketNumber.toLowerCase().includes(q))
      ) return false;
    }
    return true;
  }) || [];

  // --- File Handlers ---

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>, target: 'ticket' | 'reply') => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast.error(`${file.name} is not an image or video`);
        return false;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 50MB limit`);
        return false;
      }
      return true;
    });
    if (target === 'ticket') {
      setTicketAttachments(prev => [...prev, ...validFiles].slice(0, 5));
    } else {
      setReplyAttachments(prev => [...prev, ...validFiles].slice(0, 5));
    }
    e.target.value = '';
  }, []);

  const renderAttachmentPreviews = (files: File[], onRemove: (index: number) => void) => {
    if (files.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {files.map((file, i) => (
          <div key={`${file.name}-${i}`} className="relative group">
            {file.type.startsWith('image/') ? (
              <img src={URL.createObjectURL(file)} alt={file.name} className="h-16 w-16 rounded-lg object-cover border border-gray-200 dark:border-gray-600" />
            ) : (
              <div className="h-16 w-16 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center">
                <span className="text-[10px] text-gray-500 dark:text-gray-400 text-center px-1 truncate">{file.name.split('.').pop()}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            >
              <XMarkIcon className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderSavedAttachments = (attachments: Attachment[] | undefined, bubbleStyle?: boolean) => {
    if (!attachments || attachments.length === 0) return null;
    return (
      <div className={`flex flex-wrap gap-2 ${bubbleStyle ? 'mt-2' : 'mt-3'}`}>
        {attachments.map((att, i) => (
          att.mimetype.startsWith('image/') ? (
            <img
              key={i}
              src={att.url}
              alt={att.filename}
              onClick={() => setLightboxImage(att.url)}
              className="h-20 w-20 rounded-lg object-cover border border-gray-200 dark:border-gray-600 cursor-pointer hover:opacity-90 transition-opacity"
            />
          ) : att.mimetype.startsWith('video/') ? (
            <video
              key={i}
              src={att.url}
              controls
              className="h-20 w-32 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
            />
          ) : null
        ))}
      </div>
    );
  };

  // --- Shared Ticket Form ---
  const renderTicketForm = (inline: boolean) => (
    <div className={inline ? '' : 'p-5 space-y-4'}>
      <div className={inline ? 'space-y-4' : 'space-y-4'}>
        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={newTicket.subject}
            onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
            placeholder="What do you need help with?"
            maxLength={200}
            className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Category & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
            <select
              value={newTicket.category}
              onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {Object.entries(categoryConfig).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.icon} {cfg.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Priority</label>
            <select
              value={newTicket.priority}
              onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {Object.entries(priorityConfig).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={newTicket.description}
            onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
            placeholder="Please describe your issue in detail. Include any relevant information that will help us assist you faster..."
            rows={5}
            className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Attachments */}
        <div>
          <input
            ref={ticketFileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e, 'ticket')}
          />
          <button
            type="button"
            onClick={() => ticketFileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-600"
          >
            <PhotoIcon className="h-4 w-4" />
            Attach Photos
            {ticketAttachments.length > 0 && (
              <span className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-1.5 py-0.5 rounded-full">
                {ticketAttachments.length}
              </span>
            )}
          </button>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Images and videos, max 5 files (50MB each)</p>
          {renderAttachmentPreviews(ticketAttachments, (i) => setTicketAttachments(prev => prev.filter((_, idx) => idx !== i)))}
        </div>

        {/* Actions */}
        <div className={`flex items-center ${inline ? 'justify-between' : 'justify-end'} gap-3 pt-1`}>
          {inline && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Our team typically responds within 24 hours
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (inline) { setShowCreateForm(false); } else { setShowCreateModal(false); }
                setNewTicket(initialFormState);
                setTicketAttachments([]);
              }}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateTicket}
              disabled={createMutation.isPending || !newTicket.subject.trim() || !newTicket.description.trim()}
              className="px-6 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm inline-flex items-center gap-2"
            >
              {createMutation.isPending ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="h-4 w-4" />
                  Submit Ticket
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // --- Render ---

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <LifebuoyIcon className="h-7 w-7 text-primary-600 dark:text-primary-400" />
              Support Tickets
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isAdmin ? 'Manage and respond to owner support tickets' : 'Need help? Submit a ticket and our team will assist you.'}
            </p>
          </div>
          {/* Admin uses modal, owner uses inline form toggle */}
          {isAdmin ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
            >
              <PlusIcon className="h-5 w-5" />
              New Ticket
            </button>
          ) : !showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
            >
              <PlusIcon className="h-5 w-5" />
              New Ticket
            </button>
          ) : null}
        </div>

        {/* Owner: Inline Create Ticket Form */}
        {!isAdmin && showCreateForm && (
          <div ref={formRef} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 dark:bg-primary-800/40 rounded-lg">
                  <TicketIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Submit a Support Ticket</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Fill out the form below and we'll get back to you as soon as possible.</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {renderTicketForm(true)}
            </div>
          </div>
        )}

        {/* Owner: Empty State with CTA when no tickets and form is hidden */}
        {!isAdmin && !isLoading && (!ticketsData || ticketsData.length === 0) && !showCreateForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-10 text-center">
            <div className="mx-auto w-16 h-16 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mb-4">
              <LifebuoyIcon className="h-8 w-8 text-primary-500 dark:text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">How can we help?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Have a question or running into an issue? Submit a support ticket and our team will get back to you as soon as possible.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
            >
              <PlusIcon className="h-5 w-5" />
              Submit Your First Ticket
            </button>
          </div>
        )}

        {/* Admin Stats */}
        {isAdmin && statsData && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Open', value: statsData.open, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800/30' },
              { label: 'In Progress', value: statsData.inProgress, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800/30' },
              { label: 'Awaiting', value: statsData.awaitingResponse, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800/30' },
              { label: 'Resolved', value: statsData.resolved, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800/30' },
              { label: 'Closed', value: statsData.closed, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-800', border: 'border-gray-200 dark:border-gray-700' },
            ].map(stat => (
              <div key={stat.label} className={`${stat.bg} rounded-lg p-3 text-center border ${stat.border}`}>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters — shown when there are tickets */}
        {ticketsData && ticketsData.length > 0 && (
          <>
            {/* Section heading for owner */}
            {!isAdmin && (
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Your Tickets</h2>
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full">
                  {ticketsData.length} {ticketsData.length === 1 ? 'ticket' : 'tickets'}
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                {Object.entries(statusConfig).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {Object.entries(categoryConfig).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Priorities</option>
                {Object.entries(priorityConfig).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* Tickets List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-primary-600 dark:border-gray-700 dark:border-t-primary-400"></div>
          </div>
        ) : filteredTickets.length === 0 && ticketsData && ticketsData.length > 0 ? (
          /* Empty filtered state — only when filters are active */
          <div className="text-center py-12">
            <MagnifyingGlassIcon className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No matching tickets</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : filteredTickets.length > 0 ? (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket._id}
                onClick={() => openTicketDetail(ticket)}
                className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 border-l-4 ${statusConfig[ticket.status]?.borderColor} p-4 hover:shadow-md dark:hover:shadow-gray-900/50 transition-all cursor-pointer group`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {ticket.ticketNumber && (
                        <span className="text-xs font-mono font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-1.5 py-0.5 rounded flex-shrink-0">
                          {ticket.ticketNumber}
                        </span>
                      )}
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {ticket.subject}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[ticket.status]?.bg} ${statusConfig[ticket.status]?.text}`}>
                        {statusConfig[ticket.status]?.label}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-600/40 dark:text-gray-300">
                        {categoryConfig[ticket.category]?.label}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${priorityConfig[ticket.priority]?.color}`}>
                        {priorityConfig[ticket.priority]?.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2.5 text-xs text-gray-500 dark:text-gray-400">
                      {isAdmin && (
                        <span className="flex items-center gap-1.5">
                          <UserCircleIcon className="h-3.5 w-3.5" />
                          {ticket.author.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <ClockIcon className="h-3.5 w-3.5" />
                        {formatTimeAgo(ticket.createdAt)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <ChatBubbleLeftIcon className="h-3.5 w-3.5" />
                        {ticket.commentsCount} {ticket.commentsCount === 1 ? 'reply' : 'replies'}
                      </span>
                    </div>
                  </div>
                  {ticket.priority === 'urgent' && (
                    <span className="flex-shrink-0 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse mt-1.5" title="Urgent" />
                  )}
                  {ticket.priority === 'high' && (
                    <span className="flex-shrink-0 h-2.5 w-2.5 rounded-full bg-orange-500 mt-1.5" title="High priority" />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Admin Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">New Support Ticket</h2>
              <button
                onClick={() => { setShowCreateModal(false); setNewTicket(initialFormState); }}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </button>
            </div>
            {renderTicketForm(false)}
          </div>
        </div>
      )}

      {/* Detail Modal — Conversation Thread */}
      {showDetailModal && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2">
                  {selectedTicket.ticketNumber && (
                    <span className="text-sm font-mono font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded flex-shrink-0">
                      {selectedTicket.ticketNumber}
                    </span>
                  )}
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 break-words leading-tight">
                    {selectedTicket.subject}
                  </h2>
                </div>
                <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[selectedTicket.status]?.bg} ${statusConfig[selectedTicket.status]?.text}`}>
                    {statusConfig[selectedTicket.status]?.label}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-600/40 dark:text-gray-300">
                    {categoryConfig[selectedTicket.category]?.label}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityConfig[selectedTicket.priority]?.color}`}>
                    {priorityConfig[selectedTicket.priority]?.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <UserCircleIcon className="h-3.5 w-3.5" />
                    {selectedTicket.author.name}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <span className="flex items-center gap-1.5">
                    <ClockIcon className="h-3.5 w-3.5" />
                    {formatDate(selectedTicket.createdAt)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {(user?._id === selectedTicket.author._id || isAdmin) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTicketToDelete(selectedTicket._id);
                      setShowDeleteModal(true);
                    }}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Delete ticket"
                  >
                    <TrashIcon className="h-5 w-5 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400" />
                  </button>
                )}
                <button
                  onClick={closeDetail}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </button>
              </div>
            </div>

            {/* Admin Status Controls */}
            {isAdmin && (
              <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-1">Status:</span>
                  {Object.entries(statusConfig).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => handleStatusChange(selectedTicket._id, key)}
                      disabled={selectedTicket.status === key || updateStatusMutation.isPending}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        selectedTicket.status === key
                          ? cfg.activeBg
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Conversation Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white dark:bg-gray-800/50">
              {/* Original description card */}
              <div className="bg-gray-50 dark:bg-gray-900/40 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2.5 mb-3">
                  {selectedTicket.author.profileImage ? (
                    <img
                      src={selectedTicket.author.profileImage}
                      alt={selectedTicket.author.name}
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-white dark:ring-gray-700"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center ring-2 ring-white dark:ring-gray-700">
                      <span className="text-xs font-medium text-white">{getInitials(selectedTicket.author.name)}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 block">{selectedTicket.author.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(selectedTicket.createdAt)}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{selectedTicket.description}</p>
                {renderSavedAttachments(selectedTicket.attachments)}
              </div>

              {/* Comments / Chat thread */}
              {selectedTicket.comments.length > 0 ? (
                <div className="space-y-4">
                  {selectedTicket.comments.map((comment) => {
                    const isOwn = user?._id === comment.user._id;
                    const isAdminMsg = comment.isAdminReply;

                    return (
                      <div
                        key={comment._id}
                        className={`flex items-end gap-2 ${isAdminMsg ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isAdminMsg && (
                          <div className="flex-shrink-0">
                            {comment.user.profileImage ? (
                              <img src={comment.user.profileImage} alt={comment.user.name} className="h-7 w-7 rounded-full object-cover" />
                            ) : (
                              <div className="h-7 w-7 rounded-full bg-gray-400 dark:bg-gray-600 flex items-center justify-center">
                                <span className="text-[10px] font-medium text-white">{getInitials(comment.user.name)}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="max-w-[75%]">
                          <div className={`flex items-center gap-2 mb-1 px-1 ${isAdminMsg ? 'justify-end' : ''}`}>
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              {comment.user.name}
                            </span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500">
                              {formatTimeAgo(comment.createdAt)}
                            </span>
                            {comment.editedAt && (
                              <span className="text-[10px] italic text-gray-400 dark:text-gray-500">(edited)</span>
                            )}
                          </div>

                          <div
                            className={`rounded-2xl px-4 py-2.5 ${
                              isAdminMsg
                                ? 'bg-primary-600 dark:bg-primary-700 text-white rounded-br-md'
                                : 'bg-gray-100 dark:bg-gray-700/80 text-gray-800 dark:text-gray-200 rounded-bl-md border border-gray-200 dark:border-gray-600'
                            }`}
                          >
                            {editingCommentId === comment._id ? (
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={editCommentText}
                                  onChange={(e) => setEditCommentText(e.target.value)}
                                  className="flex-1 px-2.5 py-1.5 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey && editCommentText.trim()) {
                                      e.preventDefault();
                                      editCommentMutation.mutate({ ticketId: selectedTicket._id, commentId: comment._id, text: editCommentText });
                                    }
                                  }}
                                  autoFocus
                                />
                                <button
                                  onClick={() => {
                                    if (editCommentText.trim()) {
                                      editCommentMutation.mutate({ ticketId: selectedTicket._id, commentId: comment._id, text: editCommentText });
                                    }
                                  }}
                                  disabled={!editCommentText.trim() || editCommentMutation.isPending}
                                  className="px-2.5 py-1.5 bg-primary-600 text-xs text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => { setEditingCommentId(null); setEditCommentText(''); }}
                                  className="px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : deletingCommentId === comment._id ? (
                              <div className="flex items-center gap-2">
                                <span className={`text-xs ${isAdminMsg ? 'text-red-200' : 'text-red-600 dark:text-red-400'}`}>Delete this reply?</span>
                                <button
                                  onClick={() => {
                                    deleteCommentMutation.mutate({ ticketId: selectedTicket._id, commentId: comment._id });
                                    setDeletingCommentId(null);
                                  }}
                                  disabled={deleteCommentMutation.isPending}
                                  className="px-2 py-0.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-md disabled:opacity-50"
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={() => setDeletingCommentId(null)}
                                  className={`px-2 py-0.5 text-xs ${isAdminMsg ? 'text-white/70 hover:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <>
                                {comment.text && <p className="text-sm whitespace-pre-wrap leading-relaxed">{comment.text}</p>}
                                {renderSavedAttachments(comment.attachments, true)}
                              </>
                            )}
                          </div>

                          {isOwn && editingCommentId !== comment._id && deletingCommentId !== comment._id && (
                            <div className={`flex gap-1 mt-1 px-1 ${isAdminMsg ? 'justify-end' : ''}`}>
                              <button
                                onClick={() => { setEditingCommentId(comment._id); setEditCommentText(comment.text); }}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                                title="Edit"
                              >
                                <PencilIcon className="h-3 w-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                              </button>
                              <button
                                onClick={() => setDeletingCommentId(comment._id)}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                                title="Delete"
                              >
                                <TrashIcon className="h-3 w-3 text-gray-400 hover:text-red-500" />
                              </button>
                            </div>
                          )}
                        </div>

                        {isAdminMsg && (
                          <div className="flex-shrink-0">
                            {comment.user.profileImage ? (
                              <img src={comment.user.profileImage} alt={comment.user.name} className="h-7 w-7 rounded-full object-cover" />
                            ) : (
                              <div className="h-7 w-7 rounded-full bg-primary-700 dark:bg-primary-800 flex items-center justify-center">
                                <span className="text-[10px] font-medium text-white">{getInitials(comment.user.name)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ChatBubbleLeftIcon className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 dark:text-gray-500">No replies yet</p>
                </div>
              )}
            </div>

            {/* Reply input */}
            {selectedTicket.status !== 'closed' && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                {renderAttachmentPreviews(replyAttachments, (i) => setReplyAttachments(prev => prev.filter((_, idx) => idx !== i)))}
                <div className="flex gap-2 items-end mt-1">
                  <input
                    ref={replyFileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, 'reply')}
                  />
                  <button
                    type="button"
                    onClick={() => replyFileInputRef.current?.click()}
                    className="flex-shrink-0 p-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
                    title="Attach photo"
                  >
                    <PhotoIcon className="h-5 w-5" />
                  </button>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    rows={2}
                    className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && (replyText.trim() || replyAttachments.length > 0)) {
                        e.preventDefault();
                        handleSendReply(selectedTicket._id);
                      }
                    }}
                  />
                  <button
                    onClick={() => handleSendReply(selectedTicket._id)}
                    disabled={(!replyText.trim() && replyAttachments.length === 0) || addCommentMutation.isPending}
                    className="flex-shrink-0 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                  >
                    <PaperAirplaneIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">Send</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
          <img
            src={lightboxImage}
            alt="Attachment"
            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && ticketToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Delete Ticket</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this ticket? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setTicketToDelete(null); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { if (ticketToDelete) deleteMutation.mutate(ticketToDelete); }}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SupportTickets;
