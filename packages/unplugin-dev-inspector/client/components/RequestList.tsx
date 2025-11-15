// RequestList - no default React import needed
import type { EnhancedNetworkRequest } from '../types';

export default function RequestList({ 
  requests, 
  onSelect 
}: { 
  requests: EnhancedNetworkRequest[];
  onSelect?: (request: EnhancedNetworkRequest) => void;
}) {
  if (!requests || requests.length === 0) {
    return (
      <div className="p-6 bg-white rounded text-center">
        <div className="text-gray-500 mb-2">No network requests captured yet</div>
        <div className="text-sm text-gray-400">
          Interact with your app to see network requests appear here
        </div>
      </div>
    );
  }
  return (
    <div className="overflow-auto max-h-80 bg-white rounded">
      {requests.map((r, i) => (
        <div 
          key={r.id || i} 
          className="border-b last:border-b-0 py-3 px-2 hover:bg-gray-50 cursor-pointer transition-colors"
          onClick={() => onSelect?.(r)}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
              r.method === 'GET' ? 'bg-blue-50 text-blue-700' :
              r.method === 'POST' ? 'bg-green-50 text-green-700' :
              r.method === 'PUT' ? 'bg-yellow-50 text-yellow-700' :
              r.method === 'DELETE' ? 'bg-red-50 text-red-700' :
              'bg-gray-50 text-gray-700'
            }`}>
              {r.method}
            </span>
            {r.status && (
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                r.status >= 200 && r.status < 300 
                  ? 'bg-green-50 text-green-700'
                  : r.status >= 400
                  ? 'bg-red-50 text-red-700'
                  : 'bg-yellow-50 text-yellow-700'
              }`}>
                {r.status}
              </span>
            )}
          </div>
          <div className="font-medium text-gray-900 text-sm truncate">{r.url}</div>
          <div className="text-xs text-gray-600 mt-1">
            <span className="inline-block px-2 py-0.5 bg-gray-100 rounded mr-2">{r.type}</span>
            {r.duration !== undefined && `${r.duration.toFixed(2)}ms`}
          </div>
        </div>
      ))}
    </div>
  );
}
