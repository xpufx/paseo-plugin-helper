import { useState, useMemo } from "react";
import type { PluginRpcContract } from "@getpaseo/plugin";
import { useRpcQuery, type RpcQueryOptions } from "./query.js";
import type { RpcInput, RpcOutput } from "../shared/rpc.js";

export type RefreshRate = "1s" | "2s" | "5s" | "10s" | "paused";

export const REFRESH_INTERVALS: Record<RefreshRate, number | false> = {
  "1s": 1000,
  "2s": 2000,
  "5s": 5000,
  "10s": 10000,
  paused: false,
};

export interface UseAutoRefreshQueryOptions<TOutput> extends RpcQueryOptions<TOutput> {
  defaultRate?: RefreshRate;
  /**
   * Whether the containing modal or panel is actively open/visible.
   * If false, background refetching is automatically paused to conserve mobile CPU and battery.
   */
  isOpen?: boolean;
}

/**
 * Enhanced React Query hook for live polling metrics.
 * Automatically halts background polling when modal/panel is closed (`isOpen === false`),
 * and provides state controls for user-selectable refresh intervals ("1s", "2s", "5s", "paused").
 */
export function useAutoRefreshQuery<
  TContract extends PluginRpcContract<any, any>,
  TInput = RpcInput<TContract>,
  TOutput = RpcOutput<TContract>,
>(
  contract: TContract,
  input: TInput,
  options?: UseAutoRefreshQueryOptions<TOutput>,
) {
  const { defaultRate = "2s", isOpen = true, ...queryOptions } = options ?? {};
  const [rate, setRate] = useState<RefreshRate>(defaultRate);

  const effectiveInterval = useMemo<number | false>(() => {
    if (!isOpen) return false;
    return REFRESH_INTERVALS[rate] ?? false;
  }, [isOpen, rate]);

  const query = useRpcQuery(contract, input, {
    ...queryOptions,
    refetchInterval: effectiveInterval,
  });

  return {
    ...query,
    rate,
    setRate,
    isPolling: effectiveInterval !== false,
    effectiveInterval,
  };
}
