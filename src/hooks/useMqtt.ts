/**
 * React Hook for AetherSense MQTT WebSocket client
 * Strictly adheres to PRD Sections 13, 18, and 21
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  AetherMqttClient,
  type MqttConnectionState,
  defaultAetherClient,
} from '../mqtt/client';

export interface MqttMessage {
  topic: string;
  payload: string;
  receivedAt: number;
}

export interface UseMqttOptions {
  client?: AetherMqttClient;
  autoConnect?: boolean;
  topics?: string[];
}

export interface UseMqttReturn {
  connectionState: MqttConnectionState;
  stateDetail: string | undefined;
  clientId: string;
  lastMessage: MqttMessage | null;
  messageCount: number;
  connect: () => void;
  disconnect: () => void;
  subscribe: (topics: string | string[]) => void;
  unsubscribe: (topics: string | string[]) => void;
  publish: (topic: string, payload: string, qos?: 0 | 1 | 2) => void;
  retryNow: () => void;
  getBackoffDelay: () => number;
  client: AetherMqttClient;
}

export function useMqtt(options: UseMqttOptions = {}): UseMqttReturn {
  const client = options.client || defaultAetherClient;
  const autoConnect = options.autoConnect ?? true;
  const topicsRef = useRef<string[] | undefined>(options.topics);

  const [connectionState, setConnectionState] = useState<MqttConnectionState>(
    client.getState()
  );
  const [stateDetail, setStateDetail] = useState<string | undefined>(undefined);
  const [lastMessage, setLastMessage] = useState<MqttMessage | null>(null);
  const [messageCount, setMessageCount] = useState<number>(0);

  useEffect(() => {
    topicsRef.current = options.topics;
    if (client.getState() === 'CONNECTED' && options.topics && options.topics.length > 0) {
      client.subscribe(options.topics);
    }
  }, [client, options.topics]);

  useEffect(() => {
    const unsubState = client.onStateChange((state, detail) => {
      setConnectionState(state);
      setStateDetail(detail);

      if (state === 'CONNECTED' && topicsRef.current && topicsRef.current.length > 0) {
        client.subscribe(topicsRef.current);
      }
    });

    const unsubMsg = client.onMessage((topic, payload) => {
      setLastMessage({
        topic,
        payload,
        receivedAt: Date.now(),
      });
      setMessageCount((prev) => prev + 1);
    });

    if (autoConnect && client.getState() === 'DISCONNECTED') {
      client.connect();
    }

    return () => {
      unsubState();
      unsubMsg();
    };
  }, [client, autoConnect]);

  const connect = useCallback(() => {
    client.connect();
  }, [client]);

  const disconnect = useCallback(() => {
    client.disconnect();
  }, [client]);

  const subscribe = useCallback(
    (topics: string | string[]) => {
      client.subscribe(topics);
    },
    [client]
  );

  const unsubscribe = useCallback(
    (topics: string | string[]) => {
      client.unsubscribe(topics);
    },
    [client]
  );

  const publish = useCallback(
    (topic: string, payload: string, qos: 0 | 1 | 2 = 0) => {
      client.publish(topic, payload, qos);
    },
    [client]
  );

  const retryNow = useCallback(() => {
    client.retryNow();
  }, [client]);

  const getBackoffDelay = useCallback(() => {
    return client.getBackoffDelay();
  }, [client]);

  return {
    connectionState,
    stateDetail,
    clientId: client.getClientId(),
    lastMessage,
    messageCount,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    publish,
    retryNow,
    getBackoffDelay,
    client,
  };
}
