/* eslint-disable @typescript-eslint/no-this-alias */
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
let originalFetch: typeof window.fetch | null = null;
let originalXhrOpen: typeof XMLHttpRequest.prototype.open | null = null;
let originalXhrSend: typeof XMLHttpRequest.prototype.send | null = null;

export function getEnhancedRequests(): EnhancedNetworkRequest[] {
  return [...requests];
}

export function clearEnhancedRequests(): void {
  requests.length = 0;
}

function addRequest(request: Partial<EnhancedNetworkRequest>): void {
  const fullRequest: EnhancedNetworkRequest = {
    id: generateId(),
    timestamp: Date.now(),
    ...request,
  } as EnhancedNetworkRequest;
  requests.unshift(fullRequest);
  if (requests.length > MAX_REQUESTS) {
    requests.pop();
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function patchFetch(): void {
  if (originalFetch) return;
  originalFetch = window.fetch;

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const request: Partial<EnhancedNetworkRequest> = {
      type: 'fetch',
      method: init?.method?.toUpperCase() || 'GET',
    };

    if (typeof input === 'string') {
      request.url = input;
    } else if (input instanceof URL) {
      request.url = input.href;
    } else {
      request.url = input.url;
      request.method = input.method?.toUpperCase() || 'GET';
    }

    request.requestHeaders = {};
    if (init?.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((value, key) => {
          (request.requestHeaders as Record<string, string>)[key] = value;
        });
      } else if (Array.isArray(init.headers)) {
        init.headers.forEach(([key, value]) => {
          (request.requestHeaders as Record<string, string>)[key] = value;
        });
      } else {
        request.requestHeaders = init.headers;
      }
    }
    
    if (init?.body) {
      try {
        request.requestBody = JSON.parse(init.body as string);
      } catch (e) {
        request.requestBody = init.body;
      }
    }

    const startTime = performance.now();

    try {
      const response = await originalFetch!(input, init);
      const endTime = performance.now();
      request.duration = endTime - startTime;
      request.status = response.status;
      request.statusText = response.statusText;
      request.responseHeaders = {};
      response.headers.forEach((value, key) => {
        (request.responseHeaders as Record<string, string>)[key] = value;
      });

      const clone = response.clone();
      const contentType = clone.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        request.responseBody = await clone.json();
      } else if (contentType.includes('text/')) {
        request.responseBody = await clone.text();
      } else {
        request.responseBody = 'Binary data';
      }
      
      addRequest(request);
      return response;
    } catch (error: any) {
      const endTime = performance.now();
      request.duration = endTime - startTime;
      request.error = error.message;
      addRequest(request);
      throw error;
    }
  };
}

function patchXhr(): void {
  if (originalXhrOpen || originalXhrSend) return;

  originalXhrOpen = XMLHttpRequest.prototype.open;
  originalXhrSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (
    method: string,
    url: string | URL,
    async?: boolean,
    username?: string | null,
    password?: string | null
  ): void {
    this._requestData = {
      method: method.toUpperCase(),
      url: url.toString(),
      type: 'xhr',
    };
    originalXhrOpen!.call(this, method, url, async === undefined ? true : async, username, password);
  };

  XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null): void {
    this._requestData.requestBody = body;
    this._startTime = performance.now();

    this.addEventListener('load', () => {
      const endTime = performance.now();
      this._requestData.duration = endTime - this._startTime;
      this._requestData.status = this.status;
      this._requestData.statusText = this.statusText;
      this._requestData.responseHeaders = {};
      const headers = this.getAllResponseHeaders().trim().split(/[\r\n]+/);
      headers.forEach(line => {
        const parts = line.split(': ');
        const header = parts.shift();
        const value = parts.join(': ');
        if (header) {
          this._requestData.responseHeaders[header] = value;
        }
      });

      try {
        if (this.responseType === '' || this.responseType === 'text') {
          this._requestData.responseBody = JSON.parse(this.responseText);
        } else {
          this._requestData.responseBody = this.response;
        }
      } catch (e) {
        this._requestData.responseBody = this.response;
      }
      
      addRequest(this._requestData);
    });

    this.addEventListener('error', () => {
      const endTime = performance.now();
      this._requestData.duration = endTime - this._startTime;
      this._requestData.error = 'Request failed';
      addRequest(this._requestData);
    });

    originalXhrSend!.call(this, body);
  };
}

/**
 * Initialize interceptors by patching native fetch and XHR methods.
 */
export function initInterceptors(): void {
  patchFetch();
  patchXhr();
}

/**
 * Stop observing network requests and restore original methods.
 */
export function stopInterceptors(): void {
  if (originalFetch) {
    window.fetch = originalFetch;
    originalFetch = null;
  }
  if (originalXhrOpen && originalXhrSend) {
    XMLHttpRequest.prototype.open = originalXhrOpen;
    XMLHttpRequest.prototype.send = originalXhrSend;
    originalXhrOpen = null;
    originalXhrSend = null;
  }
}

// Extend the XMLHttpRequest interface to store custom data
declare global {
  interface XMLHttpRequest {
    _requestData: Partial<EnhancedNetworkRequest>;
    _startTime: number;
  }
}