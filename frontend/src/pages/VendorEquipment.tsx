import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../config/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingBagIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  CurrencyDollarIcon,
  PhotoIcon,
  TagIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  EyeSlashIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import CustomSelect from '../components/CustomSelect';

interface Equipment {
  _id: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  description: string;
  price: string;
  priceNote?: string;
  image?: string;
  images?: string[];
  specifications?: Record<string, string>;
  features?: string[];
  availability: 'in-stock' | 'out-of-stock' | 'pre-order';
  warranty: string;
  leadTime: string;
  rating: number;
  reviews: number;
  isFeatured: boolean;
  isNewArrival: boolean;
  isActive: boolean;
  vendorId?: string;
  createdAt: string;
  updatedAt: string;
}

const categories = [
  { value: 'large-format-printers', label: 'Large Format Printers' },
  { value: 'vinyl-cutters', label: 'Vinyl Cutters' },
  { value: 'cnc-routers', label: 'CNC Routers' },
  { value: 'channel-letter', label: 'Channel Letter Equipment' },
  { value: 'welding', label: 'Welding Equipment' },
  { value: 'vehicles', label: 'Vehicles & Trucks' },
  { value: 'heat-transfer', label: 'Heat Press Equipment' },
  { value: 'laminators', label: 'Laminators' },
  { value: 'led-lighting', label: 'LED & Lighting' },
  { value: 'digital-displays', label: 'Digital Displays' },
  { value: 'hand-tools', label: 'Installation Tools' },
  { value: 'safety-equipment', label: 'Safety Equipment' },
];

const availabilityOptions = [
  { value: 'in-stock', label: 'In Stock' },
  { value: 'out-of-stock', label: 'Out of Stock' },
  { value: 'pre-order', label: 'Pre-Order' },
];

const emptyEquipment: Partial<Equipment> = {
  name: '',
  brand: '',
  model: '',
  category: '',
  description: '',
  price: '',
  priceNote: '',
  image: '',
  availability: 'in-stock',
  warranty: '1 Year',
  leadTime: '1-2 Weeks',
  features: [],
  specifications: {},
};

