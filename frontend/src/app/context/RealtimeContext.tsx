import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { getSession, getToken } from "../../api/auth";
import { BASE_URL } from "../../api/client";

const RealtimeContext = createContext<Socket | null>(null);

const SESSION_CHECK_MS = 2000;

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const tick = () => {
      const session = getSession();
      if (!session) {
        if (socketRef.current) {
          socketRef.current.removeAllListeners();
          socketRef.current.disconnect();
          socketRef.current = null;
          setSocket(null);
        }
        return;
      }
      if (socketRef.current?.connected) return;
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      const token = getToken();
      const s = io(BASE_URL, { transports: ["websocket", "polling"], auth: { token } });
      socketRef.current = s;
      setSocket(s);
      s.on("disconnect", () => {
        socketRef.current = null;
        setSocket(null);
      });
      s.on("connect_error", () => {
        socketRef.current = null;
        setSocket(null);
      });
    };
    tick();
    const t = setInterval(tick, SESSION_CHECK_MS);
    return () => {
      clearInterval(t);
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
    };
  }, []);

  return (
    <RealtimeContext.Provider value={socket}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtimeSocket(): Socket | null {
  return useContext(RealtimeContext);
}

/** Subscribe to a realtime event; callback is called when event is received. Unsubscribes on unmount. */
export function useRealtimeEvent(
  eventName: "queue-update" | "booking-update" | "checkin-update" | "notification" | "doctor-update",
  callback: (payload: unknown) => void
) {
  const socket = useRealtimeSocket();
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (!socket) return;
    const handler = (payload: unknown) => cbRef.current(payload);
    socket.on(eventName, handler);
    return () => {
      socket.off(eventName, handler);
    };
  }, [socket, eventName]);
}
