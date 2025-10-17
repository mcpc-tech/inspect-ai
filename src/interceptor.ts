export interface EnhancedNetworkRequest {
  id: string;
  url: string;
  method: string;
  type: 'fetch' | 'xhr';
  timestamp: number;
  duration?: number;
  requestHeaders: Record<string, string>;
  requestBody?: any;
  status?: number;
  statusText?: string;
  responseHeaders?: Record<string, string>;
  responseBody?: any;
  responseType?: string;
  error?: string;
}

const requests: EnhancedNetworkRequest[] = [];
const MAX_REQUESTS = 100;

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

function updateRequest(id: string, updates: Partial<EnhancedNetworkRequest>): void {
  const request = requests.find(r => r.id === id);
  if (request) {
    Object.assign(request, updates);
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 拦截 fetch 请求
 */
export function interceptFetch(): void {
  const originalFetch = window.fetch;
  
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const method = init?.method || 'GET';
    const id = generateId();
    const startTime = Date.now();
    
    const requestHeaders: Record<string, string> = {};
    if (init?.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((value, key) => { requestHeaders[key] = value; });
      } else if (Array.isArray(init.headers)) {
        init.headers.forEach(([key, value]) => { requestHeaders[key] = value; });
      } else {
        Object.assign(requestHeaders, init.headers);
      }
    }
    
    let requestBody: any;
    if (init?.body && typeof init.body === 'string') {
      requestBody = init.body;
      try { requestBody = JSON.parse(init.body); } catch {}
    }
    
    addRequest({
      id, url, method, type: 'fetch', timestamp: startTime,
      requestHeaders, requestBody,
    });
    
    try {
      const response = await originalFetch(input, init);
      const duration = Date.now() - startTime;
      
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => { responseHeaders[key] = value; });
      
      const contentType = response.headers.get('content-type') || '';
      let responseBody: any;
      
      try {
        const cloned = response.clone();
        if (contentType.includes('application/json')) {
          responseBody = await cloned.json();
        } else if (contentType.includes('text/')) {
          responseBody = await cloned.text();
        } else {
          responseBody = `[Binary: ${contentType}]`;
        }
      } catch {
        responseBody = '[Parse failed]';
      }
      
      updateRequest(id, {
        duration,
        status: response.status,
        statusText: response.statusText,
        responseHeaders,
        responseBody,
        responseType: contentType,
      });
      
      return response;
    } catch (error: any) {
      updateRequest(id, {
        duration: Date.now() - startTime,
        error: error.message || 'Request failed',
      });
      throw error;
    }
  };
}

/**
 * 拦截 XMLHttpRequest
 */
export function interceptXHR(): void {
  const OriginalXHR = window.XMLHttpRequest;
  
  (window as any).XMLHttpRequest = function() {
    const xhr = new OriginalXHR();
    const id = generateId();
    let url = '';
    let method = 'GET';
    let startTime = 0;
    const requestHeaders: Record<string, string> = {};
    let requestBody: any;
    
    const originalOpen = xhr.open;
    xhr.open = function(m: string, u: string | URL, ...args: any[]) {
      method = m;
      url = typeof u === 'string' ? u : u.toString();
      return originalOpen.apply(xhr, [m, u, ...args] as any);
    };
    
    const originalSetRequestHeader = xhr.setRequestHeader;
    xhr.setRequestHeader = function(header: string, value: string) {
      requestHeaders[header] = value;
      return originalSetRequestHeader.apply(xhr, [header, value]);
    };
    
    const originalSend = xhr.send;
    xhr.send = function(body?: Document | XMLHttpRequestBodyInit | null) {
      startTime = Date.now();
      
      if (body && typeof body === 'string') {
        requestBody = body;
        try { requestBody = JSON.parse(body); } catch {}
      }
      
      addRequest({
        id, url, method, type: 'xhr', timestamp: startTime,
        requestHeaders, requestBody,
      });
      
      xhr.addEventListener('loadend', () => {
        const duration = Date.now() - startTime;
        const responseHeaders: Record<string, string> = {};
        
        xhr.getAllResponseHeaders().split('\r\n').forEach(line => {
          const [key, value] = line.split(': ');
          if (key && value) responseHeaders[key] = value;
        });
        
        let responseBody: any = xhr.responseText;
        const contentType = xhr.getResponseHeader('content-type') || '';
        if (contentType.includes('application/json')) {
          try { responseBody = JSON.parse(xhr.responseText); } catch {}
        }
        
        updateRequest(id, {
          duration,
          status: xhr.status,
          statusText: xhr.statusText,
          responseHeaders,
          responseBody,
          responseType: contentType,
          error: xhr.status === 0 ? 'Network error' : undefined,
        });
      });
      
      return originalSend.apply(xhr, [body] as any);
    };
    
    return xhr;
  };
  
  (window as any).XMLHttpRequest.prototype = OriginalXHR.prototype;
}

export function initInterceptors(): void {
  interceptFetch();
  interceptXHR();
}
