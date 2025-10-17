import { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose }: { message: string; type?: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed',
      top: 20,
      right: 20,
      padding: '1rem 1.5rem',
      borderRadius: 6,
      color: 'white',
      fontWeight: 500,
      background: type === 'success' ? '#48bb78' : '#e53e3e',
      zIndex: 1000
    }}>{message}</div>
  );
}
