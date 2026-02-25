/**
 * Realtime Client SDK
 *
 * Client-side library for connecting to the real-time coordination system
 */

export type EventType =
  | 'artifact.created'
  | 'artifact.updated'
  | 'artifact.completed'
  | 'quality.updated'
  | 'review.submitted'
  | 'escalation.created'
  | 'cost.updated'
  | 'presence.joined'
  | 'presence.left'
  | 'heartbeat';

export interface RealtimeEvent {
  type: EventType;
  timestamp: number;
  data: unknown;
  userId?: string;
  sessionId?: string;
}

export type EventHandler = (event: RealtimeEvent) => void;

export interface RealtimeClientOptions {
  url: string;
  userId: string;
  userName: string;
  autoReconnect?: boolean;
  heartbeatInterval?: number;
}

/**
 * Realtime client for WebSocket connections
 */
export class RealtimeClient {
  private ws: WebSocket | null = null;
  private options: Required<RealtimeClientOptions>;
  private handlers: Map<EventType, Set<EventHandler>> = new Map();
  private subscriptions: Set<string> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private sessionId: string | null = null;

  constructor(options: RealtimeClientOptions) {
    this.options = {
      ...options,
      autoReconnect: options.autoReconnect ?? true,
      heartbeatInterval: options.heartbeatInterval ?? 30000, // 30 seconds
    };
  }

  /**
   * Connect to the WebSocket server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = `${this.options.url}?userId=${encodeURIComponent(this.options.userId)}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.addEventListener('open', () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        resolve();
      });

      this.ws.addEventListener('message', (event) => {
        this.handleMessage(event.data);
      });

      this.ws.addEventListener('close', () => {
        console.log('WebSocket closed');
        this.stopHeartbeat();

        if (this.options.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
          console.log(`Reconnecting in ${delay}ms...`);
          setTimeout(() => this.connect(), delay);
        }
      });

      this.ws.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      });
    });
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.sessionId = null;
  }

  /**
   * Subscribe to an event type
   */
  on(eventType: EventType, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    this.handlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }

  /**
   * Unsubscribe from an event type
   */
  off(eventType: EventType, handler: EventHandler): void {
    this.handlers.get(eventType)?.delete(handler);
  }

  /**
   * Subscribe to artifact updates
   */
  subscribeToArtifact(artifactId: string): void {
    this.subscriptions.add(artifactId);
    this.send({
      type: 'presence.joined',
      timestamp: Date.now(),
      data: {
        artifactId,
        userName: this.options.userName,
      },
    });
  }

  /**
   * Unsubscribe from artifact updates
   */
  unsubscribeFromArtifact(artifactId: string): void {
    this.subscriptions.delete(artifactId);
    this.send({
      type: 'presence.left',
      timestamp: Date.now(),
      data: {
        artifactId,
      },
    });
  }

  /**
   * Send a message to the server
   */
  send(event: RealtimeEvent): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected');
      return;
    }

    this.ws.send(JSON.stringify(event));
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(data: string): void {
    try {
      const event = JSON.parse(data) as RealtimeEvent;

      // Store session ID from welcome message
      if (event.type === 'heartbeat' && event.data && typeof event.data === 'object') {
        const data = event.data as any;
        if (data.sessionId) {
          this.sessionId = data.sessionId;
        }
      }

      // Trigger event handlers
      const handlers = this.handlers.get(event.type);
      if (handlers) {
        handlers.forEach((handler) => {
          try {
            handler(event);
          } catch (error) {
            console.error('Error in event handler:', error);
          }
        });
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }

  /**
   * Start sending heartbeats
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      this.send({
        type: 'heartbeat',
        timestamp: Date.now(),
        data: {},
      });
    }, this.options.heartbeatInterval);
  }

  /**
   * Stop sending heartbeats
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Get connection status
   */
  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get current session ID
   */
  get currentSessionId(): string | null {
    return this.sessionId;
  }
}

// ============================================================================
// REACT HOOKS (if using React)
// ============================================================================

/**
 * React hook for using realtime client
 */
export function useRealtimeClient(options: RealtimeClientOptions) {
  const clientRef = { current: null as RealtimeClient | null };

  const connect = async () => {
    if (clientRef.current) {
      clientRef.current.disconnect();
    }

    const client = new RealtimeClient(options);
    await client.connect();
    clientRef.current = client;
    return client;
  };

  const disconnect = () => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
  };

  return {
    client: clientRef.current,
    connect,
    disconnect,
    isConnected: clientRef.current?.isConnected ?? false,
  };
}

/**
 * React hook for subscribing to events
 */
export function useRealtimeEvent(
  client: RealtimeClient | null,
  eventType: EventType,
  handler: EventHandler
) {
  if (client) {
    const unsubscribe = client.on(eventType, handler);
    return unsubscribe;
  }
  return () => {};
}

/**
 * React hook for artifact subscription
 */
export function useArtifactSubscription(
  client: RealtimeClient | null,
  artifactId: string | null
) {
  if (client && artifactId) {
    client.subscribeToArtifact(artifactId);

    return () => {
      if (client && artifactId) {
        client.unsubscribeFromArtifact(artifactId);
      }
    };
  }

  return () => {};
}

// ============================================================================
// SVELTE STORES (if using Svelte)
// ============================================================================

/**
 * Svelte store for realtime connection
 */
export function createRealtimeStore(options: RealtimeClientOptions) {
  let client: RealtimeClient | null = null;
  const subscribers = new Set<(connected: boolean) => void>();

  const notify = (connected: boolean) => {
    subscribers.forEach((fn) => fn(connected));
  };

  return {
    subscribe(fn: (connected: boolean) => void) {
      subscribers.add(fn);
      fn(client?.isConnected ?? false);

      return () => {
        subscribers.delete(fn);
      };
    },

    async connect() {
      if (client) {
        client.disconnect();
      }

      client = new RealtimeClient(options);
      await client.connect();
      notify(true);
      return client;
    },

    disconnect() {
      if (client) {
        client.disconnect();
        client = null;
        notify(false);
      }
    },

    getClient(): RealtimeClient | null {
      return client;
    },
  };
}
