import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from '../config/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  BuildingStorefrontIcon,
  PencilIcon,
  PhotoIcon,
  DocumentTextIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  TagIcon,
  StarIcon,
  ExclamationTriangleIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface SpecialOffer {
  _id?: string;
  title: string;
  description: string;
  validUntil: string;
  code: string;
  discountPercent?: number;
}

interface Document {
  _id?: string;
  title: string;
  fileUrl: string;
  fileType: string;
}

interface Partner {
  _id: string;
  name: string;
  description: string;
  logo: string;
  logoUrl?: string;
  category: string;
  country: string;
  contact: {
    contactPerson: string;
    email: string;
    phone: string;
    website: string;
    address: string;
  };
  specialties: string[];
  benefits: string[];
  discount: string;
  yearEstablished?: number;
  locations?: number;
  specialOffers: SpecialOffer[];
  documents: Document[];
  rating: number;
  reviewCount: number;
  isActive: boolean;
  isFeatured: boolean;
  isVerified: boolean;
}

const categories = [
  'Materials & Supplies',
  'Equipment',
  'Distributor',
  'Services',
  'Software',
  'Financing',
  'Insurance',
  'Other'
];

const countries = ['USA', 'Canada', 'Both'];

const VendorProfile = () => {
  const { user } = useAuth();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo: '',
    category: '',
    country: 'USA',
    contact: {
      contactPerson: '',
      email: '',
      phone: '',
      website: '',
      address: '',
    },
    specialties: [] as string[],
    benefits: [] as string[],
    discount: '',
    yearEstablished: undefined as number | undefined,
    locations: 1,
  });

  const [newSpecialty, setNewSpecialty] = useState('');
  const [newBenefit, setNewBenefit] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Modal states
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<SpecialOffer | null>(null);
  const [newOffer, setNewOffer] = useState<SpecialOffer>({
    title: '',
    description: '',
    validUntil: '',
    code: '',
    discountPercent: undefined,
  });
  const [newDocument, setNewDocument] = useState({
    title: '',
    fileUrl: '',
    fileType: 'pdf',
  });

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    type: 'offer' | 'document' | null;
    id: string | null;
    title: string;
  }>({ show: false, type: null, id: null, title: '' });

  useEffect(() => {
    fetchPartnerProfile();
  }, []);

  const fetchPartnerProfile = async () => {
    try {
      const response = await axios.get('/partners/my-profile');
      const data = response.data.data;
      setPartner(data);
      setFormData({
        name: data.name || '',
        description: data.description || '',
        logo: data.logo || data.logoUrl || '',
        category: data.category || '',
        country: data.country || 'USA',
        contact: {
          contactPerson: data.contact?.contactPerson || '',
          email: data.contact?.email || '',
          phone: data.contact?.phone || '',
          website: data.contact?.website || '',
          address: data.contact?.address || '',
        },
        specialties: data.specialties || [],
        benefits: data.benefits || [],
        discount: data.discount || '',
        yearEstablished: data.yearEstablished,
        locations: data.locations || 1,
      });
      setError('');
    } catch (err: any) {
      if (err.response?.status === 404) {
        // No profile found - allow creating one
        setIsCreatingProfile(true);
        // Pre-fill with user info if available
        setFormData(prev => ({
          ...prev,
          name: user?.companyName || '',
          contact: {
            ...prev.contact,
            contactPerson: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : '',
            email: user?.email || '',
          },
        }));
      } else {
        setError(err.response?.data?.error || 'Failed to load partner profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async () => {
    if (!formData.name || !formData.category) {
      setError('Please fill in company name and category');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await axios.post('/partners', {
        ...formData,
        logoUrl: formData.logo,
      });
      setPartner(response.data.data);
      setIsCreatingProfile(false);
      setSuccess('Business profile created successfully!');
      toast.success('Your business profile has been created!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!partner) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.put(`/partners/${partner._id}`, {
        ...formData,
        logoUrl: formData.logo,
      });
      setPartner(response.data.data);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset form data to current partner data
    if (partner) {
      setFormData({
        name: partner.name || '',
        description: partner.description || '',
        logo: partner.logo || partner.logoUrl || '',
        category: partner.category || '',
        country: partner.country || 'USA',
        contact: {
          contactPerson: partner.contact?.contactPerson || '',
          email: partner.contact?.email || '',
          phone: partner.contact?.phone || '',
          website: partner.contact?.website || '',
          address: partner.contact?.address || '',
        },
        specialties: partner.specialties || [],
        benefits: partner.benefits || [],
        discount: partner.discount || '',
        yearEstablished: partner.yearEstablished,
        locations: partner.locations || 1,
      });
    }
    setIsEditing(false);
    setError('');
  };

  const handleAddSpecialty = () => {
    if (newSpecialty.trim() && !formData.specialties.includes(newSpecialty.trim())) {
      setFormData({
        ...formData,
        specialties: [...formData.specialties, newSpecialty.trim()],
      });
      setNewSpecialty('');
    }
  };

  const handleRemoveSpecialty = (specialty: string) => {
    setFormData({
      ...formData,
      specialties: formData.specialties.filter(s => s !== specialty),
    });
  };

  const handleAddBenefit = () => {
    if (newBenefit.trim() && !formData.benefits.includes(newBenefit.trim())) {
      setFormData({
        ...formData,
        benefits: [...formData.benefits, newBenefit.trim()],
      });
      setNewBenefit('');
    }
  };

  const handleRemoveBenefit = (benefit: string) => {
    setFormData({
      ...formData,
      benefits: formData.benefits.filter(b => b !== benefit),
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploadingLogo(true);
    try {
      const uploadData = new FormData();
      uploadData.append('logo', file);

      const response = await axios.post('/partners/upload-logo', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setFormData({ ...formData, logo: response.data.data.logoUrl });
        toast.success('Logo uploaded successfully!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveOffer = async () => {
    if (!partner || !newOffer.title || !newOffer.description || !newOffer.validUntil) {
      setError('Please fill in all required offer fields');
      return;
    }

    setSaving(true);
    try {
      const offers = editingOffer
        ? partner.specialOffers.map(o => o._id === editingOffer._id ? newOffer : o)
        : [...partner.specialOffers, newOffer];

      const response = await axios.put(`/partners/${partner._id}`, {
        specialOffers: offers,
      });
      setPartner(response.data.data);
      setShowOfferModal(false);
      setEditingOffer(null);
      setNewOffer({ title: '', description: '', validUntil: '', code: '', discountPercent: undefined });
      setSuccess('Offer saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save offer');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (!partner) return;

    setSaving(true);
    try {
      const offers = partner.specialOffers.filter(o => o._id !== offerId);
      const response = await axios.put(`/partners/${partner._id}`, {
        specialOffers: offers,
      });
      setPartner(response.data.data);
      toast.success('Offer deleted successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete offer');
    } finally {
      setSaving(false);
      setConfirmModal({ show: false, type: null, id: null, title: '' });
    }
  };

  const handleSaveDocument = async () => {
    if (!partner || !newDocument.title || !newDocument.fileUrl) {
      setError('Please fill in all required document fields');
      return;
    }

    setSaving(true);
    try {
      const documents = [...partner.documents, newDocument];
      const response = await axios.put(`/partners/${partner._id}`, {
        documents: documents,
      });
      setPartner(response.data.data);
      setShowDocumentModal(false);
      setNewDocument({ title: '', fileUrl: '', fileType: 'pdf' });
      setSuccess('Document added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add document');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!partner) return;

    setSaving(true);
    try {
      const documents = partner.documents.filter(d => d._id !== docId);
      const response = await axios.put(`/partners/${partner._id}`, {
        documents: documents,
      });
      setPartner(response.data.data);
      toast.success('Document deleted successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete document');
    } finally {
      setSaving(false);
      setConfirmModal({ show: false, type: null, id: null, title: '' });
    }
  };

  // Handle confirmation modal action
  const handleConfirmDelete = () => {
    if (confirmModal.type === 'offer' && confirmModal.id) {
      handleDeleteOffer(confirmModal.id);
    } else if (confirmModal.type === 'document' && confirmModal.id) {
      handleDeleteDocument(confirmModal.id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show create profile form if no profile exists
  if (isCreatingProfile && !partner) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-8 sm:px-8 sm:py-10">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-white/20 flex items-center justify-center mb-4">
                <BuildingStorefrontIcon className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Create Your Business Profile
              </h1>
              <p className="mt-2 text-lg text-primary-100">
                Set up your partner profile to appear in the Partners directory
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
              <p className="text-red-800 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Create Profile Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Your company name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={formData.contact.contactPerson}
                  onChange={(e) => setFormData({
                    ...formData,
                    contact: { ...formData.contact, contactPerson: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="John Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.contact.email}
                  onChange={(e) => setFormData({
                    ...formData,
                    contact: { ...formData.contact, email: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="contact@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Country
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {countries.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company Logo
                </label>
                <div className="flex items-center gap-4">
                  {formData.logo ? (
                    <img
                      src={formData.logo}
                      alt="Logo preview"
                      className="h-16 w-16 rounded-lg object-cover border border-gray-300 dark:border-gray-600"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center border border-gray-300 dark:border-gray-600">
                      <PhotoIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        disabled={uploadingLogo}
                      />
                      <span className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                        {uploadingLogo ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
                            Upload Logo
                          </>
                        )}
                      </span>
                    </label>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      PNG, JPG up to 5MB
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Describe your company and what you offer..."
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleCreateProfile}
                disabled={saving}
                className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-5 w-5 mr-2" />
                    Create Business Profile
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Note:</strong> After creating your profile, you can add more details like specialties, benefits, special offers, and documents.
          </p>
        </div>
      </div>
    );
  }

  if (error && !partner) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-400">Error Loading Profile</h3>
              <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', name: 'Profile Info', icon: BuildingStorefrontIcon },
    { id: 'contact', name: 'Contact', icon: EnvelopeIcon },
    { id: 'services', name: 'Services', icon: TagIcon },
    { id: 'offers', name: 'Special Offers', icon: StarIcon },
    { id: 'documents', name: 'Documents', icon: DocumentTextIcon },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {formData.logo ? (
                <img
                  src={formData.logo}
                  alt={formData.name}
                  className="h-16 w-16 rounded-lg object-cover border-2 border-white/30"
                />
              ) : (
                <div className="h-16 w-16 rounded-lg bg-white/20 flex items-center justify-center">
                  <BuildingStorefrontIcon className="h-8 w-8 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center">
                  <PencilIcon className="h-6 w-6 mr-2" />
                  Manage Profile
                </h1>
                <p className="mt-1 text-lg text-primary-100">
                  Update your partner profile information
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 bg-white/20 text-white font-medium rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
                  >
                    <XMarkIcon className="h-5 w-5 mr-2" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 bg-white text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-5 w-5 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-4 py-2 bg-white text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors"
                >
                  <PencilIcon className="h-5 w-5 mr-2" />
                  Edit Profile
                </button>
              )}
            </div>
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

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Info Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
                    placeholder="Your company name"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Company Logo
                  </label>
                  <div className="flex items-center gap-4">
                    {formData.logo ? (
                      <img
                        src={formData.logo}
                        alt="Logo preview"
                        className="h-20 w-20 rounded-lg object-cover border border-gray-300 dark:border-gray-600"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center border border-gray-300 dark:border-gray-600">
                        <PhotoIcon className="h-10 w-10 text-gray-400" />
                      </div>
                    )}
                    {isEditing && (
                      <div>
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                            disabled={uploadingLogo}
                          />
                          <span className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                            {uploadingLogo ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                                Uploading...
                              </>
                            ) : (
                              <>
                                <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
                                {formData.logo ? 'Change Logo' : 'Upload Logo'}
                              </>
                            )}
                          </span>
                        </label>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Country
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {countries.map((country) => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Year Established
                  </label>
                  <input
                    type="number"
                    value={formData.yearEstablished || ''}
                    onChange={(e) => setFormData({ ...formData, yearEstablished: e.target.value ? parseInt(e.target.value) : undefined })}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
                    placeholder="2010"
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Number of Locations
                  </label>
                  <input
                    type="number"
                    value={formData.locations}
                    onChange={(e) => setFormData({ ...formData, locations: parseInt(e.target.value) || 1 })}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={!isEditing}
                  rows={4}
                  className={`w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
                  placeholder="Describe your company and what you offer..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Member Discount
                </label>
                <input
                  type="text"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
                  placeholder="e.g., 10% off all orders"
                />
              </div>
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <span className="flex items-center"><span className="mr-2">Contact Person</span></span>
                  </label>
                  <input
                    type="text"
                    value={formData.contact.contactPerson}
                    onChange={(e) => setFormData({
                      ...formData,
                      contact: { ...formData.contact, contactPerson: e.target.value }
                    })}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
                    placeholder="John Smith"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <span className="flex items-center"><EnvelopeIcon className="h-4 w-4 mr-2" /> Email</span>
                  </label>
                  <input
                    type="email"
                    value={formData.contact.email}
                    onChange={(e) => setFormData({
                      ...formData,
                      contact: { ...formData.contact, email: e.target.value }
                    })}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
                    placeholder="contact@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <span className="flex items-center"><PhoneIcon className="h-4 w-4 mr-2" /> Phone</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.contact.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      contact: { ...formData.contact, phone: e.target.value }
                    })}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <span className="flex items-center"><GlobeAltIcon className="h-4 w-4 mr-2" /> Website</span>
                  </label>
                  <input
                    type="url"
                    value={formData.contact.website}
                    onChange={(e) => setFormData({
                      ...formData,
                      contact: { ...formData.contact, website: e.target.value }
                    })}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
                    placeholder="https://www.company.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <span className="flex items-center"><MapPinIcon className="h-4 w-4 mr-2" /> Address</span>
                </label>
                <textarea
                  value={formData.contact.address}
                  onChange={(e) => setFormData({
                    ...formData,
                    contact: { ...formData.contact, address: e.target.value }
                  })}
                  disabled={!isEditing}
                  rows={2}
                  className={`w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
                  placeholder="123 Main St, City, State 12345"
                />
              </div>
            </div>
          )}

          {/* Services Tab */}
          {activeTab === 'services' && (
            <div className="space-y-8">
              {/* Specialties */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Specialties / Services</h4>
                <div className="flex flex-wrap gap-2 mb-4">
                  {formData.specialties.length > 0 ? formData.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-400"
                    >
                      {specialty}
                      {isEditing && (
                        <button
                          onClick={() => handleRemoveSpecialty(specialty)}
                          className="ml-2 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </span>
                  )) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No specialties added yet</p>
                  )}
                </div>
                {isEditing && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSpecialty}
                      onChange={(e) => setNewSpecialty(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSpecialty())}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Add a specialty..."
                    />
                    <button
                      onClick={handleAddSpecialty}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <PlusIcon className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Benefits */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Benefits for Members</h4>
                <div className="flex flex-wrap gap-2 mb-4">
                  {formData.benefits.length > 0 ? formData.benefits.map((benefit, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                    >
                      {benefit}
                      {isEditing && (
                        <button
                          onClick={() => handleRemoveBenefit(benefit)}
                          className="ml-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </span>
                  )) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No benefits added yet</p>
                  )}
                </div>
                {isEditing && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newBenefit}
                      onChange={(e) => setNewBenefit(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBenefit())}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Add a benefit..."
                    />
                    <button
                      onClick={handleAddBenefit}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <PlusIcon className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Special Offers Tab */}
          {activeTab === 'offers' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">Your Special Offers</h4>
                <button
                  onClick={() => {
                    setEditingOffer(null);
                    setNewOffer({ title: '', description: '', validUntil: '', code: '', discountPercent: undefined });
                    setShowOfferModal(true);
                  }}
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Offer
                </button>
              </div>

              {partner?.specialOffers && partner.specialOffers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {partner.specialOffers.map((offer) => (
                    <div key={offer._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900 dark:text-gray-100">{offer.title}</h5>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{offer.description}</p>
                        </div>
                        {offer.discountPercent && (
                          <span className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded text-sm font-medium">
                            {offer.discountPercent}% OFF
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {offer.code && (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm font-mono">
                              {offer.code}
                            </span>
                          )}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Valid until {format(new Date(offer.validUntil), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingOffer(offer);
                              setNewOffer({
                                ...offer,
                                validUntil: format(new Date(offer.validUntil), 'yyyy-MM-dd'),
                              });
                              setShowOfferModal(true);
                            }}
                            className="p-1 text-gray-500 hover:text-primary-600 dark:hover:text-primary-400"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => offer._id && setConfirmModal({
                              show: true,
                              type: 'offer',
                              id: offer._id,
                              title: offer.title
                            })}
                            className="p-1 text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                  <StarIcon className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No special offers yet</h4>
                  <p className="text-gray-500 dark:text-gray-400">Create your first offer to attract more customers</p>
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">Documents & Collateral</h4>
                <button
                  onClick={() => {
                    setNewDocument({ title: '', fileUrl: '', fileType: 'pdf' });
                    setShowDocumentModal(true);
                  }}
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Document
                </button>
              </div>

              {partner?.documents && partner.documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {partner.documents.map((doc) => (
                    <div key={doc._id} className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex-shrink-0 h-10 w-10 bg-primary-50 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                        <DocumentTextIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{doc.title}</h5>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{doc.fileType.toUpperCase()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
                        >
                          View
                        </a>
                        <button
                          onClick={() => doc._id && setConfirmModal({
                            show: true,
                            type: 'document',
                            id: doc._id,
                            title: doc.title
                          })}
                          className="p-1 text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                  <PhotoIcon className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No documents yet</h4>
                  <p className="text-gray-500 dark:text-gray-400">Upload brochures, catalogs, or certification documents</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Offer Modal */}
      {showOfferModal && createPortal(
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowOfferModal(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {editingOffer ? 'Edit Offer' : 'Add New Offer'}
                </h3>
                <button onClick={() => setShowOfferModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title *</label>
                  <input
                    type="text"
                    value={newOffer.title}
                    onChange={(e) => setNewOffer({ ...newOffer, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                    placeholder="Summer Sale"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description *</label>
                  <textarea
                    value={newOffer.description}
                    onChange={(e) => setNewOffer({ ...newOffer, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                    placeholder="Describe your offer..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Valid Until *</label>
                    <input
                      type="date"
                      value={newOffer.validUntil}
                      onChange={(e) => setNewOffer({ ...newOffer, validUntil: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Discount %</label>
                    <input
                      type="number"
                      value={newOffer.discountPercent || ''}
                      onChange={(e) => setNewOffer({ ...newOffer, discountPercent: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                      placeholder="10"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Promo Code</label>
                  <input
                    type="text"
                    value={newOffer.code}
                    onChange={(e) => setNewOffer({ ...newOffer, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 font-mono"
                    placeholder="SUMMER2024"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowOfferModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveOffer}
                  disabled={saving}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Offer'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Document Modal */}
      {showDocumentModal && createPortal(
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDocumentModal(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add Document</h3>
                <button onClick={() => setShowDocumentModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Document Title *</label>
                  <input
                    type="text"
                    value={newDocument.title}
                    onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                    placeholder="Product Catalog 2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">File URL *</label>
                  <input
                    type="url"
                    value={newDocument.fileUrl}
                    onChange={(e) => setNewDocument({ ...newDocument, fileUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">File Type</label>
                  <select
                    value={newDocument.fileType}
                    onChange={(e) => setNewDocument({ ...newDocument, fileType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="pdf">PDF</option>
                    <option value="doc">DOC</option>
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowDocumentModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDocument}
                  disabled={saving}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Add Document'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirmation Modal */}
      {confirmModal.show && createPortal(
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmModal({ show: false, type: null, id: null, title: '' })} />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
                Delete {confirmModal.type === 'offer' ? 'Offer' : 'Document'}?
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
                Are you sure you want to delete "{confirmModal.title}"? This action cannot be undone.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setConfirmModal({ show: false, type: null, id: null, title: '' })}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {saving ? 'Deleting...' : 'Delete'}
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

export default VendorProfile;
