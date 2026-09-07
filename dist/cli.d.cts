#!/usr/bin/env node
type AuditSeverity = "error" | "warn" | "info" | "suggestion";
interface AuditIssue {
    ruleId: string;
    severity: AuditSeverity;
    file: string;
    line: number;
    column: number;
    message: string;
    codeSnippet?: string;
    replacement: string;
    docUrl?: string;
}
interface AuditReport {
    targetDir: string;
    scannedFiles: number;
    issues: AuditIssue[];
    summary: {
        errorCount: number;
        warnCount: number;
        infoCount: number;
        suggestionCount: number;
    };
    passed: boolean;
}
interface AuditOptions {
    cwd?: string;
    strict?: boolean;
    format?: "pretty" | "json";
    ignore?: string[];
    rules?: string[];
}
interface AuditRule {
    id: string;
    severity: AuditSeverity;
    description: string;
    replacement: string;
    docUrl?: string;
}

declare const AUDIT_RULES: Record<string, AuditRule>;

declare function auditProject(targetDir: string, options?: AuditOptions): AuditReport;
/**
 * Alias for auditProject.
 */
declare const doctorProject: typeof auditProject;

declare function formatReportPretty(report: AuditReport): string;
declare function formatReportJson(report: AuditReport): string;

declare function runCli(argv?: string[]): number;

export { AUDIT_RULES, type AuditIssue, type AuditOptions, type AuditReport, type AuditRule, type AuditSeverity, auditProject, doctorProject, formatReportJson, formatReportPretty, runCli };
