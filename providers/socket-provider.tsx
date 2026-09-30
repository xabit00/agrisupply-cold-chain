"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";

export type SocketStatus = "connecting" | "connected" | "reconnecting" | "disconnected";

/**
 * socket.io stops retrying once `reconnectionAttempts` is exhausted. After that
 * we keep probing on this slower cadence (and immediately when the browser comes
 * back online or the tab is focused) so a stream that dropped during a server
 * restart recovers on its own instead of staying "disconnected" until a reload.
 */
const RECOVERY_RETRY_MS = 20000;

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

    let recoveryTimer: ReturnType<typeof setTimeout> | null = null;

    const clearRecovery = () => {
      if (recoveryTimer) {
        clearTimeout(recoveryTimer);
        recoveryTimer = null;
      }
    };

    const retryConnection = () => {
      if (instance.connected) return;
      setStatus("reconnecting");
      instance.connect();
    };

    const scheduleRecovery = () => {
      if (recoveryTimer) return;
      recoveryTimer = setTimeout(() => {
        recoveryTimer = null;
        retryConnection();
      }, RECOVERY_RETRY_MS);
    };

    const handleConnect = () => {
      clearRecovery();
      setStatus("connected");
    };
    const handleConnectError = (error: Error) => {
      console.error("[socket] connect_error:", error.message, error);
      setStatus(instance.active ? "reconnecting" : "disconnected");
    };
    const handleDisconnect = () => {
      setStatus(instance.active ? "reconnecting" : "disconnected");
    };
    const handleReconnectAttempt = () => setStatus("reconnecting");
    // Retry budget exhausted: keep the UI honest ("disconnected") but armed, so
    // the stream recovers without a manual page reload.
    const handleReconnectFailed = () => {
      setStatus("disconnected");
      scheduleRecovery();
    };
    const handleOnline = () => {
      clearRecovery();
      retryConnection();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") handleOnline();
    };

    instance.on("connect", handleConnect);
    instance.on("connect_error", handleConnectError);
    instance.on("disconnect", handleDisconnect);
    instance.io.on("reconnect_attempt", handleReconnectAttempt);
    instance.io.on("reconnect_failed", handleReconnectFailed);
    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      instance.off("connect", handleConnect);
      instance.off("connect_error", handleConnectError);
      instance.off("disconnect", handleDisconnect);
      instance.io.off("reconnect_attempt", handleReconnectAttempt);
      instance.io.off("reconnect_failed", handleReconnectFailed);
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearRecovery();
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
