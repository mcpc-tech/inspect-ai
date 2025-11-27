/**
 * ACP (Agent Client Protocol) options for configuring agent behavior
 */
export interface AcpOptions {
  /**
   * ACP provider mode
   * @default undefined (skipped if not specified)
   */
  acpMode?: string;

  /**
   * ACP provider model
   * @default undefined (skipped if not specified)
   */
  acpModel?: string;

  /**
   * Delay in milliseconds after session is initialized to ensure mcp server is ready,
   * some agents may connect mcp asynchronously after session init
   * @default undefined (skipped if not specified)
   */
  acpDelay?: number;
}

// Agent type definition - shared between src and client
export interface Agent extends AcpOptions {
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
