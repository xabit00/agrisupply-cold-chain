"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";

export type SocketStatus = "connecting" | "connected" | "disconnected";

interface SocketContextType {
  socket: Socket | null;
  status: SocketStatus;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  status: "disconnected",
  isConnected: false,
});

/**
 * Owns the single Socket.io connection. Same origin by construction: the custom
 * server (server.js) hosts Next and Socket.io on one port, so no URL or CORS
 * configuration is needed.
 *
 * Started once per app lifetime, fully torn down on unmount (listeners removed
 * then disconnected) so a hot-reload never leaks a connection.
 */
export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<SocketStatus>("connecting");

  useEffect(() => {
    const instance = io({
      path: "/socket.io",
      reconnection: true,
      reconnectionAttempts: 12,
      reconnectionDelay: 1000,
      timeout: 5000,
      withCredentials: true,
    });

    setSocket(instance);

    instance.on("connect", () => setStatus("connected"));
    instance.on("connect_error", () => setStatus("disconnected"));
    instance.on("disconnect", () => setStatus("disconnected"));

    return () => {
      instance.removeAllListeners();
      instance.disconnect();
      setSocket(null);
      setStatus("disconnected");
    };
  }, []);

  const value = useMemo<SocketContextType>(
    () => ({ socket, status, isConnected: status === "connected" }),
    [socket, status]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export const useSocketContext = () => useContext(SocketContext);
