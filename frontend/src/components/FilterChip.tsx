import { XMarkIcon } from '@heroicons/react/24/outline';

interface FilterChipProps {
  label: string;
  value: string;
  onRemove: () => void;
}

const FilterChip = ({ label, value, onRemove }: FilterChipProps) => {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium border border-primary-200 dark:border-primary-800">
      <span className="text-xs opacity-75">{label}:</span>
      <span>{value}</span>
      <button
        onClick={onRemove}
        className="ml-1 hover:bg-primary-200 dark:hover:bg-primary-800/50 rounded-full p-0.5 transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <XMarkIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default FilterChip;
