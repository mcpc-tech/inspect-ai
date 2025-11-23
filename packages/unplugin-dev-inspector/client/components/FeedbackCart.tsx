import React from 'react';
import { Loader2, CheckCircle2, XCircle, X } from 'lucide-react';

export type FeedbackStatus = 'pending' | 'loading' | 'success' | 'error';

// Serializable version without Element references
export interface SourceInfo {
  file: string;
  component: string;
  line: number;
  column?: number;
  elementInfo?: {
    tagName: string;
    textContent: string;
    className: string;
    id: string;
    styles: Record<string, string>;
  };
}

export interface FeedbackItem {
  id: string;
  sourceInfo: SourceInfo;
  feedback: string;
  status: FeedbackStatus;
  progress?: {
    completed: number;
    total: number;
  };
  result?: string;
  timestamp: number;
}

interface FeedbackCartProps {
  items: FeedbackItem[];
  onRemove: (id: string) => void;
}

export const FeedbackCart: React.FC<FeedbackCartProps> = ({ items, onRemove }) => {
  if (items.length === 0) return null;

  const getStatusIcon = (status: FeedbackStatus) => {
    if (status === 'loading') return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    if (status === 'success') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === 'error') return <XCircle className="h-4 w-4 text-red-500" />;
    return <div className="h-4 w-4 rounded-full border-2 border-gray-400" />;
  };

  const getStatusText = (item: FeedbackItem) => {
    if (item.status === 'loading' && item.progress) {
      return `Processing... ${item.progress.completed}/${item.progress.total}`;
    }
    if (item.status === 'success') return 'Completed';
    if (item.status === 'error') return 'Failed';
    if (item.status === 'loading') return 'Processing';
    return 'Pending';
  };

  return (
    <div
      className="w-full bg-card rounded-lg overflow-hidden border border-border"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-muted px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-sm text-foreground">
          Feedback Queue ({items.length})
        </h3>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {items.map((item) => (
          <div
            key={item.id}
            className="px-4 py-3 border-b border-border hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getStatusIcon(item.status)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {item.sourceInfo.component}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.sourceInfo.file}:{item.sourceInfo.line}{item.sourceInfo.column !== undefined ? `:${item.sourceInfo.column}` : ''}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(item.id);
                    }}
                    className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-xs text-foreground/80 mt-1 line-clamp-2">
                  {item.feedback}
                </p>

                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">
                    {getStatusText(item)}
                  </span>

                  {item.status === 'loading' && item.progress && (
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{
                          width: `${(item.progress.completed / item.progress.total) * 100}%`
                        }}
                      />
                    </div>
                  )}
                </div>

                {item.status === 'error' && item.result && (
                  <p className="text-xs text-destructive mt-1">
                    {item.result}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
