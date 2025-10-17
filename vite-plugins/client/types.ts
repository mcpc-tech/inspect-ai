// Type Definitions
export interface InspectedElement {
  file: string;
  component: string;
  apis: string[];
  line: number;
  column: number;
  element?: Element;
}

export interface ReactFiber {
  type?: any;
  _owner?: ReactFiber;
  return?: ReactFiber;
  [key: string]: any;
}
