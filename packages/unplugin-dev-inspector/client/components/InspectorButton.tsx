import React from 'react';
import { cn } from '../lib/utils';
import { Eye } from 'lucide-react';

interface InspectorButtonProps {
  isActive: boolean;
  onClick: (e: React.MouseEvent) => void;
}

export const InspectorButton = React.forwardRef<HTMLButtonElement, InspectorButtonProps>(
  ({ isActive, onClick }, ref) => (
    <button
      ref={ref}
      id="source-inspector-btn"
      onClick={onClick}
      title="Toggle Source Inspector"
      className={cn(
        "fixed bottom-5 right-5 w-12 h-12 rounded-full bg-gray-900 dark:bg-gray-100 border-0 cursor-pointer shadow-lg z-[999998]",
        "flex items-center justify-center transition-all duration-300 ease-out outline-none",
        "hover:scale-110 hover:bg-black dark:hover:bg-white hover:shadow-xl",
        isActive && "bg-black dark:bg-white animate-pulse"
      )}
    >
      <Eye className="w-6 h-6 text-white dark:text-gray-900" />
    </button>
  ),
);

InspectorButton.displayName = 'InspectorButton';
