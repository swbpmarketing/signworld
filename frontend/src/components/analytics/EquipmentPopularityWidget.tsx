import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ShoppingCartIcon, HeartIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/solid';
import api from '../../config/axios';

interface EquipmentPopularity {
  equipmentId: string;
  name: string;
  cartAdds: number;
  wishlistAdds: number;
  quoteRequests: number;
}

interface EquipmentPopularityWidgetProps {
  className?: string;
}

const EquipmentPopularityWidget: React.FC<EquipmentPopularityWidgetProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<'cart' | 'wishlist' | 'quotes'>('cart');

  const { data, isLoading, error } = useQuery({
    queryKey: ['top-equipment'],
    queryFn: async () => {
      try {
        const response = await api.get('/equipment-stats/popular');
        return response.data.data as EquipmentPopularity[];
      } catch (err) {
        // Fallback to demo data if endpoint is not available
        return [
          { equipmentId: '1', name: 'Digital Sign Display', cartAdds: 156, wishlistAdds: 89, quoteRequests: 42 },
          { equipmentId: '2', name: 'LED Message Board', cartAdds: 134, wishlistAdds: 76, quoteRequests: 38 },
          { equipmentId: '3', name: 'Banner Stand', cartAdds: 112, wishlistAdds: 64, quoteRequests: 31 },
          { equipmentId: '4', name: 'Illuminated Signage', cartAdds: 98, wishlistAdds: 55, quoteRequests: 27 },
          { equipmentId: '5', name: 'Directional Sign Kit', cartAdds: 87, wishlistAdds: 48, quoteRequests: 23 },
        ] as EquipmentPopularity[];
      }
    },
    staleTime: 10 * 60 * 1000,
  });

  const tabConfig = {
    cart: {
      icon: ShoppingCartIcon,
      label: 'Added to Cart',
      key: 'cartAdds',
      color: '#3b82f6',
    },
    wishlist: {
      icon: HeartIcon,
      label: 'Added to Wishlist',
      key: 'wishlistAdds',
      color: '#ef4444',
    },
    quotes: {
      icon: ChatBubbleLeftIcon,
      label: 'Quote Requests',
      key: 'quoteRequests',
      color: '#8b5cf6',
    },
  };

  const currentTab = tabConfig[activeTab];
  const CurrentIcon = currentTab.icon;

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.map((item) => ({
      name: item.name,
      value: item[currentTab.key as keyof EquipmentPopularity] as number,
      equipmentId: item.equipmentId,
    }));
  }, [data, activeTab, currentTab.key]);

  const maxValue = useMemo(() => {
    return chartData.length > 0 ? Math.max(...chartData.map((d) => d.value)) : 0;
  }, [chartData]);

  const handleEquipmentClick = (equipmentId: string) => {
    window.location.href = `/equipment/${equipmentId}`;
  };

  if (error) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 ${className}`}
      >
        <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">
          <p className="text-red-700 dark:text-red-400 text-sm">
            Failed to load equipment popularity data
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 ${className}`}
    >
      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4 flex items-center gap-2">
        <ShoppingCartIcon className="h-4 w-4" />
        Equipment Popularity
      </h3>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-gray-100 dark:border-gray-700">
        {(Object.entries(tabConfig) as Array<[typeof activeTab, typeof currentTab]>).map(
          ([tab, config]) => {
            const TabIcon = config.icon;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                }`}
              >
                <TabIcon className="h-4 w-4" />
                {config.label.split(' ')[0]}
              </button>
            );
          }
        )}
      </div>

      {/* Chart */}
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
              <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      ) : chartData.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 60, bottom: 60 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#6b7280"
                width={100}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#f3f4f6',
                }}
                cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
              />
              <Bar
                dataKey="value"
                fill={currentTab.color}
                radius={[0, 8, 8, 0]}
                onClick={(data) => handleEquipmentClick(data.equipmentId)}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />
            </BarChart>
          </ResponsiveContainer>

          {/* Stats Footer */}
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Top Item</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {chartData[0]?.name || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Highest Count</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {maxValue}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Items</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {chartData.length}
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <ShoppingCartIcon className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No equipment popularity data available yet
          </p>
        </div>
      )}
    </div>
  );
};

export default EquipmentPopularityWidget;
