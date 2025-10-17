import React from 'react';

interface NotificationProps {
  message: string;
}

export const Notification: React.FC<NotificationProps> = ({ message }) => {
  return (
    <div className="source-inspector-notification">
      {message}
    </div>
  );
};
