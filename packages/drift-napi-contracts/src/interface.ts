/**
 * DriftNapi — The single source of truth for all Rust↔TypeScript NAPI function signatures.
 *
 * Every method in this interface corresponds to a `#[napi]` export in
 * `crates/drift/drift-napi/src/bindings/*.rs`. Function names and parameter
 * types MUST match Rust exactly. When Rust disagrees with TypeScript, Rust wins.
 *
 * 40 methods total, grouped by Rust binding module:
 * - Lifecycle (4): lifecycle.rs
 * - Scanner (3): scanner.rs
 * - Analysis (3): analysis.rs
 * - Patterns (4): patterns.rs
 * - Graph (5): graph.rs
 * - Structural (9): structural.rs
 * - Enforcement (5): enforcement.rs
 * - Feedback (3): feedback.rs
 * - Advanced (4): advanced.rs
 */

import type { ScanOptions, ScanSummary } from './types/scanner.js';
import type { ProgressCallback } from './types/lifecycle.js';
import type {
  JsAnalysisResult,
  JsCallGraphResult,
  JsBoundaryResult,
} from './types/analysis.js';
import type {
  PatternsResult,
  ConfidenceResult,
  OutlierResult,
  ConventionResult,
} from './types/patterns.js';
import type {
  JsReachabilityResult,
  JsTaintResult,
  JsErrorHandlingResult,
  JsImpactResult,
  JsTestTopologyResult,
} from './types/graph.js';
import type {
  JsCouplingResult,
  JsConstraintResult,
  JsContractResult,
  JsConstantsResult,
  JsWrapperResult,
  JsDnaResult,
  JsOwaspResult,
  JsCryptoResult,
  JsDecompositionResult,
} from './types/structural.js';
import type {
  JsCheckResult,
  JsAuditResult,
  JsViolation,
  JsGateResult,
  JsFeedbackInput,
  JsFeedbackResult,
  GcResult,
} from './types/enforcement.js';

export interface DriftNapi {
  // ─── Lifecycle (4) — lifecycle.rs ────────────────────────────────────
  // Rust: driftInitialize(db_path: Option<String>, project_root: Option<String>, config_toml: Option<String>)
  driftInitialize(
    dbPath?: string,
    projectRoot?: string,
    configToml?: string,
  ): void;

  // Rust: driftShutdown()
  driftShutdown(): void;

  // Rust: driftIsInitialized() -> bool
  driftIsInitialized(): boolean;

  // Rust: driftGC(short_days: Option<u32>, medium_days: Option<u32>, long_days: Option<u32>) -> serde_json::Value
  driftGC(
    shortDays?: number,
    mediumDays?: number,
    longDays?: number,
  ): GcResult;

  // ─── Scanner (3) — scanner.rs ────────────────────────────────────────
  // Rust: driftScan(root: String, options: Option<ScanOptions>) -> AsyncTask<ScanTask>
  driftScan(root: string, options?: ScanOptions): Promise<ScanSummary>;

  // Rust: driftScanWithProgress(root: String, options: Option<ScanOptions>, on_progress: ThreadsafeFunction)
  driftScanWithProgress(
    root: string,
    options: ScanOptions | undefined,
    onProgress: ProgressCallback,
  ): Promise<ScanSummary>;

  // Rust: driftCancelScan()
  driftCancelScan(): void;

  // ─── Analysis (3) — analysis.rs ──────────────────────────────────────
  // Rust: drift_analyze() -> Vec<JsAnalysisResult>
  driftAnalyze(): Promise<JsAnalysisResult[]>;

  // Rust: drift_call_graph() -> JsCallGraphResult
  driftCallGraph(): Promise<JsCallGraphResult>;

  // Rust: drift_boundaries() -> JsBoundaryResult
  driftBoundaries(): Promise<JsBoundaryResult>;

  // ─── Patterns (4) — patterns.rs ──────────────────────────────────────
  // Rust: drift_patterns(category: Option<String>, after_id: Option<String>, limit: Option<u32>)
  driftPatterns(
    category?: string,
    afterId?: string,
    limit?: number,
  ): PatternsResult;

  // Rust: drift_confidence(tier: Option<String>, after_id: Option<String>, limit: Option<u32>)
  driftConfidence(
    tier?: string,
    afterId?: string,
    limit?: number,
  ): ConfidenceResult;

  // Rust: drift_outliers(pattern_id: Option<String>, after_id: Option<u32>, limit: Option<u32>)
  driftOutliers(
    patternId?: string,
    afterId?: number,
    limit?: number,
  ): OutlierResult;

  // Rust: drift_conventions(category: Option<String>, after_id: Option<u32>, limit: Option<u32>)
  driftConventions(
    category?: string,
    afterId?: number,
    limit?: number,
  ): ConventionResult;

  // ─── Graph (5) — graph.rs ────────────────────────────────────────────
  // Rust: drift_reachability(function_key: String, direction: String)
  driftReachability(
    functionKey: string,
    direction: string,
  ): JsReachabilityResult;

  // Rust: drift_taint_analysis(root: String)
  driftTaintAnalysis(root: string): JsTaintResult;

