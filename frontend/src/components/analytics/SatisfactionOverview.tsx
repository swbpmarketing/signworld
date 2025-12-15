import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';
import { getOverallSatisfaction } from '../../services/analyticsService';

interface SatisfactionOverviewProps {
  className?: string;
}

const SatisfactionOverview: React.FC<SatisfactionOverviewProps> = ({
  className = '',
}) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['overall-satisfaction'],
    queryFn: getOverallSatisfaction,
    staleTime: 10 * 60 * 1000,
  });

  const averageRating = data?.averageRating ?? 0;
  const totalRatings = data?.totalRatings ?? 0;
  const distribution = data?.ratingDistribution ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const trustScore = useMemo(() => {
    return Math.round(averageRating * 20);
  }, [averageRating]);

  const getRatingColor = (rating: number): string => {
    if (rating === 5) return 'bg-green-500';
    if (rating === 4) return 'bg-emerald-500';
    if (rating === 3) return 'bg-yellow-500';
    if (rating === 2) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getRatingLabel = (rating: number): string => {
    if (rating === 5) return 'Excellent';
    if (rating === 4) return 'Good';
    if (rating === 3) return 'Average';
    if (rating === 2) return 'Poor';
    return 'Very Poor';
  };

  const maxRatings = useMemo(() => {
    return Math.max(...Object.values(distribution));
  }, [distribution]);

  if (isLoading) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 ${className}`}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-3 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-6 ${className}`}
      >
        <p className="text-red-700 dark:text-red-400 text-sm">
          Failed to load customer satisfaction data
        </p>
      </div>
    );
  }

  if (totalRatings === 0) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center ${className}`}
      >
        <StarOutline className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No customer ratings yet
        </p>
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 ${className}`}
    >
      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4 flex items-center gap-2">
        <StarOutline className="h-4 w-4" />
        Customer Satisfaction
      </h3>

      {/* Summary Section */}
      <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
        {/* Average Rating */}
        <div>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {averageRating.toFixed(1)}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">/5</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Average Rating</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'}
          </p>
        </div>

        {/* Trust Score */}
        <div>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {trustScore}%
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Trust Score</p>
          <div className="flex items-center gap-1 mt-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full ${
                  i < Math.round(trustScore / 20)
                    ? 'bg-green-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Rating Distribution</p>

        {[5, 4, 3, 2, 1].map((rating) => {
          const count = distribution[rating as keyof typeof distribution] || 0;
          const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;

          return (
            <div key={rating} className="flex items-center gap-2">
              {/* Star Rating Label */}
              <div className="w-12 flex items-center gap-0.5 flex-shrink-0">
                {[...Array(rating)].map((_, i) => (
                  <StarIcon key={i} className="h-3.5 w-3.5 text-yellow-400" />
                ))}
              </div>

              {/* Progress Bar */}
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full ${getRatingColor(rating)} transition-all`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Count */}
              <div className="w-12 text-right flex-shrink-0">
                <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                  {count}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sentiment Indicator */}
      <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Overall Sentiment</p>
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full ${
              averageRating >= 4
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : averageRating >= 3
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}
          >
            {getRatingLabel(Math.round(averageRating))}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SatisfactionOverview;
