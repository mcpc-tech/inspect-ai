import React from 'react';
import { cn } from '../lib/utils';
import { Eye } from 'lucide-react';

interface InspectorButtonProps {
  isActive: boolean;
  onClick: (e: React.MouseEvent) => void;
  feedbackCount?: number;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const InspectorButton = React.forwardRef<HTMLButtonElement, InspectorButtonProps>(
  ({ isActive, onClick, feedbackCount = 0, onMouseEnter, onMouseLeave }, ref) => (
    <button
      ref={ref}
      id="source-inspector-btn"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title="Toggle Source Inspector"
      className={cn(
        "fixed bottom-5 right-5 w-12 h-12 rounded-full bg-gray-900 dark:bg-gray-100 border-0 cursor-pointer shadow-lg z-[999998]",
        "flex items-center justify-center transition-all duration-300 ease-out outline-none",
        "hover:scale-110 hover:bg-black dark:hover:bg-white hover:shadow-xl",
        isActive && "bg-black dark:bg-white animate-pulse"
      )}
    >
      <Eye className="w-6 h-6 text-white dark:text-gray-900" />
      
      {feedbackCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-bold text-white bg-red-500 rounded-full shadow-md animate-pulse">
          {feedbackCount}
        </span>
      )}
    </button>
  ),
);

InspectorButton.displayName = 'InspectorButton';
