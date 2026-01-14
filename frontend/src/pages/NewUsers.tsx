import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/outline';
import api from '../config/axios';
import CustomSelect from '../components/CustomSelect';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'owner' | 'vendor';
  phone?: string;
  company?: string;
  isActive: boolean;
  createdAt: string;
}

const roleLabels = {
  admin: 'Administrator',
  owner: 'Owner',
  vendor: 'Vendor Partner',
};

const NewUsers = () => {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [sortBy, setSortBy] = useState('-createdAt');
  const [confirmAction, setConfirmAction] = useState<{
    type: 'approve' | 'reject';
    userId: string;
    userName?: string;
  } | null>(null);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setSearchQuery(searchInput);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setPage(1);
  };

  // Fetch pending users (inactive users awaiting approval)
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['new-users', page, searchQuery, sortBy],
    queryFn: async () => {
      const params = {
        page,
        limit,
        sort: sortBy,
        isActive: false, // Only fetch inactive/pending users
        ...(searchQuery && { search: searchQuery }),
      };

      const response = await api.get('/users', { params });
      return response.data;
    },
  });

  // Get total pages and users
  const total = usersData?.total || 0;
  const totalPages = Math.ceil(total / limit);
  const displayUsers: User[] = usersData?.data || [];

  // Approve user mutation
  const approveUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.put(`/users/${userId}`, { isActive: true });
      return response.data;
    },
    onSuccess: () => {
      toast.success('User approved successfully');
      queryClient.invalidateQueries({ queryKey: ['new-users'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to approve user');
    },
  });

  // Reject/Delete user mutation
  const rejectUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.delete(`/users/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('User request rejected');
      queryClient.invalidateQueries({ queryKey: ['new-users'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to reject user');
    },
  });

  const handleApprove = (userId: string, userName?: string) => {
    setConfirmAction({ type: 'approve', userId, userName });
  };

  const handleReject = (userId: string, userName: string) => {
    setConfirmAction({ type: 'reject', userId, userName });
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'approve') {
      approveUserMutation.mutate(confirmAction.userId);
    } else {
      rejectUserMutation.mutate(confirmAction.userId);
    }
    setConfirmAction(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-l-4 border-amber-500 rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Pending User Requests
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Review and approve new user registrations awaiting admin approval
        </p>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or company..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
          >
            Search
          </button>
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded-lg transition-colors"
            >
              Clear
            </button>
          )}
        </form>

        <div className="flex gap-2">
          <CustomSelect
            value={sortBy}
            onChange={setSortBy}
            options={[
              { value: '-createdAt', label: 'Newest First' },
              { value: 'createdAt', label: 'Oldest First' },
              { value: 'name', label: 'Name (A-Z)' },
              { value: '-name', label: 'Name (Z-A)' },
            ]}
            placeholder="Sort by..."
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-cyan-600"></div>
          </div>
        ) : displayUsers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery ? 'No users found matching your search.' : 'No pending user requests at this time.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {displayUsers.map((user: User) => (
                    <tr
                      key={user._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                          <EnvelopeIcon className="h-4 w-4 flex-shrink-0" />
                          <a
                            href={`mailto:${user.email}`}
                            className="hover:text-cyan-600 dark:hover:text-cyan-400"
                          >
                            {user.email}
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                            user.role === 'admin'
                              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                              : user.role === 'vendor'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                          }`}
                        >
                          {roleLabels[user.role]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.company ? (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                            <BuildingOfficeIcon className="h-4 w-4 flex-shrink-0" />
                            {user.company}
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                          <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                            user.isActive
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {user.isActive ? 'Active' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(user._id, user.name)}
                            disabled={approveUserMutation.isPending || rejectUserMutation.isPending}
                            className="inline-flex items-center justify-center p-2 text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Approve user"
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleReject(user._id, user.name)}
                            disabled={approveUserMutation.isPending || rejectUserMutation.isPending}
                            className="inline-flex items-center justify-center p-2 text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Reject user"
                          >
                            <XCircleIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`p-3 rounded-full ${
                  confirmAction.type === 'approve'
                    ? 'bg-emerald-100 dark:bg-emerald-900/30'
                    : 'bg-red-100 dark:bg-red-900/30'
                }`}
              >
                {confirmAction.type === 'approve' ? (
                  <ShieldCheckIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <NoSymbolIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {confirmAction.type === 'approve' ? 'Approve User' : 'Reject Registration'}
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {confirmAction.type === 'approve'
                ? 'Are you sure you want to approve this user? They will be able to access the system.'
                : `Are you sure you want to reject ${confirmAction.userName || 'this user'}'s registration? This action cannot be undone.`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                disabled={approveUserMutation.isPending || rejectUserMutation.isPending}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={approveUserMutation.isPending || rejectUserMutation.isPending}
                className={`flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                  confirmAction.type === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {approveUserMutation.isPending || rejectUserMutation.isPending
                  ? 'Processing...'
                  : confirmAction.type === 'approve'
                  ? 'Approve'
                  : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewUsers;
