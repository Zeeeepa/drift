/**
 * Enforcement types — aligned to crates/drift/drift-napi/src/bindings/enforcement.rs
 * and crates/drift/drift-napi/src/bindings/feedback.rs
 */

// ─── Violation Types ─────────────────────────────────────────────────

/** Aligned to Rust JsViolation (#[napi(object)]). */
export interface JsViolation {
  id: string;
  file: string;
  line: number;
  column: number | null;
  endLine: number | null;
  endColumn: number | null;
  severity: string;
  patternId: string;
  ruleId: string;
  message: string;
  quickFixStrategy: string | null;
  quickFixDescription: string | null;
  cweId: number | null;
  owaspCategory: string | null;
  suppressed: boolean;
  isNew: boolean;
}

// ─── Gate Result Types ───────────────────────────────────────────────

/** Aligned to Rust JsGateResult (#[napi(object)]). */
export interface JsGateResult {
  gateId: string;
  status: string;
  passed: boolean;
  score: number;
  summary: string;
  violationCount: number;
  warningCount: number;
  executionTimeMs: number;
  details: string | null;
  error: string | null;
}

// ─── Check Result ────────────────────────────────────────────────────

/** Aligned to Rust JsCheckResult (#[napi(object)]). */
export interface JsCheckResult {
  overallPassed: boolean;
  totalViolations: number;
  gates: JsGateResult[];
  sarif: string | null;
}

// ─── Audit Types ─────────────────────────────────────────────────────

/** Aligned to Rust JsHealthBreakdown (#[napi(object)]). */
export interface JsHealthBreakdown {
  avgConfidence: number;
  approvalRatio: number;
  complianceRate: number;
  crossValidationRate: number;
  duplicateFreeRate: number;
}

/** Aligned to Rust JsAuditResult (#[napi(object)]). */
export interface JsAuditResult {
  healthScore: number;
  breakdown: JsHealthBreakdown;
  trend: string;
  degradationAlerts: string[];
  autoApprovedCount: number;
  needsReviewCount: number;
}

// ─── Feedback Types ──────────────────────────────────────────────────

/** Input for drift_dismiss_violation. Aligned to Rust JsFeedbackInput (#[napi(object)]). */
export interface JsFeedbackInput {
  violationId: string;
  action: string;
  reason?: string;
}

/** Result from feedback functions. Aligned to Rust JsFeedbackResult (#[napi(object)]). */
export interface JsFeedbackResult {
  success: boolean;
  message: string;
}

// ─── Lifecycle: GC Types ────────────────────────────────────────────

/** Per-table deletion stats from driftGC. Aligned to Rust serde_json output. */
export interface GcTableResult {
  table: string;
  deleted: number;
}

/** Result from driftGC. Aligned to Rust serde_json output in lifecycle.rs. */
export interface GcResult {
  totalDeleted: number;
  durationMs: number;
  perTable: GcTableResult[];
}
