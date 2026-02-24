/**
 * WebSocket Coordinator - Real-time updates using Durable Objects
 *
 * Provides real-time synchronization for:
 * - Artifact creation/updates
 * - Quality score changes
 * - Operator reviews
 * - Cost tracking updates
 * - Presence (who's viewing what)
 */

// ============================================================================
// TYPES
// ============================================================================

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

export interface PresenceInfo {
  userId: string;
  userName: string;
  sessionId: string;
  artifactId?: string;
  lastSeen: number;
}

export interface WebSocketSession {
  ws: WebSocket;
  sessionId: string;
  userId: string;
  subscriptions: Set<string>; // artifact IDs, channels
  lastHeartbeat: number;
}

// ============================================================================
// DURABLE OBJECT: REALTIME COORDINATOR
// ============================================================================

export class RealtimeCoordinator {
  private state: DurableObjectState;
  private sessions: Map<string, WebSocketSession>;
  private presence: Map<string, PresenceInfo>;

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.sessions = new Map();
    this.presence = new Map();

    // Clean up stale sessions every minute
    this.state.blockConcurrencyWhile(async () => {
      setInterval(() => this.cleanupStaleSessions(), 60000);
    });
  }

  /**
   * Handle incoming WebSocket connections
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocketUpgrade(request);
    }

    // HTTP API endpoints
    switch (url.pathname) {
      case '/broadcast':
        return this.handleBroadcast(request);

      case '/presence':
        return this.handlePresenceQuery(request);

      case '/sessions':
        return this.handleSessionsQuery(request);

      default:
        return new Response('Not found', { status: 404 });
    }
  }

  /**
   * Upgrade HTTP connection to WebSocket
   */
  private async handleWebSocketUpgrade(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || 'anonymous';
    const sessionId = crypto.randomUUID();

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Accept the WebSocket connection
    server.accept();

    // Create session
    const session: WebSocketSession = {
      ws: server,
      sessionId,
      userId,
      subscriptions: new Set(),
      lastHeartbeat: Date.now(),
    };

    this.sessions.set(sessionId, session);

    // Set up event handlers
    server.addEventListener('message', (event) => {
      this.handleMessage(sessionId, event.data as string);
    });

    server.addEventListener('close', () => {
      this.handleDisconnect(sessionId);
    });

    server.addEventListener('error', () => {
      this.handleDisconnect(sessionId);
    });

    // Send welcome message
    this.sendToSession(sessionId, {
      type: 'heartbeat',
      timestamp: Date.now(),
      data: {
        sessionId,
        userId,
        message: 'Connected to realtime coordinator',
      },
    });

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(sessionId: string, message: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    try {
      const event = JSON.parse(message) as RealtimeEvent;

      switch (event.type) {
        case 'heartbeat':
          session.lastHeartbeat = Date.now();
          this.sendToSession(sessionId, {
            type: 'heartbeat',
            timestamp: Date.now(),
            data: { status: 'ok' },
          });
          break;

        case 'presence.joined':
          this.handlePresenceJoin(session, event.data as any);
          break;

        case 'presence.left':
          this.handlePresenceLeave(session);
          break;

        default:
          // Echo back for now
          this.sendToSession(sessionId, event);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  /**
   * Handle presence join (user viewing an artifact)
   */
  private handlePresenceJoin(
    session: WebSocketSession,
    data: { artifactId: string; userName: string }
  ): void {
    const presenceInfo: PresenceInfo = {
      userId: session.userId,
      userName: data.userName,
      sessionId: session.sessionId,
      artifactId: data.artifactId,
      lastSeen: Date.now(),
    };

    this.presence.set(session.sessionId, presenceInfo);

    // Subscribe to artifact updates
    session.subscriptions.add(data.artifactId);

    // Broadcast presence to other sessions watching this artifact
    this.broadcastToSubscribers(data.artifactId, {
      type: 'presence.joined',
      timestamp: Date.now(),
      data: {
        userId: session.userId,
        userName: data.userName,
        artifactId: data.artifactId,
      },
      userId: session.userId,
      sessionId: session.sessionId,
    });
  }

  /**
   * Handle presence leave
   */
  private handlePresenceLeave(session: WebSocketSession): void {
    const presenceInfo = this.presence.get(session.sessionId);
    if (!presenceInfo) return;

    // Broadcast leave event
    if (presenceInfo.artifactId) {
      this.broadcastToSubscribers(presenceInfo.artifactId, {
        type: 'presence.left',
        timestamp: Date.now(),
        data: {
          userId: session.userId,
          artifactId: presenceInfo.artifactId,
        },
        userId: session.userId,
        sessionId: session.sessionId,
      });
    }

    this.presence.delete(session.sessionId);
  }

  /**
   * Handle disconnection
   */
  private handleDisconnect(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Remove presence
    this.handlePresenceLeave(session);

    // Close WebSocket if still open
    try {
      session.ws.close();
    } catch (error) {
      // Already closed
    }

    this.sessions.delete(sessionId);
  }

  /**
   * Broadcast event via HTTP API
   */
  private async handleBroadcast(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const event = (await request.json()) as RealtimeEvent & { channel?: string };
      const channel = event.channel || 'global';

      this.broadcastToSubscribers(channel, event);

      return new Response(
        JSON.stringify({
          success: true,
          recipients: this.getSubscriberCount(channel),
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  /**
   * Query presence information
   */
  private async handlePresenceQuery(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const artifactId = url.searchParams.get('artifactId');

    let presenceList = Array.from(this.presence.values());

    if (artifactId) {
      presenceList = presenceList.filter((p) => p.artifactId === artifactId);
    }

    return new Response(JSON.stringify(presenceList), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Query active sessions
   */
  private async handleSessionsQuery(request: Request): Promise<Response> {
    const sessionInfo = Array.from(this.sessions.values()).map((session) => ({
      sessionId: session.sessionId,
      userId: session.userId,
      subscriptions: Array.from(session.subscriptions),
      lastHeartbeat: session.lastHeartbeat,
      connected: true,
    }));

    return new Response(JSON.stringify(sessionInfo), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Send event to specific session
   */
  private sendToSession(sessionId: string, event: RealtimeEvent): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    try {
      session.ws.send(JSON.stringify(event));
    } catch (error) {
      console.error('Error sending to session:', error);
      this.handleDisconnect(sessionId);
    }
  }

  /**
   * Broadcast to all subscribers of a channel
   */
  private broadcastToSubscribers(channel: string, event: RealtimeEvent): void {
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.subscriptions.has(channel) || channel === 'global') {
        this.sendToSession(sessionId, event);
      }
    }
  }

  /**
   * Get number of subscribers to a channel
   */
  private getSubscriberCount(channel: string): number {
    let count = 0;
    for (const session of this.sessions.values()) {
      if (session.subscriptions.has(channel) || channel === 'global') {
        count++;
      }
    }
    return count;
  }

  /**
   * Clean up stale sessions (no heartbeat for 2 minutes)
   */
  private cleanupStaleSessions(): void {
    const now = Date.now();
    const staleThreshold = 2 * 60 * 1000; // 2 minutes

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastHeartbeat > staleThreshold) {
        console.log(`Cleaning up stale session: ${sessionId}`);
        this.handleDisconnect(sessionId);
      }
    }
  }
}

// ============================================================================
// CLIENT-SIDE HELPERS
// ============================================================================

/**
 * Broadcast event to all connected clients
 */
export async function broadcastRealtimeEvent(
  env: any,
  event: RealtimeEvent & { channel?: string }
): Promise<void> {
  const id = env.CONSENSUS_COORDINATOR.idFromName('realtime');
  const coordinator = env.CONSENSUS_COORDINATOR.get(id);

  await coordinator.fetch('https://coordinator/broadcast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
}

/**
 * Get presence information for an artifact
 */
export async function getArtifactPresence(
  env: any,
  artifactId: string
): Promise<PresenceInfo[]> {
  const id = env.CONSENSUS_COORDINATOR.idFromName('realtime');
  const coordinator = env.CONSENSUS_COORDINATOR.get(id);

  const response = await coordinator.fetch(
    `https://coordinator/presence?artifactId=${artifactId}`
  );

  return response.json();
}

/**
 * Get active sessions count
 */
export async function getActiveSessions(env: any): Promise<number> {
  const id = env.CONSENSUS_COORDINATOR.idFromName('realtime');
  const coordinator = env.CONSENSUS_COORDINATOR.get(id);

  const response = await coordinator.fetch('https://coordinator/sessions');
  const sessions = await response.json();

  return Array.isArray(sessions) ? sessions.length : 0;
}
