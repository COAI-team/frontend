import { useEffect, useRef, useState, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const API_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
  : '';

export function useTutorWebSocket({
  problemId,
  userId,
  language,
  code,
  enableAuto = false,
  autoIntervalMs = 8000
}) {
  const [status, setStatus] = useState('DISCONNECTED');
  const [messages, setMessages] = useState([]);

  const clientRef = useRef(null);
  const lastCodeChangeAtRef = useRef(Date.now());
  const pendingAutoRef = useRef(false);
  const lastAutoCodeHashRef = useRef(null);
  const pendingAutoTimeoutRef = useRef(null);

  useEffect(() => {
    lastCodeChangeAtRef.current = Date.now();
  }, [code]);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }
    if (pendingAutoTimeoutRef.current) {
      clearTimeout(pendingAutoTimeoutRef.current);
      pendingAutoTimeoutRef.current = null;
    }
    setStatus('DISCONNECTED');
    pendingAutoRef.current = false;
    lastAutoCodeHashRef.current = null;
  }, []);

  useEffect(() => {
    if (!API_URL || !problemId || !userId) {
      setStatus('DISCONNECTED');
      return undefined;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_URL}/ws/tutor`),
      reconnectDelay: 5000,
      onConnect: () => {
        setStatus('CONNECTED');

        client.subscribe(`/topic/tutor.${problemId}`, (frame) => {
          try {
            const payload = JSON.parse(frame.body);
            const enriched = { ...payload, _receivedAt: new Date().toISOString() };
            if (typeof payload.triggerType === 'string' && payload.triggerType.toUpperCase() === 'AUTO') {
              pendingAutoRef.current = false;
            }
            setMessages((prev) => [...prev.slice(-19), enriched]);
          } catch (err) {
            console.error('[TutorWS] Failed to parse message', err);
          }
        });
      },
      onStompError: (frame) => {
        console.error('[TutorWS] STOMP error', frame?.headers, frame?.body);
        setStatus('ERROR');
      },
      onWebSocketError: (event) => {
        console.error('[TutorWS] WebSocket error', event);
        setStatus('ERROR');
      },
      onWebSocketClose: () => {
        setStatus('DISCONNECTED');
      }
    });

    setStatus('CONNECTING');
    client.activate();
    clientRef.current = client;

      return () => {
        disconnect();
      };
  }, [problemId, userId, disconnect]);

  const sendMessage = useCallback(
    ({ triggerType, message: userMessage }) => {
      if (!problemId || !userId) {
        return;
      }

      const client = clientRef.current;
      if (!client || !client.connected) {
        return;
      }

      const payload = {
        problemId,
        userId: String(userId),
        language,
        code,
        triggerType,
        message: userMessage || null
      };

      client.publish({
        destination: '/app/tutor.send',
        body: JSON.stringify(payload)
      });
    },
    [problemId, userId, language, code]
  );

  const sendUserQuestion = useCallback(
    (question) => {
      if (!question) return;
      sendMessage({ triggerType: 'USER', message: question }); // QUESTION -> USER
    },
    [sendMessage]
  );


  useEffect(() => {
    const AUTO_DEBOUNCE_MS = 3000;

    if (!enableAuto || status !== 'CONNECTED') {
      pendingAutoRef.current = false;
      if (pendingAutoTimeoutRef.current) {
        clearTimeout(pendingAutoTimeoutRef.current);
        pendingAutoTimeoutRef.current = null;
      }
      return undefined;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      if (!userId) {
        return;
      }
      if (pendingAutoRef.current) {
        return;
      }
      if (!code || !code.trim()) {
        return;
      }
      if (now - lastCodeChangeAtRef.current < AUTO_DEBOUNCE_MS) {
        return;
      }

      const currentHash = computeHash(code);
      if (lastAutoCodeHashRef.current && lastAutoCodeHashRef.current === currentHash) {
        return;
      }

      pendingAutoRef.current = true;
      lastAutoCodeHashRef.current = currentHash;
      sendMessage({ triggerType: 'AUTO' });
      if (pendingAutoTimeoutRef.current) {
        clearTimeout(pendingAutoTimeoutRef.current);
      }
      pendingAutoTimeoutRef.current = setTimeout(() => {
        pendingAutoRef.current = false;
      }, autoIntervalMs);
    }, autoIntervalMs);

    return () => {
      clearInterval(interval);
      if (pendingAutoTimeoutRef.current) {
        clearTimeout(pendingAutoTimeoutRef.current);
        pendingAutoTimeoutRef.current = null;
      }
    };
  }, [enableAuto, status, autoIntervalMs, code, sendMessage, userId]);

  return {
    status,
    messages,
    sendUserQuestion
  };
}

function computeHash(value) {
  if (!value) {
    return '';
  }
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}
