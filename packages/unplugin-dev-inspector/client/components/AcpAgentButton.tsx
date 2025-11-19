import React from 'react';
import { cn } from '../lib/utils';
import { Bot } from 'lucide-react';

interface AcpAgentButtonProps {
  isActive: boolean;
  onClick: (e: React.MouseEvent) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const AcpAgentButton = React.forwardRef<HTMLButtonElement, AcpAgentButtonProps>(
  ({ isActive, onClick, onMouseEnter, onMouseLeave }, ref) => (
    <button
      ref={ref}
      id="acp-agent-btn"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title="Toggle AI Agent Panel"
      className={cn(
        "w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 border-0 cursor-pointer shadow-lg z-[999998]",
        "flex items-center justify-center transition-all duration-300 ease-out outline-none",
        "hover:scale-110 hover:shadow-xl",
        isActive && "scale-110 shadow-xl"
      )}
    >
      <Bot className="w-6 h-6 text-white" />
    </button>
  ),
);

AcpAgentButton.displayName = 'AcpAgentButton';