  // Rust: drift_error_handling(root: String)
  driftErrorHandling(root: string): JsErrorHandlingResult;

  // Rust: drift_impact_analysis(root: String)
  driftImpactAnalysis(root: string): JsImpactResult;

  // Rust: drift_test_topology(root: String)
  driftTestTopology(root: string): JsTestTopologyResult;

  // ─── Structural (9) — structural.rs ──────────────────────────────────
  // Rust: drift_coupling_analysis(root: String)
  driftCouplingAnalysis(root: string): JsCouplingResult;

  // Rust: drift_constraint_verification(root: String)
  driftConstraintVerification(root: string): JsConstraintResult;

  // Rust: drift_contract_tracking(root: String)
  driftContractTracking(root: string): JsContractResult;

  // Rust: drift_constants_analysis(root: String)
  driftConstantsAnalysis(root: string): JsConstantsResult;

  // Rust: drift_wrapper_detection(root: String)
  driftWrapperDetection(root: string): JsWrapperResult;

  // Rust: drift_dna_analysis(root: String)
  driftDnaAnalysis(root: string): JsDnaResult;

  // Rust: drift_owasp_analysis(root: String)
  driftOwaspAnalysis(root: string): JsOwaspResult;

  // Rust: drift_crypto_analysis(root: String)
  driftCryptoAnalysis(root: string): JsCryptoResult;

  // Rust: drift_decomposition(root: String)
  driftDecomposition(root: string): JsDecompositionResult;

  // ─── Enforcement (5) — enforcement.rs ────────────────────────────────
  // Rust: drift_check(_root: String)
  driftCheck(root: string): JsCheckResult;

  // Rust: drift_audit(_root: String)
  driftAudit(root: string): JsAuditResult;

  // Rust: drift_violations(_root: String) -> Vec<JsViolation>
  driftViolations(root: string): JsViolation[];

  // Rust: drift_gates(_root: String) -> Vec<JsGateResult>
  driftGates(root: string): JsGateResult[];

  // Rust: drift_report(format: String) -> String
  driftReport(format: string): string;

  // ─── Feedback (3) — feedback.rs ──────────────────────────────────────
  // Rust: drift_dismiss_violation(input: JsFeedbackInput)
  driftDismissViolation(input: JsFeedbackInput): JsFeedbackResult;

  // Rust: drift_fix_violation(violation_id: String)
  driftFixViolation(violationId: string): JsFeedbackResult;

  // Rust: drift_suppress_violation(violation_id: String, reason: String)
  driftSuppressViolation(
    violationId: string,
    reason: string,
  ): JsFeedbackResult;

  // ─── Advanced (4) — advanced.rs ──────────────────────────────────────
  // Rust: drift_simulate(task_category: String, task_description: String, context_json: String)
  driftSimulate(
    taskCategory: string,
    taskDescription: string,
    contextJson: string,
  ): Promise<string>;

  // Rust: drift_decisions(repo_path: String)
  driftDecisions(repoPath: string): Promise<string>;

  // Rust: drift_context(intent: String, depth: String, data_json: String)
  driftContext(
    intent: string,
    depth: string,
    dataJson: string,
  ): Promise<string>;

  // Rust: drift_generate_spec(module_json: String, migration_path_json: Option<String>)
  driftGenerateSpec(
    moduleJson: string,
    migrationPathJson?: string,
  ): Promise<string>;
}

/** Total number of methods in the DriftNapi interface. */
export const DRIFT_NAPI_METHOD_COUNT = 40;

/** All method names in the DriftNapi interface, for runtime validation. */
export const DRIFT_NAPI_METHOD_NAMES: ReadonlyArray<keyof DriftNapi> = [
  // Lifecycle (4)
  'driftInitialize',
  'driftShutdown',
  'driftIsInitialized',
  'driftGC',
  // Scanner (3)
  'driftScan',
  'driftScanWithProgress',
  'driftCancelScan',
  // Analysis (3)
  'driftAnalyze',
  'driftCallGraph',
  'driftBoundaries',
  // Patterns (4)
  'driftPatterns',
  'driftConfidence',
  'driftOutliers',
  'driftConventions',
  // Graph (5)
  'driftReachability',
  'driftTaintAnalysis',
  'driftErrorHandling',
  'driftImpactAnalysis',
  'driftTestTopology',
  // Structural (9)
  'driftCouplingAnalysis',
  'driftConstraintVerification',
  'driftContractTracking',
  'driftConstantsAnalysis',
  'driftWrapperDetection',
  'driftDnaAnalysis',
  'driftOwaspAnalysis',
  'driftCryptoAnalysis',
  'driftDecomposition',
  // Enforcement (5)
  'driftCheck',
  'driftAudit',
  'driftViolations',
  'driftGates',
  'driftReport',
  // Feedback (3)
  'driftDismissViolation',
  'driftFixViolation',
  'driftSuppressViolation',
  // Advanced (4)
  'driftSimulate',
  'driftDecisions',
  'driftContext',
  'driftGenerateSpec',
] as const;
