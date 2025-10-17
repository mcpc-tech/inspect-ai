import React from 'react';

interface OverlayProps {
  visible: boolean;
}

export const Overlay = React.forwardRef<HTMLDivElement, OverlayProps>(
  ({ visible }, ref) => (
    <div
      ref={ref}
      className="source-inspector-overlay"
      style={{ display: visible ? 'block' : 'none' }}
    />
  ),
);

Overlay.displayName = 'Overlay';

interface TooltipProps {
  visible: boolean;
}

export const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  ({ visible }, ref) => (
    <div
      ref={ref}
      className="source-inspector-tooltip"
      style={{ display: visible ? 'block' : 'none' }}
    />
  ),
);

Tooltip.displayName = 'Tooltip';
