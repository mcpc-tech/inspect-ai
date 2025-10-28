export interface EnhancedNetworkRequest {
  id: string;
  url: string;
  method: string;
  type: 'fetch' | 'xhr' | 'other';
  timestamp: number;
  duration?: number;
  requestHeaders?: Record<string, string>;
  requestBody?: any;
  status?: number;
  statusText?: string;
  responseHeaders?: Record<string, string>;
  responseBody?: any;
  responseType?: string;
  error?: string;
  size?: number;
  initiator?: string;
}

const requests: EnhancedNetworkRequest[] = [];
const MAX_REQUESTS = 100;
let observer: PerformanceObserver | null = null;

export function getEnhancedRequests(): EnhancedNetworkRequest[] {
  return [...requests];
}

export function clearEnhancedRequests(): void {
  requests.length = 0;
}

function addRequest(request: EnhancedNetworkRequest): void {
  requests.unshift(request);
  if (requests.length > MAX_REQUESTS) {
    requests.pop();
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function mapInitiatorType(type: string): 'fetch' | 'xhr' | 'other' {
  if (type === 'fetch') return 'fetch';
  if (type === 'xmlhttprequest') return 'xhr';
  return 'other';
}

/**
 * Initialize interceptors using PerformanceObserver (non-invasive)
 * This doesn't modify native fetch/XHR methods, so it won't interfere with MCP SSE connections
 */
export function initInterceptors(): void {
  if (observer) {
    return; // Already initialized
  }

  // Use PerformanceObserver to watch for network requests
  observer = new PerformanceObserver((list) => {
    const entries = list.getEntries() as PerformanceResourceTiming[];
    
    entries.forEach((entry) => {
      // Only capture fetch and XHR requests
      if (entry.initiatorType !== 'fetch' && entry.initiatorType !== 'xmlhttprequest') {
        return;
      }

      const id = generateId();
      const type = mapInitiatorType(entry.initiatorType);
      
      // Extract basic information from PerformanceResourceTiming
      const request: EnhancedNetworkRequest = {
        id,
        url: entry.name,
        method: 'GET', // Performance API doesn't provide method, assume GET
        type,
        timestamp: entry.startTime + performance.timeOrigin,
        duration: entry.duration,
        size: entry.transferSize,
        initiator: entry.initiatorType,
      };

      // Note: Performance API doesn't provide headers, body, or status code
      // These would require native method patching, which we're avoiding
      
      addRequest(request);
    });
  });

  // Start observing resource entries
  observer.observe({ entryTypes: ['resource'] });
}

/**
 * Stop observing network requests
 */
export function stopInterceptors(): void {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}
