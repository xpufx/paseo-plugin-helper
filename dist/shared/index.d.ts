export { C as CustomPillDefinition, c as CustomPillDefinitionSchema, d as CustomPillModal, e as CustomPillModalSchema, b as CustomPillState, f as CustomPillThresholds, g as CustomPillThresholdsSchema, D as DefineSettingsContractOptions, P as PlatformType, R as ResponsiveLayout, a as SettingsContract, h as SettingsEmptyInput, i as SettingsEmptyInputSchema, S as StatusVariant, T as ThemeColors, j as defineSettingsContract, k as formatPillDisplay, p as parseNumericPillValue, r as resolveCustomPillStatus } from '../custom-pills-DZR2aH2P.js';
export { D as DefineRpcOptions, P as PluginRpcContract, R as RpcInput, a as RpcOutput, d as defineContract, b as defineRpc } from '../rpc-Ja20I4uK.js';
export { F as FormatBytesOptions, M as MetricThresholds, f as formatBytes, a as formatDuration, b as formatNumber, c as formatUptime, r as resolveMetricStatus, s as stripAnsi, t as truncate } from '../formatters-BZLJihzD.js';
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
