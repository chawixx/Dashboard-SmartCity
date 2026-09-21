/**
 * AetherSense MQTT WebSocket Client Manager
 * Strictly adheres to PRD Sections 3, 6, 13, 21, 22, and ARCHITECTURE.md Section 3
 */

import mqtt, { type MqttClient } from 'mqtt';
import { mqttConfig } from './config';

export type MqttConnectionState =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'RECONNECTING'
  | 'ERROR';

export type StateChangeHandler = (state: MqttConnectionState, detail?: string) => void;
export type MessageHandler = (topic: string, payload: string) => void;

export class AetherMqttClient {
  private client: MqttClient | null = null;
  private state: MqttConnectionState = 'DISCONNECTED';
  private subscriptions: Set<string> = new Set();
  private stateChangeListeners: Set<StateChangeHandler> = new Set();
  private messageListeners: Set<MessageHandler> = new Set();

  private reconnectAttempt: number = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isIntentionallyClosed: boolean = false;

  private config: typeof mqttConfig;

  constructor(config = mqttConfig) {
    this.config = config;

    // Attach browser online/offline listeners for immediate network drop/recovery handling (PRD Section 22)
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        if (!this.isIntentionallyClosed && this.state !== 'CONNECTED') {
          console.log('[MQTT] Network connection restored -> reconnecting');
          this.retryNow();
        }
      });
      window.addEventListener('offline', () => {
        if (!this.isIntentionallyClosed) {
          console.warn('[MQTT] Network connection lost');
          this.updateState('RECONNECTING', 'Network offline');
        }
      });
    }
  }

  /**
   * Returns the current connection state.
   */
  public getState(): MqttConnectionState {
    return this.state;
  }

  /**
   * Returns the active Client ID.
   */
  public getClientId(): string {
    return this.config.clientId;
  }

  /**
   * Register a listener for connection state changes.
   */
  public onStateChange(listener: StateChangeHandler): () => void {
    this.stateChangeListeners.add(listener);
    listener(this.state);
    return () => this.stateChangeListeners.delete(listener);
  }

  /**
   * Register a listener for incoming raw MQTT messages.
   */
  public onMessage(listener: MessageHandler): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  /**
   * Initiates connection to HiveMQ Public MQTT broker over WebSockets.
   */
  public connect(): void {
    if (this.state === 'CONNECTING' || this.state === 'CONNECTED') {
      return;
    }

    this.isIntentionallyClosed = false;
    this.clearReconnectTimer();
    this.updateState('CONNECTING');

    try {
      this.client = mqtt.connect(this.config.brokerUrl, {
        clientId: this.config.clientId,
        clean: true,
        keepalive: this.config.keepalive,
        connectTimeout: this.config.connectTimeout,
        reconnectPeriod: 0, // We control exponential backoff explicitly (PRD Section 21)
      });

      this.client.on('connect', () => {
        this.reconnectAttempt = 0;
        this.clearReconnectTimer();
        this.updateState('CONNECTED');

        // Resubscribe to existing topics upon reconnection
        if (this.subscriptions.size > 0 && this.client) {
          const topicsArray = Array.from(this.subscriptions);
          this.client.subscribe(topicsArray, { qos: 0 }, (err) => {
            if (err) {
              console.warn('[MQTT] Resubscription warning:', err);
            }
          });
        }
      });

      this.client.on('message', (topic: string, message: Uint8Array) => {
        const payloadString = new TextDecoder('utf-8').decode(message);
        this.messageListeners.forEach((listener) => {
          try {
            listener(topic, payloadString);
          } catch (error) {
            console.error('[MQTT] Error in message listener callback:', error);
          }
        });
      });

      this.client.on('close', () => {
        if (!this.isIntentionallyClosed) {
          this.scheduleReconnect();
        } else {
          this.updateState('DISCONNECTED');
        }
      });

      this.client.on('error', (err: Error) => {
        console.error('[MQTT] Connection error:', err);
        this.updateState('ERROR', err.message);
        if (!this.isIntentionallyClosed) {
          this.scheduleReconnect();
        }
      });

      this.client.on('offline', () => {
        if (!this.isIntentionallyClosed) {
          this.scheduleReconnect();
        }
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[MQTT] Failed to initialize client:', errorMsg);
      this.updateState('ERROR', errorMsg);
      this.scheduleReconnect();
    }
  }

  /**
   * Closes the MQTT connection intentionally.
   */
  public disconnect(): void {
    this.isIntentionallyClosed = true;
    this.clearReconnectTimer();
    this.reconnectAttempt = 0;

    if (this.client) {
      try {
        this.client.end(true);
      } catch (err) {
        console.warn('[MQTT] Error closing client:', err);
      }
      this.client = null;
    }

    this.updateState('DISCONNECTED');
  }

  /**
   * Immediately resets exponential backoff timer and attempts connection.
   */
  public retryNow(): void {
    this.clearReconnectTimer();
    if (this.client) {
      try {
        this.client.end(true);
      } catch {
        // ignore
      }
      this.client = null;
    }
    this.connect();
  }

  /**
   * Subscribe to one or multiple topics.
   */
  public subscribe(topics: string | string[]): void {
    const list = Array.isArray(topics) ? topics : [topics];
    list.forEach((t) => this.subscriptions.add(t));

    if (this.client && this.state === 'CONNECTED') {
      this.client.subscribe(list, { qos: 0 }, (err) => {
        if (err) {
          console.error('[MQTT] Subscribe error for topics:', list, err);
        }
      });
    }
  }

  /**
   * Unsubscribe from one or multiple topics.
   */
  public unsubscribe(topics: string | string[]): void {
    const list = Array.isArray(topics) ? topics : [topics];
    list.forEach((t) => this.subscriptions.delete(t));

    if (this.client && this.state === 'CONNECTED') {
      this.client.unsubscribe(list, (err) => {
        if (err) {
          console.error('[MQTT] Unsubscribe error for topics:', list, err);
        }
      });
    }
  }

  /**
   * Publish a message to a topic (useful for dev simulation / diagnostics).
   */
  public publish(topic: string, payload: string, qos: 0 | 1 | 2 = 0): void {
    if (this.client && this.state === 'CONNECTED') {
      this.client.publish(topic, payload, { qos }, (err) => {
        if (err) {
          console.error('[MQTT] Publish error:', topic, err);
        }
      });
    }
  }

  /**
   * Calculates exponential backoff delay (PRD Section 21):
   * 1s, 2s, 4s, 8s, 16s, up to max 30s.
   */
  public getBackoffDelay(): number {
    const delay = this.config.reconnectBaseDelay * Math.pow(2, this.reconnectAttempt);
    return Math.min(delay, this.config.reconnectMaxDelay);
  }

  private scheduleReconnect(): void {
    if (this.isIntentionallyClosed || this.reconnectTimer) {
      return;
    }

    const delay = this.getBackoffDelay();
    this.reconnectAttempt++;
    this.updateState('RECONNECTING', `Attempt ${this.reconnectAttempt} (retry in ${Math.round(delay / 1000)}s)`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isIntentionallyClosed) {
        if (this.client) {
          try {
            this.client.end(true);
          } catch {
            // ignore
          }
          this.client = null;
        }
        this.connect();
      }
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private updateState(newState: MqttConnectionState, detail?: string): void {
    this.state = newState;
    this.stateChangeListeners.forEach((listener) => {
      try {
        listener(newState, detail);
      } catch (err) {
        console.error('[MQTT] Error in state listener callback:', err);
      }
    });
  }
}

// Global singleton instance for dashboard lifetime
export const defaultAetherClient = new AetherMqttClient();
