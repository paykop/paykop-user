import { session } from "@/lib/auth/session";

export interface WsEnvelope {
  id: string;
  version: string;
  type: string;
  timestamp: string;
  payload: unknown;
}

export type WsMessageHandler = (msg: WsEnvelope) => void;

class ChatWebSocketClient {
  private socket: WebSocket | null = null;
  private handlers: Set<WsMessageHandler> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;

  connect() {
    if (typeof window === "undefined") return;

    const token = session.getAccessToken();
    if (!token) {
      this.disconnect();
      return;
    }

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/api/v1/communication/ws/v2";

    try {
      this.socket = new WebSocket(wsUrl, ["paykop-protocol", token]);

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      };

      this.socket.onmessage = (event) => {
        try {
          const envelope: WsEnvelope = JSON.parse(event.data);
          this.handlers.forEach((handler) => handler(envelope));
        } catch {
          // ignore malformed frames
        }
      };

      this.socket.onclose = () => {
        this.scheduleReconnect();
      };

      this.socket.onerror = () => {
        this.socket?.close();
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (!session.getAccessToken()) return;
    if (this.reconnectAttempts >= 8) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectAttempts += 1;
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 3000);
  }

  subscribe(handler: WsMessageHandler) {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  send(type: string, payload: unknown) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    const envelope: WsEnvelope = {
      id: crypto.randomUUID(),
      version: "2.0",
      type,
      timestamp: new Date().toISOString(),
      payload,
    };

    this.socket.send(JSON.stringify(envelope));
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectAttempts = 0;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export const chatWs = new ChatWebSocketClient();
