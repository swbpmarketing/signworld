import { useState } from 'react';
import {
  ShoppingBagIcon,
  CpuChipIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  TagIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
  HeartIcon,
  ShoppingCartIcon,
  ChevronRightIcon,
  CheckIcon,
  InformationCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon, HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface Equipment {
  id: number;
  name: string;
  category: string;
  brand: string;
  model: string;
  price: string;
  priceNote?: string;
  image: string;
  description: string;
  features: string[];
  specifications: {
    [key: string]: string;
  };
  inStock: boolean;
  rating: number;
  reviews: number;
  warranty: string;
  isFeatured: boolean;
  isNew: boolean;
  isFavorite: boolean;
  leadTime: string;
}

const equipment: Equipment[] = [
  {
    id: 1,
    name: "Roland TrueVIS VG3-640 Wide Format Printer/Cutter",
    category: "Large Format Printers",
    brand: "Roland",
    model: "VG3-640",
    price: "$19,995",
    priceNote: "Special Sign Company pricing",
    image: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800&q=80",
    description: "64-inch eco-solvent printer/cutter ideal for vinyl graphics, banners, vehicle wraps, and decals.",
    features: [
      "64-inch printing width",
      "FlexFire print heads",
      "True Rich Color 3 technology",
      "Automated maintenance",
      "Mobile remote monitoring"
    ],
    specifications: {
      "Print Width": "64 inches",
      "Resolution": "Up to 1440 dpi",
      "Print Speed": "25.2 m²/h",
      "Cutting Speed": "10-300 mm/s",
      "Media Thickness": "1.0 mm max"
    },
    inStock: true,
    rating: 4.9,
    reviews: 127,
    warranty: "2 years + extended options",
    isFeatured: true,
    isNew: true,
    isFavorite: false,
    leadTime: "2-3 weeks"
  },
  {
    id: 2,
    name: "Graphtec FC9000-160 Vinyl Cutting Plotter",
    category: "Vinyl Cutters",
    brand: "Graphtec",
    model: "FC9000-160",
    price: "$7,495",
    priceNote: "64\" cutting width",
    image: "https://images.unsplash.com/photo-1581092160607-ee22df5e7c7f?w=800&q=80",
    description: "Professional vinyl cutting plotter with ARMS 5.0 automatic registration mark sensor for precision contour cutting.",
    features: [
      "64-inch cutting width",
      "ARMS 5.0 registration system",
      "Tangential control",
      "Cut force up to 600 grams",
      "Barcode cutting workflow"
    ],
    specifications: {
      "Cutting Width": "64 inches",
      "Cutting Force": "20-600 grams",
      "Speed": "Up to 58.5 inch/sec",
      "Accuracy": "±0.1% or less",
      "Media Thickness": "0.8mm max"
    },
    inStock: true,
    rating: 4.8,
    reviews: 89,
    warranty: "1 year parts & labor",
    isFeatured: false,
    isNew: false,
    isFavorite: true,
    leadTime: "Ships in 3-5 days"
  },
  {
    id: 3,
    name: "ShopSabre PRO4848 CNC Router",
    category: "CNC Routers",
    brand: "ShopSabre",
    model: "PRO4848",
    price: "$34,995",
    priceNote: "4x4 ft cutting area",
    image: "https://images.unsplash.com/photo-1565306257842-452704726532?w=800&q=80",
    description: "Industrial-grade CNC router for cutting aluminum, ACM, wood, foam, and plastics for dimensional signage.",
    features: [
      "48\" x 48\" cutting area",
      "3HP HSD spindle",
      "Automatic tool changer ready",
      "Helical rack & pinion drives",
      "Dust collection system"
    ],
    specifications: {
      "Work Area": "48\" x 48\" x 8\"",
      "Spindle Power": "3HP (2.2kW)",
      "Speed": "Up to 600 IPM",
      "Accuracy": "±0.003\"",
      "Control": "WinCNC or Mach3"
    },
    inStock: false,
    rating: 4.7,
    reviews: 56,
    warranty: "2 years mechanical",
    isFeatured: true,
    isNew: false,
    isFavorite: false,
    leadTime: "6-8 weeks"
  },
  {
    id: 4,
    name: "AccuBend 410 Channel Letter Bender",
    category: "Channel Letter Equipment",
    brand: "Accu-Bend",
    model: "410",
    price: "$12,495",
    priceNote: "Computerized bending",
    image: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&q=80",
    description: "Computerized automatic channel letter bending machine for aluminum and steel coil, creating precise returns.",
    features: [
      "Windows-based software",
      "Automatic notching",
      "Multiple flange heights",
      "Font library included",
      "DXF file import"
    ],
    specifications: {
      "Material": "Aluminum/Steel coil",
      "Thickness": "0.016\" - 0.040\"",
      "Return Heights": "1\" - 7\"",
      "Speed": "Variable",
      "Power": "110V/220V"
    },
    inStock: true,
    rating: 4.6,
    reviews: 34,
    warranty: "1 year parts & labor",
    isFeatured: false,
    isNew: false,
    isFavorite: false,
    leadTime: "2-3 weeks"
  },
  {
    id: 5,
    name: "Miller Millermatic 252 MIG Welder",
    category: "Welding Equipment",
    brand: "Miller",
    model: "Millermatic 252",
    price: "$3,295",
    priceNote: "Auto-Set Elite",
    image: "https://images.unsplash.com/photo-1609205990107-6b8a0e7f7a3e?w=800&q=80",
    description: "All-in-one MIG welder for fabricating aluminum and steel sign frames and structures.",
    features: [
      "Auto-Set Elite technology",
      "230V single phase",
      "Spool gun ready",
      "Aluminum welding capable",
      "Digital meters"
    ],
    specifications: {
      "Input Power": "208/230V",
      "Output Range": "30-300A",
      "Wire Feed Speed": "60-800 IPM",
      "Wire Diameter": ".023-.045 steel",
      "Duty Cycle": "40% at 250A"
    },
    inStock: true,
    rating: 4.9,
    reviews: 167,
    warranty: "3 years",
    isFeatured: false,
    isNew: false,
    isFavorite: false,
    leadTime: "Ships in 1-2 days"
  },
  {
    id: 6,
    name: "Elliott G85 Bucket Truck",
    category: "Installation Equipment",
    brand: "Elliott",
    model: "G85",
    price: "$145,000",
    priceNote: "85ft working height",
    image: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&q=80",
    description: "Heavy-duty aerial work platform for high-rise sign installation and maintenance.",
    features: [
      "85ft working height",
      "500lb platform capacity",
      "Insulated upper boom",
      "Platform rotation",
      "Outriggers included"
    ],
    specifications: {
      "Working Height": "85 feet",
      "Horizontal Reach": "71 feet",
      "Platform Capacity": "500 lbs",
      "Rotation": "360° continuous",
      "Chassis": "Class 7 or 8"
    },
    inStock: false,
    rating: 4.8,
    reviews: 23,
    warranty: "2 years structural",
    isFeatured: true,
    isNew: false,
    isFavorite: false,
    leadTime: "12-16 weeks"
  },
  {
    id: 7,
    name: "Stahls Hotronix Fusion IQ Heat Press",
    category: "Heat Press Equipment",
    brand: "Stahls",
    model: "Fusion IQ",
    price: "$2,995",
    priceNote: "16\" x 20\" platen",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    description: "Smart heat press with touch screen interface for heat transfer vinyl application on banners and soft signage.",
    features: [
      "Touch screen controls",
      "ThreadSense technology",
      "Auto-open feature",
      "Laser alignment system",
      "Quick change platens"
    ],
    specifications: {
      "Platen Size": "16\" x 20\"",
      "Temperature": "Up to 500°F",
      "Pressure": "0-120 PSI",
      "Timer": "0-999 seconds",
      "Power": "120V, 15A"
    },
    inStock: true,
    rating: 4.7,
    reviews: 92,
    warranty: "2 years",
    isFeatured: false,
    isNew: true,
    isFavorite: false,
    leadTime: "Ships in 3-5 days"
  },
  {
    id: 8,
    name: "GBC Titan 1264WF Wide Format Laminator",
    category: "Laminators",
    brand: "GBC",
    model: "Titan 1264WF",
    price: "$8,495",
    priceNote: "64\" width capacity",
    image: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80",
    description: "Wide format roll laminator for protecting prints, posters, and outdoor signage.",
    features: [
      "64-inch laminating width",
      "Hot and cold lamination",
      "Variable speed control",
      "Digital temperature display",
      "Built-in slitters"
    ],
    specifications: {
      "Max Width": "64 inches",
      "Max Thickness": "1 inch",
      "Temperature": "Cold to 320°F",
      "Speed": "0-30 fpm",
      "Roll Diameter": "5.5\" max"
    },
    inStock: true,
    rating: 4.5,
    reviews: 44,
    warranty: "1 year",
    isFeatured: false,
    isNew: false,
    isFavorite: false,
    leadTime: "2-3 weeks"
  },
  {
    id: 9,
    name: "SloanLED VL4 LED Module System",
    category: "LED & Lighting",
    brand: "SloanLED",
    model: "VL4",
    price: "$3.85/module",
    priceNote: "Case of 500",
    image: "https://images.unsplash.com/photo-1565636225786-b51c76051d8a?w=800&q=80",
    description: "High-output LED modules for channel letters and sign cabinet illumination.",
    features: [
      "160° viewing angle",
      "IP68 waterproof rating",
      "50,000 hour lifespan",
      "5-year warranty",
      "UL recognized"
    ],
    specifications: {
      "Voltage": "12V DC",
      "Lumens": "100 lm/module",
      "Colors": "White, Red, Blue, Green",
      "Spacing": "3-6 inches",
      "Operating Temp": "-40°F to 185°F"
    },
    inStock: true,
    rating: 4.8,
    reviews: 203,
    warranty: "5 years",
    isFeatured: true,
    isNew: false,
    isFavorite: true,
    leadTime: "Ships same day"
  },
  {
    id: 10,
    name: "Samsung OM55N-D Outdoor Display",
    category: "Digital Displays",
    brand: "Samsung",
    model: "OM55N-D",
    price: "$6,995",
    priceNote: "55\" outdoor rated",
    image: "https://images.unsplash.com/photo-1611532736579-6b16e2b50449?w=800&q=80",
    description: "High-brightness outdoor digital display for dynamic signage applications.",
    features: [
      "3,500 nit brightness",
      "IP56 weather rating",
      "Anti-reflective glass",
      "Built-in cooling system",
      "24/7 operation capable"
    ],
    specifications: {
      "Screen Size": "55 inches",
      "Resolution": "1920 x 1080",
      "Brightness": "3,500 nits",
      "Protection": "IP56",
      "Operating Temp": "-22°F to 122°F"
    },
    inStock: false,
    rating: 4.6,
    reviews: 31,
    warranty: "3 years",
    isFeatured: false,
    isNew: true,
    isFavorite: false,
    leadTime: "4-6 weeks"
  },
  {
    id: 11,
    name: "SignTools Pro Installation Kit",
    category: "Installation Tools",
    brand: "SignTools",
    model: "PRO-KIT",
    price: "$895",
    priceNote: "Complete 45-piece set",
    image: "https://images.unsplash.com/photo-1609205990107-6b8a0e7f7a3e?w=800&q=80",
    description: "Professional sign installation toolkit with all essential tools for mounting and installing signs.",
    features: [
      "Hammer drill with bits",
      "Stud finder & level",
      "Rivet gun & rivets",
      "Wire fishing tools",
      "Safety equipment included"
    ],
    specifications: {
      "Pieces": "45 tools",
      "Case": "Heavy-duty rolling case",
      "Drill": "18V cordless",
      "Includes": "All fasteners",
      "Weight": "65 lbs total"
    },
    inStock: true,
    rating: 4.9,
    reviews: 78,
    warranty: "Lifetime on hand tools",
    isFeatured: false,
    isNew: false,
    isFavorite: false,
    leadTime: "Ships same day"
  },
  {
    id: 12,
    name: "3M Fall Protection Harness Kit",
    category: "Safety Equipment",
    brand: "3M",
    model: "Protecta PRO",
    price: "$495",
    priceNote: "OSHA compliant",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80",
    description: "Complete fall protection system for sign installers working at heights.",
    features: [
      "Full body harness",
      "6ft shock absorbing lanyard",
      "Rope grab & lifeline",
      "Storage bag included",
      "ANSI/OSHA compliant"
    ],
    specifications: {
      "Capacity": "420 lbs",
      "Harness Size": "Universal",
      "Lanyard": "6ft with rebar hook",
      "Standards": "OSHA 1926.502",
      "Material": "Polyester webbing"
    },
    inStock: true,
    rating: 4.8,
    reviews: 156,
    warranty: "1 year",
    isFeatured: false,
    isNew: false,
    isFavorite: true,
    leadTime: "Ships same day"
  }
];

const categories = [
  { name: "All Equipment", icon: ShoppingBagIcon, count: 234 },
  { name: "Large Format Printers", icon: CpuChipIcon, count: 28 },
  { name: "Vinyl Cutters", icon: WrenchScrewdriverIcon, count: 19 },
  { name: "CNC Routers", icon: Squares2X2Icon, count: 15 },
  { name: "Channel Letter Equipment", icon: WrenchScrewdriverIcon, count: 22 },
  { name: "Welding Equipment", icon: SparklesIcon, count: 18 },
  { name: "Installation Equipment", icon: TruckIcon, count: 34 },
  { name: "Heat Press Equipment", icon: WrenchScrewdriverIcon, count: 12 },
  { name: "Laminators", icon: Squares2X2Icon, count: 16 },
  { name: "LED & Lighting", icon: SparklesIcon, count: 42 },
  { name: "Digital Displays", icon: CpuChipIcon, count: 18 },
  { name: "Installation Tools", icon: WrenchScrewdriverIcon, count: 26 },
  { name: "Safety Equipment", icon: ShieldCheckIcon, count: 24 }
];

const brands = ["Roland", "Graphtec", "ShopSabre", "Accu-Bend", "Miller", "Elliott", "Stahls", "GBC", "SloanLED", "Samsung", "3M", "Epson", "Mimaki", "Summa", "HP", "Multicam"];

const Equipment = () => {
  const [selectedCategory, setSelectedCategory] = useState('All Equipment');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [equipmentList, setEquipmentList] = useState(equipment);
  const [cart, setCart] = useState<number[]>([]);

  const toggleFavorite = (equipmentId: number) => {
    setEquipmentList(equipmentList.map(item =>
      item.id === equipmentId
        ? { ...item, isFavorite: !item.isFavorite }
        : item
    ));
  };

  const addToCart = (equipmentId: number) => {
    if (!cart.includes(equipmentId)) {
      setCart([...cart, equipmentId]);
    }
  };

  const filteredEquipment = equipmentList.filter(item => {
    if (selectedCategory !== 'All Equipment' && item.category !== selectedCategory) return false;
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !item.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-8">
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
              <button className="relative inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur text-white font-medium rounded-lg hover:bg-white/30 transition-colors duration-200">
                <ShoppingCartIcon className="h-5 w-5 mr-2" />
                Cart
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </button>
              <button className="inline-flex items-center px-4 py-2 bg-white text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors duration-200">
                <HeartIcon className="h-5 w-5 mr-2" />
                Wishlist
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
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search equipment by name, brand, or model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200">
              <FunnelIcon className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
              Filter
            </button>
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'} transition-colors duration-200`}
              >
                <Squares2X2Icon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'} transition-colors duration-200`}
              >
                <ListBulletIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
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
                    key={category.name}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg flex items-center justify-between transition-all duration-200 ${
                      selectedCategory === category.name
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    <div className="flex items-center">
                      <category.icon className={`h-5 w-5 mr-3 ${
                        selectedCategory === category.name ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'
                      }`} />
                      <span>{category.name}</span>
                    </div>
                    <span className={`text-sm ${
                      selectedCategory === category.name ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {category.count}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Brands Filter */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Brands</h3>
            <div className="space-y-2">
              {brands.map((brand) => (
                <label key={brand} className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{brand}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6 border border-primary-200">
            <h3 className="text-lg font-semibold text-primary-900 mb-3">Need Help?</h3>
            <div className="space-y-2">
              <button className="w-full text-left text-sm text-primary-700 hover:text-primary-900 font-medium">
                Equipment Comparison Tool →
              </button>
              <button className="w-full text-left text-sm text-primary-700 hover:text-primary-900 font-medium">
                Financing Calculator →
              </button>
              <button className="w-full text-left text-sm text-primary-700 hover:text-primary-900 font-medium">
                Request a Quote →
              </button>
              <button className="w-full text-left text-sm text-primary-700 hover:text-primary-900 font-medium">
                Live Chat Support →
              </button>
            </div>
          </div>
        </div>

        {/* Equipment Grid/List */}
        <div className="lg:col-span-3">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-6">
              {filteredEquipment.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300"
                >
                  <div className="relative">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-64 object-cover"
                    />
                    {item.isNew && (
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
                      onClick={() => toggleFavorite(item.id)}
                      className="absolute bottom-2 right-2 p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors"
                    >
                      {item.isFavorite ? (
                        <HeartSolidIcon className="h-5 w-5 text-red-500" />
                      ) : (
                        <HeartIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      )}
                    </button>
                  </div>
                  <div className="p-6">
                    <div className="mb-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{item.brand} • {item.model}</span>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mt-1 line-clamp-2">{item.name}</h3>
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
                        item.inStock ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        <CheckIcon className="h-4 w-4 mr-1" />
                        {item.inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {item.leadTime}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button className="flex-1 inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 text-xs sm:text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                        <InformationCircleIcon className="h-4 w-4 mr-1.5" />
                        View Details
                      </button>
                      <button
                        onClick={() => addToCart(item.id)}
                        disabled={!item.inStock}
                        className={`flex-1 inline-flex items-center justify-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                          item.inStock
                            ? 'bg-primary-600 text-white hover:bg-primary-700'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <ShoppingCartIcon className="h-4 w-4 mr-1.5" />
                        {cart.includes(item.id) ? 'In Cart' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEquipment.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full sm:w-32 h-48 sm:h-32 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm text-gray-500 dark:text-gray-400">{item.brand} • {item.model}</span>
                            {item.isNew && (
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
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{item.name}</h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{item.description}</p>

                          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm">
                            <span className={`inline-flex items-center ${
                              item.inStock ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              <CheckIcon className="h-4 w-4 mr-1" />
                              {item.inStock ? 'In Stock' : 'Out of Stock'}
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
                              onClick={() => toggleFavorite(item.id)}
                              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                            >
                              {item.isFavorite ? (
                                <HeartSolidIcon className="h-5 w-5 text-red-500" />
                              ) : (
                                <HeartIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                              )}
                            </button>
                            <button className="flex-1 lg:flex-initial inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors whitespace-nowrap">
                              <InformationCircleIcon className="h-4 w-4 mr-1.5" />
                              View Details
                            </button>
                            <button
                              onClick={() => addToCart(item.id)}
                              disabled={!item.inStock}
                              className={`flex-1 lg:flex-initial inline-flex items-center justify-center px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                                item.inStock
                                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              <ShoppingCartIcon className="h-4 w-4 mr-1.5" />
                              {cart.includes(item.id) ? 'In Cart' : 'Add to Cart'}
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

          {/* Load More */}
          <div className="text-center mt-8">
            <button className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors duration-200">
              Load More Equipment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Equipment;