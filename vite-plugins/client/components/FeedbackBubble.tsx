import React, { useState, useEffect } from 'react';
import type { InspectedElement } from '../types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface FeedbackBubbleProps {
  sourceInfo: InspectedElement;
  onClose: () => void;
  mode: 'input' | 'loading' | 'success' | 'error';
  onSubmit?: (feedback: string) => void;
  resultMessage?: string;
}

export const FeedbackBubble: React.FC<FeedbackBubbleProps> = ({
  sourceInfo,
  onClose,
  mode,
  onSubmit,
  resultMessage,
}) => {
  const [feedback, setFeedback] = useState('');
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!open) {
      onClose();
    }
  }, [open, onClose]);

  const handleSubmit = () => {
    if (feedback.trim() && onSubmit) {
      onSubmit(feedback);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && mode === 'input' && feedback.trim() && onSubmit) {
      onSubmit(feedback);
    }
  };

  const getTitle = () => {
    if (mode === 'success') return 'Processing Successful';
    if (mode === 'error') return 'Processing Failed';
    if (mode === 'loading') return 'Processing...';
    return 'Feedback to AI';
  };

  const getIcon = () => {
    if (mode === 'success') return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    if (mode === 'error') return <XCircle className="h-5 w-5 text-red-600" />;
    if (mode === 'loading') return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />;
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {sourceInfo.component} • {sourceInfo.file}
          </DialogDescription>
        </DialogHeader>

        {mode === 'input' && (
          <div className="grid gap-4 py-4">
            <Input
              autoFocus
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="请输入修改诉求..."
            />
          </div>
        )}

        {mode === 'loading' && (
          <div className="py-8 text-center text-sm text-gray-500">
            AI 正在处理...
          </div>
        )}

        {(mode === 'success' || mode === 'error') && (
          <div className="py-4 text-sm text-gray-700">
            {resultMessage}
          </div>
        )}

        <DialogFooter>
          {mode === 'input' && (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSubmit} disabled={!feedback.trim()}>
                提交
              </Button>
            </>
          )}
          {(mode === 'success' || mode === 'error') && (
            <Button onClick={() => setOpen(false)} className="w-full">
              关闭
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
