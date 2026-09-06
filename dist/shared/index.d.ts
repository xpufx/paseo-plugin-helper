export { F as FormatBytesOptions, M as MetricThresholds, P as PlatformType, R as ResponsiveLayout, S as StatusVariant, T as ThemeColors, f as formatBytes, a as formatDuration, b as formatNumber, c as formatUptime, r as resolveMetricStatus, s as stripAnsi, t as truncate } from '../formatters-C_Xs512l.js';
export { D as DefineRpcOptions, P as PluginRpcContract, R as RpcInput, a as RpcOutput, d as defineContract, b as defineRpc } from '../rpc-Ja20I4uK.js';
export { D as DefineSettingsContractOptions, S as SettingsContract, a as SettingsEmptyInput, b as SettingsEmptyInputSchema, d as defineSettingsContract } from '../settings-WqIc-fNZ.js';
export { PluginHostProps, PluginTheme } from '@getpaseo/plugin';
import 'zod';

declare class TimeoutError extends Error {
    readonly timeoutMs: number;
    constructor(message: string, timeoutMs: number);
}
/**
 * Races a promise against a timeout duration in milliseconds.
 * If the timeout expires before the promise resolves, rejects with a TimeoutError.
 * Automatically cleans up the timer on resolution or rejection.
 */
declare function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label?: string): Promise<T>;

export { TimeoutError, withTimeout };
