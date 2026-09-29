"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";

export type SocketStatus = "connecting" | "connected" | "reconnecting" | "disconnected";

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

    const handleConnect = () => setStatus("connected");
    const handleConnectError = (error: Error) => {
      console.error("[socket] connect_error:", error.message, error);
      setStatus(instance.active ? "reconnecting" : "disconnected");
    };
    const handleDisconnect = () => {
      setStatus(instance.active ? "reconnecting" : "disconnected");
    };
    const handleReconnectAttempt = () => setStatus("reconnecting");
    const handleReconnectFailed = () => setStatus("disconnected");

    instance.on("connect", handleConnect);
    instance.on("connect_error", handleConnectError);
    instance.on("disconnect", handleDisconnect);
    instance.io.on("reconnect_attempt", handleReconnectAttempt);
    instance.io.on("reconnect_failed", handleReconnectFailed);

    return () => {
      instance.off("connect", handleConnect);
      instance.off("connect_error", handleConnectError);
      instance.off("disconnect", handleDisconnect);
      instance.io.off("reconnect_attempt", handleReconnectAttempt);
      instance.io.off("reconnect_failed", handleReconnectFailed);
      instance.disconnect();
    };
  }, []);

  const value = useMemo<SocketContextType>(
    () => ({ socket, status, isConnected: Boolean(socket?.connected) }),
    [socket, status]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export const useSocketContext = () => useContext(SocketContext);
