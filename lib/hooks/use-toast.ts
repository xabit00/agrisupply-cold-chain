"use client";

import { toast as toastApi, useToastStore } from "@/stores/toast.store";

/**
 * Reactive toast access for components: exposes the live toast list plus the
 * imperative success/error/info helpers.
 */
export function useToast() {
  const toasts = useToastStore((state) => state.toasts);

  return {
    toasts,
    ...toastApi,
  };
}
