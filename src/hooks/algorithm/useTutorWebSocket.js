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
  accessToken,
  enableAuto = false,
  autoIntervalMs = 8000
}) {
  const [status, setStatus] = useState('DISCONNECTED');
  const [messages, setMessages] = useState([]);
  const [isPending, setIsPending] = useState(false);

  const isPendingRef = useRef(false);
  const clientRef = useRef(null);
  const subscriptionRef = useRef(null);
  const lastCodeChangeAtRef = useRef(Date.now());
  const pendingAutoRef = useRef(false);
  const lastAutoCodeHashRef = useRef(null);
  const pendingAutoTimeoutRef = useRef(null);

  useEffect(() => {
    isPendingRef.current = isPending;
  }, [isPending]);

  // 코드 바뀌는 시점 기록
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
    setIsPending(false);
  }, []);

  // ✅ WebSocket 연결 생성 / 재생성
  useEffect(() => {
    // 토큰이 아예 없으면 연결 안 함 (익명 차단)
    if (!API_URL || !problemId || !userId || !accessToken) {
      setStatus('DISCONNECTED');
      return undefined;
    }

    console.log('[TutorWS] init', {
      API_URL,
      problemId,
      userId,
      hasToken: !!accessToken,
      tokenPreview: accessToken ? accessToken.slice(0, 15) + '...' : null
    });

    const client = new Client({
      webSocketFactory: () =>
        new SockJS(`${API_URL}/ws/tutor`, null, {
          withCredentials: true,
          transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
          transportOptions: {
            'xhr-streaming': { withCredentials: true },
            'xhr-polling': { withCredentials: true }
          }
        }),
      reconnectDelay: 5000,
      // ✅ 여기서 Authorization 헤더에 Bearer 토큰 세팅
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`
      },
      onConnect: () => {
         console.log('[TutorWS] CONNECTED', {
           problemId,
           userId
         });
        setStatus('CONNECTED');

        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe();
        }

      subscriptionRef.current = client.subscribe('/user/queue/tutor', (frame) => {
        // 🔍 서버가 보낸 원본 메시지 그대로 찍기
        console.log('[TutorWS] RECEIVED RAW', frame.body);

        try {
          const payload = JSON.parse(frame.body);
          const enriched = { ...payload, _receivedAt: new Date().toISOString() };

          const isAuto = typeof payload.triggerType === 'string' && payload.triggerType.toUpperCase() === 'AUTO';
          const isInfo = typeof payload.type === 'string' && payload.type.toUpperCase() === 'INFO';
          const isFinal = !isInfo;

          if (isAuto && isFinal) {
            pendingAutoRef.current = false;
          }

          if (isInfo && isAuto) {
            // 자동 힌트 건너뜀 등의 안내 INFO는 기록하지 않고 로딩도 해제
            setIsPending(false);
          }

          if (!isInfo) {
            setMessages((prev) => [...prev.slice(-19), enriched]);
            if (isFinal) {
              setIsPending(false);
            }
          }
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
        console.log('[TutorWS] closed');
        setStatus('DISCONNECTED');
      }
    });

    setStatus('CONNECTING');
    client.activate();
    clientRef.current = client;

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      disconnect();
    };
    // ✅ accessToken / API_URL까지 의존성에 추가
  }, [problemId, userId, accessToken, disconnect]);

  const sendMessage = useCallback(
    ({ triggerType, message: userMessage, judgeMeta }) => {
      if (status !== 'CONNECTED') return;
      if (!problemId || !userId) return;

      const client = clientRef.current;
      if (!client || !client.connected) return;

      setIsPending(true);

      const payload = {
        problemId,
        userId: String(userId),
        language,
        code,
        triggerType,
        message: userMessage || null,
        judgeResult: judgeMeta?.judgeResult ?? null,
        passedCount: judgeMeta?.passedCount ?? null,
        totalCount: judgeMeta?.totalCount ?? null
      };

      client.publish({
        destination: '/app/tutor.ask',
        body: JSON.stringify(payload)
      });
    },
    [problemId, userId, language, code, status]
  );

  const sendUserQuestion = useCallback(
    (question, judgeMeta) => {
      if (!question) return;
      sendMessage({ triggerType: 'USER', message: question, judgeMeta });
    },
    [sendMessage]
  );

  // AUTO 모드
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
      if (!userId) return;
      if (isPendingRef.current) return; // 튜터 답변 대기 중에는 자동 힌트 대기
      if (pendingAutoRef.current) return;
      if (!code || !code.trim()) return;

      // 코드 바뀐지 얼마 안 됐으면 대기
      if (now - lastCodeChangeAtRef.current < AUTO_DEBOUNCE_MS) {
        return;
      }

      const currentHash = computeHash(code);
      if (
        lastAutoCodeHashRef.current &&
        lastAutoCodeHashRef.current === currentHash
      ) {
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
    sendUserQuestion,
    isPending
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
