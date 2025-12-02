import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingBagIcon,
  CpuChipIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
  MagnifyingGlassIcon,
  TagIcon,
  ShieldCheckIcon,
  SparklesIcon,
  HeartIcon,
  ShoppingCartIcon,
  CheckIcon,
  InformationCircleIcon,
  ClockIcon,
  Squares2X2Icon,
  ListBulletIcon,
  XMarkIcon,
  TrashIcon,
  PlusIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon, HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import CustomSelect from '../components/CustomSelect';
import { getEquipment, getEquipmentStats } from '../services/equipmentService';
import type { Equipment as EquipmentType } from '../services/equipmentService';

// Category configuration with icons
const categoryConfig: { [key: string]: { name: string; icon: React.ComponentType<{ className?: string }> } } = {
  'all': { name: 'All Equipment', icon: ShoppingBagIcon },
  'large-format-printers': { name: 'Large Format Printers', icon: CpuChipIcon },
  'vinyl-cutters': { name: 'Vinyl Cutters', icon: WrenchScrewdriverIcon },
  'cnc-routers': { name: 'CNC Routers', icon: Squares2X2Icon },
  'channel-letter': { name: 'Channel Letter Equipment', icon: WrenchScrewdriverIcon },
  'welding': { name: 'Welding Equipment', icon: SparklesIcon },
  'vehicles': { name: 'Vehicles & Trucks', icon: TruckIcon },
  'heat-transfer': { name: 'Heat Press Equipment', icon: WrenchScrewdriverIcon },
  'laminators': { name: 'Laminators', icon: Squares2X2Icon },
  'led-lighting': { name: 'LED & Lighting', icon: SparklesIcon },
  'digital-displays': { name: 'Digital Displays', icon: CpuChipIcon },
  'hand-tools': { name: 'Installation Tools', icon: WrenchScrewdriverIcon },
  'safety-equipment': { name: 'Safety Equipment', icon: ShieldCheckIcon },
};

// Cart item type
interface CartItem {
  equipment: EquipmentType;
  quantity: number;
}

