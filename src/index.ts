/**
 * Network request information from Performance API
 */
export interface NetworkRequest {
  url: string;
  type: string;
  duration: number;
  transferSize: number;
  encodedBodySize: number;
  decodedBodySize: number;
  startTime: number;
  fetchStart: number;
  responseEnd: number;
  protocol: string;
}

/**
 * Options for listing network requests
 */
export interface ListNetworkRequestsOptions {
  /** Maximum number of requests to return. When omitted, returns all requests. */
  pageSize?: number;
  /** Page number to return (0-based). When omitted, returns the first page. */
  pageIdx?: number;
  /** Filter requests to only return requests of the specified resource types. When omitted or empty, returns all requests. */
  resourceTypes?: string[];
}

/**
 * List all network requests for the currently selected page since the last navigation.
 * Uses the native Performance API to retrieve resource timing information.
 * 
 * @param options - Options for filtering and paginating requests
 * @returns Array of network request information
 * 
 * @example
 * ```typescript
 * // Get all requests
 * const allRequests = listNetworkRequests();
 * 
 * // Get first 10 requests
 * const page1 = listNetworkRequests({ pageSize: 10, pageIdx: 0 });
 * 
 * // Get only fetch and XHR requests
 * const apiRequests = listNetworkRequests({ 
 *   resourceTypes: ['fetch', 'xmlhttprequest'] 
 * });
 * ```
 */
export function listNetworkRequests(options: ListNetworkRequestsOptions = {}): NetworkRequest[] {
  const { pageSize, pageIdx = 0, resourceTypes = [] } = options;
  
  // Get all network requests since last navigation
  let entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  // Filter by resource types if specified
  if (resourceTypes.length > 0) {
    entries = entries.filter(entry => 
      resourceTypes.includes(entry.initiatorType)
    );
  }
  
  // Pagination
  if (pageSize !== undefined) {
    const start = pageIdx * pageSize;
    entries = entries.slice(start, start + pageSize);
  }
  
  return entries.map(entry => ({
    url: entry.name,
    type: entry.initiatorType,
    duration: entry.duration,
    transferSize: entry.transferSize,
    encodedBodySize: entry.encodedBodySize,
    decodedBodySize: entry.decodedBodySize,
    startTime: entry.startTime,
    fetchStart: entry.fetchStart,
    responseEnd: entry.responseEnd,
    protocol: entry.nextHopProtocol
  }));
}

/**
 * Get a network request by URL.
 * Uses the native Performance API to retrieve resource timing information.
 * 
 * @param url - The URL of the request to retrieve
 * @returns The network request information, or null if not found
 * 
 * @example
 * ```typescript
 * const request = getNetworkRequest('https://api.example.com/data');
 * if (request) {
 *   console.log(`Request took ${request.duration}ms`);
 * }
 * ```
 */
export function getNetworkRequest(url: string): NetworkRequest | null {
  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const entry = entries.find(e => e.name === url);
  
  if (!entry) {
    return null;
  }
  
  return {
    url: entry.name,
    type: entry.initiatorType,
    duration: entry.duration,
    transferSize: entry.transferSize,
    encodedBodySize: entry.encodedBodySize,
    decodedBodySize: entry.decodedBodySize,
    startTime: entry.startTime,
    fetchStart: entry.fetchStart,
    responseEnd: entry.responseEnd,
    protocol: entry.nextHopProtocol
  };
}

/**
 * Clear all recorded network requests.
 * This is automatically done on page navigation, but can be manually triggered.
 * 
 * @example
 * ```typescript
 * clearNetworkRequests();
 * ```
 */
export function clearNetworkRequests(): void {
  performance.clearResourceTimings();
}

/**
 * Get the total count of network requests since last navigation.
 * 
 * @param resourceTypes - Optional filter for specific resource types
 * @returns The total count of requests
 * 
 * @example
 * ```typescript
 * const totalRequests = getNetworkRequestCount();
 * const fetchRequests = getNetworkRequestCount(['fetch', 'xmlhttprequest']);
 * ```
 */
export function getNetworkRequestCount(resourceTypes?: string[]): number {
  let entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  if (resourceTypes && resourceTypes.length > 0) {
    entries = entries.filter(entry => 
      resourceTypes.includes(entry.initiatorType)
    );
  }
  
  return entries.length;
}
