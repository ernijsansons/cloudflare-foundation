/**
 * Realtime Client Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RealtimeClient } from '../realtime-client';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  private eventListeners: Map<string, Set<Function>> = new Map();
  sentMessages: string[] = [];

  constructor(public url: string) {
    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.trigger('open', {});
    }, 10);
  }

  addEventListener(event: string, handler: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(handler);
  }

  removeEventListener(event: string, handler: Function) {
    this.eventListeners.get(event)?.delete(handler);
  }

  send(data: string) {
    this.sentMessages.push(data);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.trigger('close', {});
  }

  trigger(event: string, data: any) {
    const handlers = this.eventListeners.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }

  simulateMessage(data: string) {
    this.trigger('message', { data });
  }
}

// Replace global WebSocket
(globalThis as any).WebSocket = MockWebSocket;

describe('Realtime Client', () => {
  let client: RealtimeClient;

  beforeEach(() => {
    client = new RealtimeClient({
      url: 'wss://test.example.com',
      userId: 'test-user',
      userName: 'Test User',
      autoReconnect: false,
      heartbeatInterval: 1000,
    });
  });

  afterEach(() => {
    if (client) {
      client.disconnect();
    }
  });

  describe('Connection', () => {
    it('should connect to WebSocket server', async () => {
      await client.connect();
      expect(client.isConnected).toBe(true);
    });

    it('should include userId in connection URL', async () => {
      await client.connect();

      const ws = (client as any).ws as MockWebSocket;
      expect(ws.url).toContain('userId=test-user');
    });

    it('should disconnect cleanly', async () => {
      await client.connect();
      expect(client.isConnected).toBe(true);

      client.disconnect();
      expect(client.isConnected).toBe(false);
    });
  });

  describe('Event Handling', () => {
    it('should register event handlers', async () => {
      const handler = vi.fn();

      client.on('artifact.created', handler);
      await client.connect();

      // Simulate incoming message
      const ws = (client as any).ws as MockWebSocket;
      ws.simulateMessage(
        JSON.stringify({
          type: 'artifact.created',
          timestamp: Date.now(),
          data: { artifactId: 'test-001' },
        })
      );

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'artifact.created',
          data: { artifactId: 'test-001' },
        })
      );
    });

    it('should unregister event handlers', async () => {
      const handler = vi.fn();

      const unsubscribe = client.on('artifact.created', handler);
      await client.connect();

      unsubscribe();

      // Simulate message after unsubscribe
      const ws = (client as any).ws as MockWebSocket;
      ws.simulateMessage(
        JSON.stringify({
          type: 'artifact.created',
          timestamp: Date.now(),
          data: {},
        })
      );

      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle multiple event types', async () => {
      const createdHandler = vi.fn();
      const updatedHandler = vi.fn();
      const qualityHandler = vi.fn();

      client.on('artifact.created', createdHandler);
      client.on('artifact.updated', updatedHandler);
      client.on('quality.updated', qualityHandler);

      await client.connect();

      const ws = (client as any).ws as MockWebSocket;

      ws.simulateMessage(
        JSON.stringify({ type: 'artifact.created', timestamp: Date.now(), data: {} })
      );
      ws.simulateMessage(
        JSON.stringify({ type: 'artifact.updated', timestamp: Date.now(), data: {} })
      );
      ws.simulateMessage(
        JSON.stringify({ type: 'quality.updated', timestamp: Date.now(), data: {} })
      );

      expect(createdHandler).toHaveBeenCalledTimes(1);
      expect(updatedHandler).toHaveBeenCalledTimes(1);
      expect(qualityHandler).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple handlers for same event', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      client.on('artifact.created', handler1);
      client.on('artifact.created', handler2);
      client.on('artifact.created', handler3);

      await client.connect();

      const ws = (client as any).ws as MockWebSocket;
      ws.simulateMessage(
        JSON.stringify({ type: 'artifact.created', timestamp: Date.now(), data: {} })
      );

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler3).toHaveBeenCalledTimes(1);
    });
  });

  describe('Heartbeat', () => {
    it('should send heartbeat messages', async () => {
      await client.connect();

      const ws = (client as any).ws as MockWebSocket;

      // Wait for heartbeat (interval is 1000ms in test)
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const heartbeats = ws.sentMessages.filter((msg) => {
        const parsed = JSON.parse(msg);
        return parsed.type === 'heartbeat';
      });

      expect(heartbeats.length).toBeGreaterThan(0);
    });

    it('should respond to server heartbeats', async () => {
      const heartbeatHandler = vi.fn();
      client.on('heartbeat', heartbeatHandler);

      await client.connect();

      const ws = (client as any).ws as MockWebSocket;
      ws.simulateMessage(
        JSON.stringify({
          type: 'heartbeat',
          timestamp: Date.now(),
          data: { status: 'ok' },
        })
      );

      expect(heartbeatHandler).toHaveBeenCalled();
    });

    it('should store session ID from welcome message', async () => {
      await client.connect();

      const ws = (client as any).ws as MockWebSocket;
      ws.simulateMessage(
        JSON.stringify({
          type: 'heartbeat',
          timestamp: Date.now(),
          data: {
            sessionId: 'session-123',
            message: 'Connected',
          },
        })
      );

      expect(client.currentSessionId).toBe('session-123');
    });
  });

  describe('Subscriptions', () => {
    it('should subscribe to artifact updates', async () => {
      await client.connect();

      const ws = (client as any).ws as MockWebSocket;
      ws.sentMessages = []; // Clear initial messages

      client.subscribeToArtifact('artifact-001');

      expect(ws.sentMessages.length).toBeGreaterThan(0);

      const presenceMessage = ws.sentMessages.find((msg) => {
        const parsed = JSON.parse(msg);
        return parsed.type === 'presence.joined';
      });

      expect(presenceMessage).toBeDefined();

      const parsed = JSON.parse(presenceMessage!);
      expect(parsed.data.artifactId).toBe('artifact-001');
      expect(parsed.data.userName).toBe('Test User');
    });

    it('should unsubscribe from artifact updates', async () => {
      await client.connect();

      const ws = (client as any).ws as MockWebSocket;

      client.subscribeToArtifact('artifact-001');
      ws.sentMessages = []; // Clear

      client.unsubscribeFromArtifact('artifact-001');

      const leaveMessage = ws.sentMessages.find((msg) => {
        const parsed = JSON.parse(msg);
        return parsed.type === 'presence.left';
      });

      expect(leaveMessage).toBeDefined();

      const parsed = JSON.parse(leaveMessage!);
      expect(parsed.data.artifactId).toBe('artifact-001');
    });

    it('should track multiple subscriptions', async () => {
      await client.connect();

      client.subscribeToArtifact('artifact-001');
      client.subscribeToArtifact('artifact-002');
      client.subscribeToArtifact('artifact-003');

      const subscriptions = (client as any).subscriptions as Set<string>;

      expect(subscriptions.has('artifact-001')).toBe(true);
      expect(subscriptions.has('artifact-002')).toBe(true);
      expect(subscriptions.has('artifact-003')).toBe(true);
      expect(subscriptions.size).toBe(3);
    });
  });

  describe('Message Sending', () => {
    it('should send custom messages', async () => {
      await client.connect();

      const ws = (client as any).ws as MockWebSocket;
      ws.sentMessages = [];

      client.send({
        type: 'artifact.created',
        timestamp: Date.now(),
        data: { test: 'data' },
      });

      expect(ws.sentMessages.length).toBe(1);

      const parsed = JSON.parse(ws.sentMessages[0]);
      expect(parsed.type).toBe('artifact.created');
      expect(parsed.data.test).toBe('data');
    });

    it('should not send when disconnected', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      client.send({
        type: 'heartbeat',
        timestamp: Date.now(),
        data: {},
      });

      expect(consoleSpy).toHaveBeenCalledWith('WebSocket not connected');

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed messages gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await client.connect();

      const ws = (client as any).ws as MockWebSocket;
      ws.simulateMessage('invalid json{');

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle handler errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });

      client.on('artifact.created', errorHandler);

      await client.connect();

      const ws = (client as any).ws as MockWebSocket;
      ws.simulateMessage(
        JSON.stringify({ type: 'artifact.created', timestamp: Date.now(), data: {} })
      );

      expect(errorHandler).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Connection Status', () => {
    it('should report connected status correctly', async () => {
      expect(client.isConnected).toBe(false);

      await client.connect();
      expect(client.isConnected).toBe(true);

      client.disconnect();
      expect(client.isConnected).toBe(false);
    });

    it('should provide current session ID', async () => {
      expect(client.currentSessionId).toBeNull();

      await client.connect();

      const ws = (client as any).ws as MockWebSocket;
      ws.simulateMessage(
        JSON.stringify({
          type: 'heartbeat',
          timestamp: Date.now(),
          data: { sessionId: 'test-session-id' },
        })
      );

      expect(client.currentSessionId).toBe('test-session-id');

      client.disconnect();
      expect(client.currentSessionId).toBeNull();
    });
  });
});
