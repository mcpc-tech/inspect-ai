// Agent type definition - shared between src and client
export interface Agent {
  name: string;
  command: string;
  args?: string[];
  env: Array<{
    key: string;
    required: boolean;
  }>;
  authMethodId?: string;
  meta?: {
    icon?: string;
  };
}
