import { useEffect } from 'react';
import { toast as sonnerToast } from 'sonner';

export default function Toast({ 
  message, 
  type = 'success', 
  onClose 
}: { 
  message: string; 
  type?: 'success' | 'error'; 
  onClose: () => void 
}) {
  useEffect(() => {
    if (type === 'success') {
      sonnerToast.success(message, {
        duration: 3000,
      });
    } else {
      sonnerToast.error(message, {
        duration: 3000,
      });
    }
    
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [message, type, onClose]);

  return null;
}
