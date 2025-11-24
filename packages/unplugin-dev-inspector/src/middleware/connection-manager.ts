import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { bindPuppet } from "@mcpc-tech/cmcp";

type Transport = StreamableHTTPServerTransport | SSEServerTransport;

export class ConnectionManager {
  public transports: Record<string, Transport> = {};
  private latestInspectorSessionId: string | null = null;
  private chromeWatcherSessionIds = new Set<string>();
  private boundPuppets = new Map<string, any>();

  constructor() {}

  getTransport(sessionId: string): Transport | undefined {
    return this.transports[sessionId];
  }

  registerTransport(sessionId: string, transport: Transport) {
    this.transports[sessionId] = transport;

    // Clean up on close
    transport.onclose = () => {
      this.removeTransport(sessionId);
    };
  }

  removeTransport(sessionId: string) {
    if (this.transports[sessionId]) {
      delete this.transports[sessionId];
    }

    if (this.chromeWatcherSessionIds.has(sessionId)) {
      this.chromeWatcherSessionIds.delete(sessionId);
      this.boundPuppets.delete(sessionId);
    }
  }

  handleInspectorConnection(sessionId: string) {
    this.latestInspectorSessionId = sessionId;
    this.rebindWatchersToInspector(sessionId);
  }

  private rebindWatchersToInspector(inspectorSessionId: string) {
    const inspectorTransport = this.transports[inspectorSessionId];
    if (!inspectorTransport) return;

    for (const watcherSessionId of this.chromeWatcherSessionIds) {
      const watcherTransport = this.transports[watcherSessionId];
      if (watcherTransport) {
        // Unbind previous puppet if exists
        const previousBound = this.boundPuppets.get(watcherSessionId);
        if (previousBound && typeof previousBound.unbindPuppet === "function") {
          previousBound.unbindPuppet();
        }

        // Bind to new inspector
        // bindPuppet(puppet, host) -> bindPuppet(watcher, inspector)
        const newBound = bindPuppet(watcherTransport, inspectorTransport);
        this.boundPuppets.set(watcherSessionId, newBound);
      }
    }
  }

  handleWatcherConnection(
    sessionId: string,
    puppetId: string,
    transport: Transport,
  ) {
    if (puppetId === "chrome") {
      this.chromeWatcherSessionIds.add(sessionId);

      if (this.latestInspectorSessionId) {
        const inspectorTransport =
          this.transports[this.latestInspectorSessionId];
        if (inspectorTransport) {
          const boundTransport = bindPuppet(transport, inspectorTransport);
          this.boundPuppets.set(sessionId, boundTransport);
          return boundTransport;
        }
      }
    } else {
      // Handle other puppet IDs if necessary, currently only 'chrome' is special
      const targetTransport = this.transports[puppetId];
      if (targetTransport) {
        const boundTransport = bindPuppet(transport, targetTransport);
        return boundTransport;
      }
    }
    return null;
  }
}
