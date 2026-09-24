import { useEffect } from "react";

export type MasterDataType = 
  | "shift" 
  | "operation" 
  | "line" 
  | "operator" 
  | "machine"
  | "bulletin" 
  | "order" 
  | "style" 
  | "size"
  | "attendance" 
  | "production" 
  | "all";

const EVENT_NAME = "app:master-data-updated";
const CHANNEL_NAME = "line-balancing-master-sync";

// Broadcast Channel for cross-tab synchronization
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch (e) {
  console.warn("BroadcastChannel not supported in this environment");
}

/**
 * Trigger an app-wide notification that a master entity or transactional configuration has changed.
 * This notifies all open tabs, active pages, and listeners to immediately re-fetch updated data.
 */
export function notifyMasterDataUpdated(type: MasterDataType = "all", payload?: any) {
  if (typeof window === "undefined") return;

  const eventDetail = { type, payload, timestamp: Date.now() };

  // 1. Dispatch DOM CustomEvent for same-tab active components
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: eventDetail }));

  // 2. Post message to BroadcastChannel for cross-tab synchronization
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(eventDetail);
    } catch (e) {
      console.warn("Failed to broadcast master data update:", e);
    }
  }
}

/**
 * Hook to subscribe a component to master data updates and window focus events.
 * @param types List of master data types to react to (or ['all'] to react to everything).
 * @param onRefresh Callback function to reload component data.
 */
export function useMasterDataSubscription(
  types: MasterDataType[] = ["all"],
  onRefresh: () => void | Promise<void>
) {
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ type: MasterDataType; payload?: any }>;
      const eventType = customEvent.detail?.type || "all";
      if (types.includes("all") || types.includes(eventType) || eventType === "all") {
        onRefresh();
      }
    };

    // Listen on DOM event
    window.addEventListener(EVENT_NAME, handleUpdate);

    // Listen on BroadcastChannel for multi-tab updates
    const handleBroadcast = (event: MessageEvent) => {
      const data = event.data;
      if (data && (types.includes("all") || types.includes(data.type) || data.type === "all")) {
        onRefresh();
      }
    };

    if (broadcastChannel) {
      broadcastChannel.addEventListener("message", handleBroadcast);
    }

    // Auto-refresh when tab/window regains focus
    const handleWindowFocus = () => {
      onRefresh();
    };
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      if (broadcastChannel) {
        broadcastChannel.removeEventListener("message", handleBroadcast);
      }
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [types, onRefresh]);
}
