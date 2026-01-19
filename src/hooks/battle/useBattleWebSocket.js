import { useCallback, useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const API_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, "")
  : "";

export function useBattleWebSocket({
  accessToken,
  roomId,
  onRoomList,
  onRoomState,
  onCountdown,
  onStart,
  onSubmitResult,
  onFinish,
  onError,
}) {
  const [status, setStatus] = useState("DISCONNECTED");
  const clientRef = useRef(null);
  const baseSubsRef = useRef([]);
  const roomSubRef = useRef(null);
  const tokenRef = useRef(accessToken);
  const roomIdRef = useRef(roomId);
  const handlerRef = useRef({
    onRoomList,
    onRoomState,
    onCountdown,
    onStart,
    onSubmitResult,
    onFinish,
    onError,
  });

  useEffect(() => {
    handlerRef.current = {
      onRoomList,
      onRoomState,
      onCountdown,
      onStart,
      onSubmitResult,
      onFinish,
      onError,
    };
  }, [onRoomList, onRoomState, onCountdown, onStart, onSubmitResult, onFinish, onError]);

  const unsubscribeAll = useCallback(() => {
    baseSubsRef.current.forEach((sub) => sub?.unsubscribe?.());
    baseSubsRef.current = [];
    if (roomSubRef.current) {
      roomSubRef.current.unsubscribe?.();
      roomSubRef.current = null;
    }
  }, []);

  const deactivateClient = useCallback(() => {
    unsubscribeAll();
    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }
    setStatus("DISCONNECTED");
  }, [unsubscribeAll]);

  const subscribeBase = useCallback(() => {
    if (!clientRef.current?.connected) return;
    baseSubsRef.current.forEach((sub) => sub?.unsubscribe?.());
    baseSubsRef.current = [];
    const subs = [];
    subs.push(
      clientRef.current.subscribe("/topic/battle/rooms", (frame) => {
        safeHandleMessage(frame, handlerRef.current);
      })
    );
    subs.push(
      clientRef.current.subscribe("/user/queue/battle", (frame) => {
        safeHandleMessage(frame, handlerRef.current);
      })
    );
    baseSubsRef.current = subs;
  }, []);

  const subscribeRoom = useCallback((rid) => {
    roomIdRef.current = rid;
    if (!clientRef.current?.connected) return;
    if (roomSubRef.current) {
      roomSubRef.current.unsubscribe?.();
      roomSubRef.current = null;
    }
    if (rid) {
      roomSubRef.current = clientRef.current.subscribe(`/topic/battle/room/${rid}`, (frame) => {
        safeHandleMessage(frame, handlerRef.current);
      });
    }
  }, []);

  useEffect(() => {
    if (!API_URL) return undefined;
    if (!accessToken) {
      deactivateClient();
      tokenRef.current = null;
      return undefined;
    }

    if (clientRef.current && tokenRef.current === accessToken) {
      return undefined;
    }

    deactivateClient();
    tokenRef.current = accessToken;

    const client = new Client({
      webSocketFactory: () =>
        new SockJS(`${API_URL}/ws/battle`, null, {
          withCredentials: true,
          transports: ["websocket", "xhr-streaming", "xhr-polling"],
        }),
      reconnectDelay: 4000,
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
      onConnect: () => {
        setStatus("CONNECTED");
        subscribeBase();
        subscribeRoom(roomIdRef.current);
      },
      onStompError: () => setStatus("ERROR"),
      onWebSocketClose: () => setStatus("DISCONNECTED"),
      onWebSocketError: () => setStatus("ERROR"),
      debug: () => {},
    });

    setStatus("CONNECTING");
    clientRef.current = client;
    client.activate();

    return () => {
      deactivateClient();
    };
  }, [accessToken, deactivateClient, subscribeBase, subscribeRoom]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== "auth") return;
      if (event.newValue) return;
      tokenRef.current = null;
      deactivateClient();
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [deactivateClient]);

  useEffect(() => {
    if (roomIdRef.current !== roomId) {
      subscribeRoom(roomId);
    }
  }, [roomId, subscribeRoom]);

  const sendReady = useCallback((targetRoomId, ready = true) => {
    if (!clientRef.current?.connected) return;
    clientRef.current.publish({
      destination: "/app/battle/ready",
      body: JSON.stringify({ roomId: targetRoomId, ready }),
    });
  }, []);

  const sendSubmit = useCallback((payload) => {
    if (!clientRef.current?.connected) return;
    clientRef.current.publish({
      destination: "/app/battle/submit",
      body: JSON.stringify(payload),
    });
  }, []);

  return { status, sendReady, sendSubmit };
}

function safeHandleMessage(frame, handlers) {
  try {
    const message = JSON.parse(frame.body);
    switch (message.type) {
      case "ROOM_LIST":
        handlers.onRoomList?.(message.payload?.rooms || message.payload || []);
        break;
      case "ROOM_STATE":
        handlers.onRoomState?.(message.payload);
        break;
      case "COUNTDOWN":
        handlers.onCountdown?.({
          roomId: message.roomId,
          seconds: Number(message.payload),
        });
        break;
      case "START":
        handlers.onStart?.(message.payload);
        break;
      case "SUBMIT_RESULT":
        handlers.onSubmitResult?.(message.payload);
        break;
      case "FINISH":
        handlers.onFinish?.(message.payload);
        break;
      case "ERROR":
        handlers.onError?.(message.payload);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error("[battle-ws] 메시지 처리 실패", err);
  }
}
