import { ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';

interface DashboardGridProps {
  children: ReactNode;
  className?: string;
}

const DashboardGrid = ({ children, className = '' }: DashboardGridProps) => {
  return (
    <AnimatePresence mode="popLayout">
      <div className={`grid grid-cols-4 gap-6 ${className}`}>
        {children}
      </div>
    </AnimatePresence>
  );
};

export default DashboardGrid;