// Helper functions to load from localStorage with user-specific keys
const loadCartFromStorage = (userId: string | undefined): CartItem[] => {
  if (!userId) return [];
  try {
    const stored = localStorage.getItem(`equipment-cart-${userId}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const loadFavoritesFromStorage = (userId: string | undefined): Set<string> => {
  if (!userId) return new Set();
  try {
    const stored = localStorage.getItem(`equipment-favorites-${userId}`);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

const Equipment = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('featured');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());

  // Modal states
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentType | null>(null);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [showWishlistDrawer, setShowWishlistDrawer] = useState(false);

  // Load cart and favorites when user changes
  useEffect(() => {
    if (user?.id) {
      setCartItems(loadCartFromStorage(user.id));
      setFavorites(loadFavoritesFromStorage(user.id));
    } else {
      setCartItems([]);
      setFavorites(new Set());
    }
  }, [user?.id]);

  // Persist cart to localStorage with user-specific key
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`equipment-cart-${user.id}`, JSON.stringify(cartItems));
    }
  }, [cartItems, user?.id]);

  // Persist favorites to localStorage with user-specific key
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`equipment-favorites-${user.id}`, JSON.stringify(Array.from(favorites)));
    }
  }, [favorites, user?.id]);

  // Fetch equipment from API
  const { data: equipmentData, isLoading: equipmentLoading } = useQuery({
    queryKey: ['equipment', selectedCategory, searchQuery, sortBy, page, Array.from(selectedBrands)],
    queryFn: () => getEquipment({
      category: selectedCategory,
      search: searchQuery,
      sort: sortBy as 'featured' | 'price-low' | 'price-high' | 'rating' | 'name',
      page,
      limit: 20,
      brand: selectedBrands.size > 0 ? Array.from(selectedBrands).join(',') : undefined,
    }),
  });

  // Fetch stats for category counts and brands
  const { data: statsData } = useQuery({
    queryKey: ['equipmentStats'],
    queryFn: getEquipmentStats,
    staleTime: 0, // Always refetch to get latest brands/categories
    refetchOnMount: 'always',
  });

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

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setPage(1);
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => {
      const newBrands = new Set(prev);
      if (newBrands.has(brand)) {
        newBrands.delete(brand);
      } else {
        newBrands.add(brand);
      }
      return newBrands;
    });
    setPage(1);
  };

  const toggleFavorite = (equipmentId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(equipmentId)) {
        newFavorites.delete(equipmentId);
      } else {
        newFavorites.add(equipmentId);
      }
      return newFavorites;
    });
  };

  const addToCart = (equipment: EquipmentType) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.equipment._id === equipment._id);
      if (existing) {
        return prev.map(item =>
          item.equipment._id === equipment._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { equipment, quantity: 1 }];
    });
  };

  const removeFromCart = (equipmentId: string) => {
    setCartItems(prev => prev.filter(item => item.equipment._id !== equipmentId));
  };

  const updateCartQuantity = (equipmentId: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.equipment._id === equipmentId) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const isInCart = (equipmentId: string) => {
    return cartItems.some(item => item.equipment._id === equipmentId);
  };

  const equipmentList = equipmentData?.data || [];
  const stats = statsData?.data;
  const pagination = equipmentData?.pagination;

  // Get favorite items from equipment list
  const favoriteItems = equipmentList.filter(item => favorites.has(item._id));

  // Build categories list with counts
  const categories = [
    { key: 'all', name: 'All Equipment', icon: ShoppingBagIcon, count: stats?.totalEquipment || 0 },
    ...Object.entries(categoryConfig)
      .filter(([key]) => key !== 'all')
      .map(([key, config]) => ({
        key,
        name: config.name,
        icon: config.icon,
        count: stats?.categoryCounts?.[key] || 0,
      })),
  ];

  // Get unique brands from stats
  const brands = stats?.brands || [];

  // Calculate cart total
  const cartTotal = cartItems.reduce((total, item) => {
    const priceStr = item.equipment.price.replace(/[^0-9.]/g, '');
    const price = parseFloat(priceStr) || 0;
    return total + (price * item.quantity);
  }, 0);

  // Equipment Detail Modal
  const EquipmentDetailModal = () => {
    if (!selectedEquipment) return null;

    return createPortal(
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedEquipment(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Close button */}
            <button
              onClick={() => setSelectedEquipment(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 dark:bg-gray-700/90 hover:bg-white dark:hover:bg-gray-700 transition-colors"
            >
              <XMarkIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
            </button>

            <div className="overflow-y-auto max-h-[90vh]">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Image */}
                <div className="relative">
                  <img
                    src={selectedEquipment.image || 'https://via.placeholder.com/600x400?text=Equipment'}
                    alt={selectedEquipment.name}
                    className="w-full h-64 lg:h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    {selectedEquipment.isNewArrival && (
                      <span className="px-3 py-1 bg-green-500 text-white text-sm font-medium rounded-full">New</span>
                    )}
                    {selectedEquipment.isFeatured && (
                      <span className="px-3 py-1 bg-yellow-400 text-yellow-900 text-sm font-medium rounded-full">Featured</span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="p-6 lg:p-8">
                  <div className="mb-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{selectedEquipment.brand} • {selectedEquipment.model}</span>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{selectedEquipment.name}</h2>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center">
                      <StarSolidIcon className="h-5 w-5 text-yellow-400" />
                      <span className="ml-1 font-semibold text-gray-900 dark:text-gray-100">{selectedEquipment.rating}</span>
                      <span className="ml-1 text-gray-500 dark:text-gray-400">({selectedEquipment.reviews} reviews)</span>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                      selectedEquipment.availability === 'in-stock'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {selectedEquipment.availability === 'in-stock' ? 'In Stock' : selectedEquipment.availability === 'pre-order' ? 'Pre-Order' : 'Out of Stock'}
                    </span>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 mb-6">{selectedEquipment.description}</p>

                  <div className="mb-6">
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{selectedEquipment.price}</p>
                    {selectedEquipment.priceNote && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{selectedEquipment.priceNote}</p>
                    )}
                  </div>

                  {/* Specifications */}
                  {selectedEquipment.specifications && Object.keys(selectedEquipment.specifications).length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Specifications</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(selectedEquipment.specifications).map(([key, value]) => (
                          <div key={key} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">{key}</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Features */}
                  {selectedEquipment.features && selectedEquipment.features.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Features</h3>
                      <ul className="space-y-2">
                        {selectedEquipment.features.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Additional Info */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <ShieldCheckIcon className="h-5 w-5 mr-2 text-gray-400" />
                      <span>Warranty: {selectedEquipment.warranty}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <ClockIcon className="h-5 w-5 mr-2 text-gray-400" />
                      <span>{selectedEquipment.leadTime}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => toggleFavorite(selectedEquipment._id)}
                      className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      {favorites.has(selectedEquipment._id) ? (
                        <HeartSolidIcon className="h-6 w-6 text-red-500" />
                      ) : (
                        <HeartIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        addToCart(selectedEquipment);
                        setSelectedEquipment(null);
                        setShowCartDrawer(true);
                      }}
                      disabled={selectedEquipment.availability !== 'in-stock'}
                      className={`flex-1 inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-lg transition-colors ${
                        selectedEquipment.availability === 'in-stock'
                          ? 'bg-primary-600 text-white hover:bg-primary-700'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <ShoppingCartIcon className="h-5 w-5 mr-2" />
                      {isInCart(selectedEquipment._id) ? 'Add Another' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // Cart Drawer
  const CartDrawer = () => {
    if (!showCartDrawer) return null;

    return createPortal(
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 bg-black/50" onClick={() => setShowCartDrawer(false)} />
        <div className="absolute inset-y-0 right-0 max-w-full flex">
          <div className="w-screen max-w-md">
            <div className="h-full flex flex-col bg-white dark:bg-gray-800 shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                  <ShoppingCartIcon className="h-6 w-6 mr-2" />
                  Shopping Cart ({cartItems.length})
                </h2>
                <button
                  onClick={() => setShowCartDrawer(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {cartItems.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCartIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Your cart is empty</p>
                    <button
                      onClick={() => setShowCartDrawer(false)}
                      className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Continue Shopping
                    </button>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {cartItems.map((item) => (
                      <li key={item.equipment._id} className="flex gap-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <img
                          src={item.equipment.image || 'https://via.placeholder.com/100'}
                          alt={item.equipment.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.equipment.name}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{item.equipment.brand}</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">{item.equipment.price}</p>

                          {/* Quantity Controls */}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateCartQuantity(item.equipment._id, -1)}
                                className="p-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                              >
                                <MinusIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                              </button>
                              <span className="w-8 text-center text-sm font-medium text-gray-900 dark:text-gray-100">{item.quantity}</span>
                              <button
                                onClick={() => updateCartQuantity(item.equipment._id, 1)}
                                className="p-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                              >
                                <PlusIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                              </button>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.equipment._id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Footer */}
              {cartItems.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 space-y-4">
                  <div className="flex items-center justify-between text-lg">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Subtotal</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">${cartTotal.toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Shipping and taxes calculated at checkout.</p>
                  <button className="w-full py-3 px-4 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">
                    Request Quote
                  </button>
                  <button
                    onClick={() => setShowCartDrawer(false)}
                    className="w-full py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // Wishlist Drawer
  const WishlistDrawer = () => {
    if (!showWishlistDrawer) return null;

    // Get all equipment for wishlist display
    const wishlistItems = equipmentList.filter(item => favorites.has(item._id));

    return createPortal(
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 bg-black/50" onClick={() => setShowWishlistDrawer(false)} />
        <div className="absolute inset-y-0 right-0 max-w-full flex">
          <div className="w-screen max-w-md">
            <div className="h-full flex flex-col bg-white dark:bg-gray-800 shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                  <HeartIcon className="h-6 w-6 mr-2" />
                  Wishlist ({favorites.size})
                </h2>
                <button
                  onClick={() => setShowWishlistDrawer(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Wishlist Items */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {wishlistItems.length === 0 ? (
                  <div className="text-center py-12">
                    <HeartIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Your wishlist is empty</p>
                    <button
                      onClick={() => setShowWishlistDrawer(false)}
                      className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Browse Equipment
                    </button>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {wishlistItems.map((item) => (
                      <li key={item._id} className="flex gap-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <img
                          src={item.image || 'https://via.placeholder.com/100'}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.name}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{item.brand}</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">{item.price}</p>

                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => {
                                addToCart(item);
                                toggleFavorite(item._id);
                              }}
                              disabled={item.availability !== 'in-stock'}
                              className={`flex-1 text-xs py-1.5 px-3 rounded font-medium transition-colors ${
                                item.availability === 'in-stock'
                                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              Add to Cart
                            </button>
                            <button
                              onClick={() => toggleFavorite(item._id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="space-y-8">
      {/* Modals */}
      <EquipmentDetailModal />
      <CartDrawer />
      <WishlistDrawer />

      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center">
                <ShoppingBagIcon className="h-8 w-8 mr-3" />
                Equipment Portal
              </h1>
              <p className="mt-3 text-lg text-primary-100">
                Professional sign-making equipment at exclusive member prices
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center gap-3">
              <button
                onClick={() => setShowCartDrawer(true)}
                className="relative inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur text-white font-medium rounded-lg hover:bg-white/30 transition-colors duration-200"
              >
                <ShoppingCartIcon className="h-5 w-5 mr-2" />
                Cart
                {cartItems.length > 0 && (
                  <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowWishlistDrawer(true)}
                className="inline-flex items-center px-4 py-2 bg-white text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors duration-200"
              >
                <HeartIcon className="h-5 w-5 mr-2" />
                Wishlist ({favorites.size})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <TagIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">Member Pricing</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Save up to 40%</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <TruckIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">Free Shipping</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">On orders $500+</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <ShieldCheckIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">Warranty Plus</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Extended coverage</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <SparklesIcon className="h-8 w-8 text-orange-600 mx-auto mb-2" />
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">0% Financing</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Up to 60 months</p>
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
                placeholder="Search equipment by name, brand, or model..."
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
          <div className="flex gap-2">
            <div className="w-40">
              <CustomSelect
                value={sortBy}
                onChange={(value) => setSortBy(value)}
                options={[
                  { value: 'featured', label: 'Featured' },
                  { value: 'price-low', label: 'Price: Low' },
                  { value: 'price-high', label: 'Price: High' },
                  { value: 'rating', label: 'Top Rated' },
                  { value: 'name', label: 'Name A-Z' },
                ]}
              />
            </div>
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'} transition-colors duration-200`}
              >
                <Squares2X2Icon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'} transition-colors duration-200`}
              >
                <ListBulletIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Categories */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Categories</h3>
              <nav className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.key}
                    onClick={() => handleCategoryChange(category.key)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg flex items-center justify-between transition-all duration-200 ${
                      selectedCategory === category.key
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    <div className="flex items-center">
                      <category.icon className={`h-5 w-5 mr-3 ${
                        selectedCategory === category.key ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'
                      }`} />
                      <span className="text-sm">{category.name}</span>
                    </div>
                    <span className={`text-sm ${
                      selectedCategory === category.key ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {category.count}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Brands Filter */}
          {brands.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Brands</h3>
                {selectedBrands.size > 0 && (
                  <button
                    onClick={() => setSelectedBrands(new Set())}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {brands.map((brand) => {
                  const brandCount = stats?.brandCounts?.[brand] || 0;
                  return (
                    <label key={brand} className="flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedBrands.has(brand)}
                          onChange={() => toggleBrand(brand)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">{brand}</span>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500">({brandCount})</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-6 border border-primary-200 dark:border-primary-800">
            <h3 className="text-lg font-semibold text-primary-900 dark:text-primary-100 mb-3">Need Help?</h3>
            <div className="space-y-2">
              <button className="w-full text-left text-sm text-primary-700 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 font-medium">
                Equipment Comparison Tool →
              </button>
              <button className="w-full text-left text-sm text-primary-700 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 font-medium">
                Financing Calculator →
              </button>
              <button className="w-full text-left text-sm text-primary-700 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 font-medium">
                Request a Quote →
              </button>
              <button className="w-full text-left text-sm text-primary-700 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 font-medium">
                Live Chat Support →
              </button>
            </div>
          </div>
        </div>

        {/* Equipment Grid/List */}
        <div className="lg:col-span-3">
          {/* Active Filters */}
          {selectedBrands.size > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {Array.from(selectedBrands).map(brand => (
                <span key={brand} className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-sm rounded-full">
                  {brand}
                  <button onClick={() => toggleBrand(brand)} className="hover:text-primary-900 dark:hover:text-primary-200">
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Loading State */}
          {equipmentLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          )}

          {/* Empty State */}
          {!equipmentLoading && equipmentList.length === 0 && (
            <div className="text-center py-12">
              <ShoppingBagIcon className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No equipment found</h3>
              <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filter criteria</p>
            </div>
          )}

          {/* Grid View */}
          {!equipmentLoading && equipmentList.length > 0 && viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-6">
              {equipmentList.map((item: EquipmentType) => (
                <div
                  key={item._id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300"
                >
                  <div className="relative">
                    <img
                      src={item.image || 'https://via.placeholder.com/400x300?text=Equipment'}
                      alt={item.name}
                      className="w-full h-64 object-cover cursor-pointer"
                      onClick={() => setSelectedEquipment(item)}
                    />
                    {item.isNewArrival && (
                      <span className="absolute top-2 left-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500 text-white">
                        New
                      </span>
                    )}
                    {item.isFeatured && (
                      <span className="absolute top-2 right-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-400 text-yellow-900">
                        Featured
                      </span>
                    )}
                    <button
                      onClick={() => toggleFavorite(item._id)}
                      className="absolute bottom-2 right-2 p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors"
                    >
                      {favorites.has(item._id) ? (
                        <HeartSolidIcon className="h-5 w-5 text-red-500" />
                      ) : (
                        <HeartIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      )}
                    </button>
                  </div>
                  <div className="p-6">
                    <div className="mb-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{item.brand} • {item.model}</span>
                      <h3
                        className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mt-1 line-clamp-2 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400"
                        onClick={() => setSelectedEquipment(item)}
                      >
                        {item.name}
                      </h3>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{item.description}</p>

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{item.price}</p>
                        {item.priceNote && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{item.priceNote}</p>
                        )}
                      </div>
                      <div className="flex items-center">
                        <StarSolidIcon className="h-4 w-4 text-yellow-400" />
                        <span className="ml-1 text-sm font-medium text-gray-700 dark:text-gray-300">{item.rating}</span>
                        <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">({item.reviews})</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm mb-4">
                      <span className={`inline-flex items-center ${
                        item.availability === 'in-stock' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        <CheckIcon className="h-4 w-4 mr-1" />
                        {item.availability === 'in-stock' ? 'In Stock' : item.availability === 'pre-order' ? 'Pre-Order' : 'Out of Stock'}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {item.leadTime}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => setSelectedEquipment(item)}
                        className="flex-1 inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 text-xs sm:text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        <InformationCircleIcon className="h-4 w-4 mr-1.5" />
                        View Details
                      </button>
                      <button
                        onClick={() => addToCart(item)}
                        disabled={item.availability !== 'in-stock'}
                        className={`flex-1 inline-flex items-center justify-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                          item.availability === 'in-stock'
                            ? 'bg-primary-600 text-white hover:bg-primary-700'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <ShoppingCartIcon className="h-4 w-4 mr-1.5" />
                        {isInCart(item._id) ? 'Add More' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* List View */}
          {!equipmentLoading && equipmentList.length > 0 && viewMode === 'list' && (
            <div className="space-y-4">
              {equipmentList.map((item: EquipmentType) => (
                <div
                  key={item._id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                    <img
                      src={item.image || 'https://via.placeholder.com/400x300?text=Equipment'}
                      alt={item.name}
                      className="w-full sm:w-32 h-48 sm:h-32 object-cover rounded-lg flex-shrink-0 cursor-pointer"
                      onClick={() => setSelectedEquipment(item)}
                    />
                    <div className="flex-1">
                      <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm text-gray-500 dark:text-gray-400">{item.brand} • {item.model}</span>
                            {item.isNewArrival && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500 text-white">
                                New
                              </span>
                            )}
                            {item.isFeatured && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-400 text-yellow-900">
                                Featured
                              </span>
                            )}
                          </div>
                          <h3
                            className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400"
                            onClick={() => setSelectedEquipment(item)}
                          >
                            {item.name}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{item.description}</p>

                          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm">
                            <span className={`inline-flex items-center ${
                              item.availability === 'in-stock' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              <CheckIcon className="h-4 w-4 mr-1" />
                              {item.availability === 'in-stock' ? 'In Stock' : item.availability === 'pre-order' ? 'Pre-Order' : 'Out of Stock'}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400 flex items-center">
                              <ClockIcon className="h-4 w-4 mr-1" />
                              {item.leadTime}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400 flex items-center">
                              <ShieldCheckIcon className="h-4 w-4 mr-1" />
                              {item.warranty}
                            </span>
                            <div className="flex items-center">
                              <StarSolidIcon className="h-4 w-4 text-yellow-400" />
                              <span className="ml-1 font-medium text-gray-700 dark:text-gray-300">{item.rating}</span>
                              <span className="ml-1 text-gray-500 dark:text-gray-400">({item.reviews} reviews)</span>
                            </div>
                          </div>
                        </div>
                        <div className="w-full lg:w-auto lg:text-right">
                          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{item.price}</p>
                          {item.priceNote && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{item.priceNote}</p>
                          )}
                          <div className="flex flex-wrap lg:flex-nowrap items-stretch gap-2">
                            <button
                              onClick={() => toggleFavorite(item._id)}
                              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                            >
                              {favorites.has(item._id) ? (
                                <HeartSolidIcon className="h-5 w-5 text-red-500" />
                              ) : (
                                <HeartIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                              )}
                            </button>
                            <button
                              onClick={() => setSelectedEquipment(item)}
                              className="flex-1 lg:flex-initial inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
                            >
                              <InformationCircleIcon className="h-4 w-4 mr-1.5" />
                              View Details
                            </button>
                            <button
                              onClick={() => addToCart(item)}
                              disabled={item.availability !== 'in-stock'}
                              className={`flex-1 lg:flex-initial inline-flex items-center justify-center px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                                item.availability === 'in-stock'
                                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              <ShoppingCartIcon className="h-4 w-4 mr-1.5" />
                              {isInCart(item._id) ? 'Add More' : 'Add to Cart'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                Page {page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Equipment;
