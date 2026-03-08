/**
 * WebSocket client for real-time game updates.
 *
 * Connects to the API WebSocket, handles authentication,
 * reconnection with exponential backoff, and event dispatching.
 */

type EventHandler = (data: unknown) => void;

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4100";
const WS_URL = API_URL.replace(/^http/, "ws") + "/ws";

// Reconnection settings
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;
const PING_INTERVAL_MS = 30000;

export class GameWebSocket {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private handlers = new Map<string, Set<EventHandler>>();
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private closed = false;

  /** Connect with the given auth token. */
  connect(token: string) {
    this.token = token;
    this.closed = false;
    this.reconnectAttempts = 0;
    this.doConnect();
  }

  /** Disconnect and stop reconnecting. */
  disconnect() {
    this.closed = true;
    this.clearTimers();
    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }
  }

  /** Register an event handler. Returns unsubscribe function. */
  on(event: string, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    return () => {
      const set = this.handlers.get(event);
      if (set) {
        set.delete(handler);
        if (set.size === 0) this.handlers.delete(event);
      }
    };
  }

  /** Whether the socket is currently connected. */
  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private doConnect() {
    if (this.closed || !this.token) return;

    try {
      this.ws = new WebSocket(`${WS_URL}?token=${this.token}`);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.startPing();
      this.emit("_connected", null);
    };

    this.ws.onmessage = (event) => {
      try {
        const { event: eventName, data } = JSON.parse(event.data as string);
        this.emit(eventName, data);
      } catch {
        // Ignore malformed messages
      }
    };

    this.ws.onclose = (event) => {
      this.clearTimers();
      this.ws = null;
      this.emit("_disconnected", { code: event.code, reason: event.reason });

      // Don't reconnect on intentional close or auth failure
      if (!this.closed && event.code !== 4001 && event.code !== 4002 && event.code !== 4003) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      // onclose will fire after this, which handles reconnection
    };
  }

  private emit(event: string, data: unknown) {
    const handlers = this.handlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data);
        } catch (err) {
          console.error(`[ws] Error in handler for "${event}":`, err);
        }
      }
    }
  }

  private scheduleReconnect() {
    if (this.closed) return;
    this.reconnectAttempts++;
    const delay = Math.min(
      BASE_DELAY_MS * Math.pow(2, this.reconnectAttempts - 1),
      MAX_DELAY_MS
    );
    this.reconnectTimer = setTimeout(() => this.doConnect(), delay);
  }

  private startPing() {
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ event: "ping" }));
      }
    }, PING_INTERVAL_MS);
  }

  private clearTimers() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }
}

/** Singleton instance */
export const gameWs = new GameWebSocket();
