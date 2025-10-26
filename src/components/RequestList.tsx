// RequestList - no default React import needed
import type { EnhancedNetworkRequest } from '../interceptor';

const EMPTY_STATE_MESSAGE = 'No requests yet';

export default function RequestList({ 
  requests, 
  onSelect 
}: { 
  requests: EnhancedNetworkRequest[];
  onSelect?: (request: EnhancedNetworkRequest) => void;
}) {
  if (!requests || requests.length === 0) return (
    <pre className="p-4 bg-white dark:bg-gray-900 rounded text-gray-500 dark:text-gray-400">{EMPTY_STATE_MESSAGE}</pre>
  );
  return (
    <div className="overflow-auto max-h-80 bg-white dark:bg-gray-900 rounded">
      {requests.map((r, i) => (
        <div 
          key={r.id || i} 
          className="border-b dark:border-gray-800 last:border-b-0 py-3 px-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
          onClick={() => onSelect?.(r)}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
              r.method === 'GET' ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400' :
              r.method === 'POST' ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400' :
              r.method === 'PUT' ? 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400' :
              r.method === 'DELETE' ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400' :
              'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
            }`}>
              {r.method}
            </span>
            {r.status && (
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                r.status >= 200 && r.status < 300 
                  ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400'
                  : r.status >= 400
                  ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400'
                  : 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400'
              }`}>
                {r.status}
              </span>
            )}
          </div>
          <div className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">{r.url}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            <span className="inline-block px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded mr-2">{r.type}</span>
            {r.duration !== undefined && `${r.duration.toFixed(2)}ms`}
          </div>
        </div>
      ))}
    </div>
  );
}
