// Type Definitions
export interface InspectedElement {
  file: string;
  component: string;
  apis: string[];
  line: number;
  column: number;
  element?: Element;
  elementInfo?: {
    tagName: string;
    textContent: string;
    className: string;
    id: string;
    attributes: Record<string, string>;
    styles: Record<string, string>;
  };
}

export interface ReactFiber {
  type?: any;
  _owner?: ReactFiber;
  return?: ReactFiber;
  [key: string]: any;
}

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
  size?: number;
  initiator?: string;
}