const VendorEquipment = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [formData, setFormData] = useState<Partial<Equipment>>(emptyEquipment);
  const [newFeature, setNewFeature] = useState('');
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string | null; name: string }>({
    show: false,
    id: null,
    name: ''
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Fetch vendor's equipment
  const { data: equipmentData, isLoading } = useQuery({
    queryKey: ['vendorEquipment'],
    queryFn: async () => {
      const response = await axios.get('/equipment/my-listings');
      return response.data;
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Partial<Equipment>) => {
      const response = await axios.post('/equipment', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorEquipment'] });
      setShowModal(false);
      setFormData(emptyEquipment);
      setSuccess('Equipment listing created successfully!');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to create equipment listing');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Equipment> }) => {
      const response = await axios.put(`/equipment/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorEquipment'] });
      setShowModal(false);
      setEditingEquipment(null);
      setFormData(emptyEquipment);
      setSuccess('Equipment listing updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to update equipment listing');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/equipment/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorEquipment'] });
      toast.success('Equipment listing deleted successfully!');
      setDeleteConfirm({ show: false, id: null, name: '' });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to delete equipment listing');
      setDeleteConfirm({ show: false, id: null, name: '' });
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await axios.put(`/equipment/${id}`, { isActive });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorEquipment'] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to update listing status');
    },
  });

  const equipment: Equipment[] = equipmentData?.data || [];

  // Filter equipment
  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenModal = (equipment?: Equipment) => {
    if (equipment) {
      setEditingEquipment(equipment);
      setFormData({
        ...equipment,
        features: equipment.features || [],
        specifications: equipment.specifications || {},
      });
      // Set image preview if equipment has an image
      if (equipment.image) {
        setImagePreview(equipment.image);
      }
    } else {
      setEditingEquipment(null);
      setFormData(emptyEquipment);
      setImagePreview(null);
    }
    setShowModal(true);
    setError('');
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.brand || !formData.category || !formData.price) {
      setError('Please fill in all required fields');
      return;
    }

    if (editingEquipment) {
      updateMutation.mutate({ id: editingEquipment._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = () => {
    if (deleteConfirm.id) {
      deleteMutation.mutate(deleteConfirm.id);
    }
  };

  const handleAddFeature = () => {
    if (newFeature.trim() && !formData.features?.includes(newFeature.trim())) {
      setFormData({
        ...formData,
        features: [...(formData.features || []), newFeature.trim()],
      });
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (feature: string) => {
    setFormData({
      ...formData,
      features: formData.features?.filter(f => f !== feature) || [],
    });
  };

  const handleAddSpec = () => {
    if (newSpecKey.trim() && newSpecValue.trim()) {
      setFormData({
        ...formData,
        specifications: {
          ...formData.specifications,
          [newSpecKey.trim()]: newSpecValue.trim(),
        },
      });
      setNewSpecKey('');
      setNewSpecValue('');
    }
  };

  const handleRemoveSpec = (key: string) => {
    const specs = { ...formData.specifications };
    delete specs[key];
    setFormData({ ...formData, specifications: specs });
  };

  // Handle image file selection and auto-upload
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file (JPG, PNG, GIF, etc.)');
        return;
      }
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB');
        return;
      }

      // Create preview URL immediately for better UX
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setError('');

      // Auto-upload the image
      setIsUploadingImage(true);

      try {
        const formDataUpload = new FormData();
        formDataUpload.append('images', file);

        const response = await axios.post('/equipment/upload-image', formDataUpload, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data.success) {
          // Set the uploaded image URL in form data
          setFormData(prev => ({ ...prev, image: response.data.data.url }));
          toast.success('Image uploaded successfully!');
        } else {
          setError(response.data.error || 'Failed to upload image');
          // Clear preview on error
          URL.revokeObjectURL(previewUrl);
          setImagePreview(null);
        }
      } catch (err: any) {
        console.error('Image upload error:', err);
        setError(err.response?.data?.error || 'Failed to upload image');
        // Clear preview on error
        URL.revokeObjectURL(previewUrl);
        setImagePreview(null);
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  // Clear image
  const handleClearImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    setFormData(prev => ({ ...prev, image: '' }));
  };

  const getCategoryLabel = (value: string) => {
    return categories.find(c => c.value === value)?.label || value;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your equipment listings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center">
                <ShoppingBagIcon className="h-8 w-8 mr-3" />
                My Equipment Listings
              </h1>
              <p className="mt-2 text-lg text-primary-100">
                Manage your equipment listings and reach more customers
              </p>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center px-4 py-2 bg-white text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Equipment
            </button>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center">
            <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
            <p className="text-green-800 dark:text-green-400">{success}</p>
          </div>
        </div>
      )}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <p className="text-red-800 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Listings</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{equipment.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{equipment.filter(e => e.isActive).length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Stock</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{equipment.filter(e => e.availability === 'in-stock').length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Featured</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">{equipment.filter(e => e.isFeatured).length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search your listings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="w-full sm:w-48">
            <CustomSelect
              value={filterCategory}
              onChange={setFilterCategory}
              options={[
                { value: 'all', label: 'All Categories' },
                ...categories,
              ]}
            />
          </div>
        </div>
      </div>

      {/* Equipment List */}
      {filteredEquipment.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
          <ShoppingBagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {equipment.length === 0 ? 'No equipment listings yet' : 'No matches found'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {equipment.length === 0
              ? 'Create your first equipment listing to start selling'
              : 'Try adjusting your search or filter criteria'}
          </p>
          {equipment.length === 0 && (
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Your First Listing
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEquipment.map((item) => (
            <div
              key={item._id}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden ${
                !item.isActive ? 'opacity-60' : ''
              }`}
            >
              {/* Image */}
              <div className="relative h-48 bg-gray-100 dark:bg-gray-700">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <PhotoIcon className="h-16 w-16 text-gray-300 dark:text-gray-600" />
                  </div>
                )}
                {/* Status Badges */}
                <div className="absolute top-2 left-2 flex flex-wrap gap-2">
                  {item.isFeatured && (
                    <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-medium rounded">
                      Featured
                    </span>
                  )}
                  {item.isNewArrival && (
                    <span className="px-2 py-1 bg-green-500 text-white text-xs font-medium rounded">
                      New
                    </span>
                  )}
                  {!item.isActive && (
                    <span className="px-2 py-1 bg-gray-500 text-white text-xs font-medium rounded">
                      Hidden
                    </span>
                  )}
                </div>
                {/* Availability Badge */}
                <span className={`absolute bottom-2 left-2 px-2 py-1 text-xs font-medium rounded ${
                  item.availability === 'in-stock'
                    ? 'bg-green-100 text-green-800'
                    : item.availability === 'pre-order'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {item.availability === 'in-stock' ? 'In Stock' : item.availability === 'pre-order' ? 'Pre-Order' : 'Out of Stock'}
                </span>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="mb-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.brand} • {item.model}</p>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">{item.name}</h3>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{item.price}</p>
                  <div className="flex items-center">
                    <StarSolidIcon className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                      {item.rating?.toFixed(1) || '0.0'} ({item.reviews || 0})
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  {getCategoryLabel(item.category)}
                </p>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => toggleActiveMutation.mutate({ id: item._id, isActive: !item.isActive })}
                    className={`inline-flex items-center text-sm font-medium ${
                      item.isActive
                        ? 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                        : 'text-green-600 hover:text-green-700'
                    }`}
                  >
                    {item.isActive ? (
                      <><EyeSlashIcon className="h-4 w-4 mr-1" /> Hide</>
                    ) : (
                      <><EyeIcon className="h-4 w-4 mr-1" /> Show</>
                    )}
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenModal(item)}
                      className="p-2 text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ show: true, id: item._id, name: item.name })}
                      className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {editingEquipment ? 'Edit Equipment' : 'Add New Equipment'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="space-y-6">
                  {/* Error Message inside modal */}
                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <div className="flex items-center">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0" />
                        <p className="text-red-800 dark:text-red-400 text-sm">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Equipment Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                        placeholder="Roland SOLJET Pro 4 XR-640"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Brand *
                      </label>
                      <input
                        type="text"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                        placeholder="Roland"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Model
                      </label>
                      <input
                        type="text"
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                        placeholder="XR-640"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Category *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Select category</option>
                        {categories.map((cat) => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Availability
                      </label>
                      <select
                        value={formData.availability}
                        onChange={(e) => setFormData({ ...formData, availability: e.target.value as Equipment['availability'] })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                      >
                        {availabilityOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                      placeholder="Describe the equipment..."
                    />
                  </div>

                  {/* Pricing */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Price *
                      </label>
                      <input
                        type="text"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                        placeholder="$24,999"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Price Note
                      </label>
                      <input
                        type="text"
                        value={formData.priceNote}
                        onChange={(e) => setFormData({ ...formData, priceNote: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                        placeholder="Starting at, Contact for pricing, etc."
                      />
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Product Image
                    </label>

                    {/* Image Preview */}
                    {(imagePreview || formData.image) && (
                      <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <img
                          src={imagePreview || formData.image}
                          alt="Preview"
                          className={`w-full h-full object-cover ${isUploadingImage ? 'opacity-50' : ''}`}
                        />
                        {/* Uploading overlay */}
                        {isUploadingImage && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <div className="flex flex-col items-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-3 border-white border-t-transparent mb-2" />
                              <span className="text-white text-sm font-medium">Uploading...</span>
                            </div>
                          </div>
                        )}
                        {/* Remove button - only show when not uploading */}
                        {!isUploadingImage && (
                          <button
                            type="button"
                            onClick={handleClearImage}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        )}
                        {/* Uploaded badge - show when image is uploaded and not currently uploading */}
                        {formData.image && !isUploadingImage && (
                          <div className="absolute bottom-2 left-2 px-2 py-1 bg-green-500 text-white text-xs rounded">
                            Uploaded
                          </div>
                        )}
                      </div>
                    )}

                    {/* Upload Area */}
                    {!imagePreview && !formData.image && (
                      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="flex flex-col items-center justify-center py-6">
                          <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mb-3" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium text-primary-600 dark:text-primary-400">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageSelect}
                        />
                      </label>
                    )}

                    {/* Change Image Button - show when image is already uploaded and not uploading */}
                    {formData.image && !isUploadingImage && (
                      <label className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                        <PhotoIcon className="h-4 w-4 mr-2" />
                        Change Image
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageSelect}
                        />
                      </label>
                    )}
                  </div>

                  {/* Other Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Warranty
                      </label>
                      <input
                        type="text"
                        value={formData.warranty}
                        onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                        placeholder="1 Year"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Lead Time
                      </label>
                      <input
                        type="text"
                        value={formData.leadTime}
                        onChange={(e) => setFormData({ ...formData, leadTime: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                        placeholder="1-2 Weeks"
                      />
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Features
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.features?.map((feature, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-400"
                        >
                          {feature}
                          <button onClick={() => handleRemoveFeature(feature)} className="ml-2">
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newFeature}
                        onChange={(e) => setNewFeature(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                        placeholder="Add a feature..."
                      />
                      <button
                        onClick={handleAddFeature}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <PlusIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Specifications */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Specifications
                    </label>
                    <div className="space-y-2 mb-2">
                      {Object.entries(formData.specifications || {}).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{key}:</span>
                          <span className="text-gray-600 dark:text-gray-400">{value}</span>
                          <button onClick={() => handleRemoveSpec(key)} className="ml-auto text-gray-500 hover:text-red-500">
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSpecKey}
                        onChange={(e) => setNewSpecKey(e.target.value)}
                        className="w-1/3 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                        placeholder="Spec name"
                      />
                      <input
                        type="text"
                        value={newSpecValue}
                        onChange={(e) => setNewSpecValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSpec())}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                        placeholder="Spec value"
                      />
                      <button
                        onClick={handleAddSpec}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <PlusIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingEquipment ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && createPortal(
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm({ show: false, id: null, name: '' })} />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
                Delete Equipment Listing?
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
                Are you sure you want to delete "{deleteConfirm.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setDeleteConfirm({ show: false, id: null, name: '' })}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default VendorEquipment;
