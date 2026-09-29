"use client";

import { useSocketContext } from "@/providers/socket-provider";

export function useSocket() {
  const { socket, status, isConnected } = useSocketContext();
  return { socket, status, isConnected };
}
