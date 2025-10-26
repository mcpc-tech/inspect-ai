import type { EnhancedNetworkRequest } from '../interceptor';

interface RequestDetailProps {
  request: EnhancedNetworkRequest | null;
  title?: string;
}

export default function RequestDetail({ request, title = 'Request Details' }: RequestDetailProps) {
  if (!request) {
    return (
      <div className="p-4 text-gray-500 dark:text-gray-400 text-sm text-center">
        Click a request to view details
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[600px] overflow-y-auto">
      {/* URL and basic info */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">URL</h4>
        <div className="text-sm text-gray-900 dark:text-gray-100 break-all bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700">
          {request.url}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Method</h4>
          <div className="text-sm">
            <span className="inline-block px-2 py-1 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">
              {request.method}
            </span>
          </div>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Type</h4>
          <div className="text-sm">
            <span className="inline-block px-2 py-1 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 rounded text-xs font-medium">
              {request.type}
            </span>
          </div>
        </div>
      </div>

      {/* Status */}
      {request.status && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Status</h4>
          <div className="flex items-center gap-2">
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
              request.status >= 200 && request.status < 300 
                ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400'
                : request.status >= 400
                ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400'
                : 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400'
            }`}>
              {request.status}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">{request.statusText}</span>
          </div>
        </div>
      )}

      {/* Duration */}
      {request.duration !== undefined && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Duration</h4>
          <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-2 rounded">
            {request.duration.toFixed(2)} ms
          </div>
        </div>
      )}

      {/* Request Headers */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Request Headers</h4>
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-100 dark:border-gray-700 max-h-48 overflow-auto">
          {Object.keys(request.requestHeaders).length > 0 ? (
            <div className="space-y-1 text-xs">
              {Object.entries(request.requestHeaders).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300 min-w-[120px]">{key}:</span>
                  <span className="text-gray-600 dark:text-gray-400 break-all">{value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-500 dark:text-gray-400">No headers</div>
          )}
        </div>
      </div>

      {/* Request Body */}
      {request.requestBody && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Request Body</h4>
          <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-100 dark:border-gray-700 overflow-auto max-h-48 text-gray-700 dark:text-gray-300">
            {typeof request.requestBody === 'string' 
              ? request.requestBody 
              : JSON.stringify(request.requestBody, null, 2)}
          </pre>
        </div>
      )}

      {/* Response Headers */}
      {request.responseHeaders && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Response Headers</h4>
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-100 dark:border-gray-700 max-h-48 overflow-auto">
            {Object.keys(request.responseHeaders).length > 0 ? (
              <div className="space-y-1 text-xs">
                {Object.entries(request.responseHeaders).map(([key, value]) => (
                  <div key={key} className="flex gap-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300 min-w-[120px]">{key}:</span>
                    <span className="text-gray-600 dark:text-gray-400 break-all">{value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-500 dark:text-gray-400">No headers</div>
            )}
          </div>
        </div>
      )}

      {/* Response Body */}
      {request.responseBody && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Response Body</h4>
          <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-100 dark:border-gray-700 overflow-auto max-h-64 text-gray-700 dark:text-gray-300">
            {typeof request.responseBody === 'string' 
              ? request.responseBody 
              : JSON.stringify(request.responseBody, null, 2)}
          </pre>
        </div>
      )}

      {/* Error Info */}
      {request.error && (
        <div>
          <h4 className="text-xs font-semibold text-red-500 dark:text-red-400 uppercase mb-2">Error</h4>
          <div className="text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950 p-3 rounded border border-red-100 dark:border-red-900">
            {request.error}
          </div>
        </div>
      )}
    </div>
  );
}
