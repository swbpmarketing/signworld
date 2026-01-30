import { ArrowLeftIcon, PhoneIcon, EnvelopeIcon, ChatBubbleLeftRightIcon, StarIcon, BriefcaseIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

interface OwnerProfileCardProps {
  owner: {
    _id: string;
    name: string;
    company: string;
    profileImage?: string;
    phone?: string;
    email?: string;
    stats?: {
      averageRating: number;
      totalRatings: number;
      projectsCompleted: number;
    };
  };
  onBack?: () => void;
  onCall?: () => void;
  onEmail?: () => void;
  onMessage?: () => void;
}

const OwnerProfileCard = ({ owner, onBack, onCall, onEmail, onMessage }: OwnerProfileCardProps) => {
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i}>
            {i < Math.floor(rating) ? (
              <StarSolidIcon className="h-3.5 w-3.5 text-yellow-400" />
            ) : (
              <StarIcon className="h-3.5 w-3.5 text-gray-400" />
            )}
          </span>
        ))}
      </div>
    );
  };

  const stats = owner.stats || {
    averageRating: 0,
    totalRatings: 0,
    projectsCompleted: 0,
  };

  const hasStats = stats.totalRatings > 0 || stats.projectsCompleted > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              aria-label="Back to Directory"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="text-sm font-medium">Back to Directory</span>
            </button>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-gradient-to-b from-primary-50 to-white dark:from-primary-900/10 dark:to-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-10">
            {/* Profile Header - Avatar and Name Side by Side */}
            <div className="flex flex-col items-center mb-8">
              <div className="flex items-center gap-4 mb-3">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full ring-4 ring-white dark:ring-gray-700 shadow-xl bg-white overflow-hidden">
                    {owner.profileImage ? (
                      <img
                        src={owner.profileImage}
                        alt={owner.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-primary-100 dark:bg-primary-200 text-primary-700 dark:text-primary-800 text-2xl font-bold">
                        {owner.name.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Name */}
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {owner.name}
                </h1>
              </div>

              {/* Company */}
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 text-center">
                {owner.company}
              </p>
            </div>

            {/* Stats - Compact Horizontal Row */}
            {hasStats && (
              <div className="flex items-center justify-center gap-6 mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
                {/* Reviews */}
                {stats.totalRatings > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0">
                      {renderStars(stats.averageRating)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {stats.averageRating.toFixed(1)}
                      </span>
                      {' '}({stats.totalRatings})
                    </div>
                  </div>
                )}

                {/* Separator */}
                {stats.totalRatings > 0 && stats.projectsCompleted > 0 && (
                  <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
                )}

                {/* Projects */}
                {stats.projectsCompleted > 0 && (
                  <div className="flex items-center gap-1.5">
                    <BriefcaseIcon className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {stats.projectsCompleted}
                      </span>
                      {' '}project{stats.projectsCompleted !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Empty state for no stats */}
            {!hasStats && (
              <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
                <p className="text-center text-xs text-gray-400 dark:text-gray-600">
                  No reviews or projects yet
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Primary CTA - Message */}
              <button
                onClick={onMessage}
                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 bg-primary-600 text-white rounded-xl font-semibold text-base hover:bg-primary-700 active:bg-primary-800 transition-all duration-200 shadow-md hover:shadow-lg hover-lift focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5" />
                <span>Send Message</span>
              </button>

              {/* Secondary CTAs - Call & Email */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={onCall}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-600 active:bg-gray-100 dark:active:bg-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  <PhoneIcon className="h-4 w-4" />
                  <span>Call</span>
                </button>
                <button
                  onClick={onEmail}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-600 active:bg-gray-100 dark:active:bg-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  <EnvelopeIcon className="h-4 w-4" />
                  <span>Email</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerProfileCard;
