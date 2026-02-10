/**
 * Complete stub implementation of DriftNapi.
 *
 * Every method returns structurally valid typed data matching the Rust return types.
 * No `{}` returns — every field present with sensible empty/zero defaults.
 * Used as fallback when native binary is unavailable, and for testing.
 */

import type { DriftNapi } from './interface.js';
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

/** Create a complete stub DriftNapi with all 40 methods returning valid typed data. */
export function createStubNapi(): DriftNapi {
  return {
    // ─── Lifecycle (4) ───────────────────────────────────────────────
    driftInitialize(
      _dbPath?: string,
      _projectRoot?: string,
      _configToml?: string,
    ): void {
      // no-op
    },

    driftShutdown(): void {
      // no-op
    },

    driftIsInitialized(): boolean {
      return false;
    },

    driftGC(
      _shortDays?: number,
      _mediumDays?: number,
      _longDays?: number,
    ): GcResult {
      return { totalDeleted: 0, durationMs: 0, perTable: [] };
    },

    // ─── Scanner (3) ─────────────────────────────────────────────────
    async driftScan(
      _root: string,
      _options?: ScanOptions,
    ): Promise<ScanSummary> {
      return {
        filesTotal: 0,
        filesAdded: 0,
        filesModified: 0,
        filesRemoved: 0,
        filesUnchanged: 0,
        errorsCount: 0,
        durationMs: 0,
        status: 'complete',
        languages: {},
      };
    },

    async driftScanWithProgress(
      _root: string,
      _options: ScanOptions | undefined,
      _onProgress: ProgressCallback,
    ): Promise<ScanSummary> {
      return {
        filesTotal: 0,
        filesAdded: 0,
        filesModified: 0,
        filesRemoved: 0,
        filesUnchanged: 0,
        errorsCount: 0,
        durationMs: 0,
        status: 'complete',
        languages: {},
      };
    },

    driftCancelScan(): void {
      // no-op
    },

    // ─── Analysis (3) ────────────────────────────────────────────────
    async driftAnalyze(): Promise<JsAnalysisResult[]> {
      return [];
    },

    async driftCallGraph(): Promise<JsCallGraphResult> {
      return {
        totalFunctions: 0,
        totalEdges: 0,
        entryPoints: 0,
        resolutionRate: 0,
        buildDurationMs: 0,
      };
    },

    async driftBoundaries(): Promise<JsBoundaryResult> {
      return {
        models: [],
        sensitiveFields: [],
        frameworksDetected: [],
      };
    },

    // ─── Patterns (4) ────────────────────────────────────────────────
    driftPatterns(
      _category?: string,
      _afterId?: string,
      _limit?: number,
    ): PatternsResult {
      return { patterns: [], hasMore: false, nextCursor: null };
    },

    driftConfidence(
      _tier?: string,
      _afterId?: string,
      _limit?: number,
    ): ConfidenceResult {
      return { scores: [], hasMore: false, nextCursor: null };
    },

    driftOutliers(
      _patternId?: string,
      _afterId?: number,
      _limit?: number,
    ): OutlierResult {
      return { outliers: [], hasMore: false, nextCursor: null };
    },

    driftConventions(
      _category?: string,
      _afterId?: number,
      _limit?: number,
    ): ConventionResult {
      return { conventions: [], hasMore: false, nextCursor: null };
    },

    // ─── Graph (5) ───────────────────────────────────────────────────
    driftReachability(
      functionKey: string,
      _direction: string,
    ): JsReachabilityResult {
      return {
        source: functionKey,
        reachableCount: 0,
        sensitivity: 'low',
        maxDepth: 0,
        engine: 'petgraph',
      };
    },

    driftTaintAnalysis(_root: string): JsTaintResult {
      return {
        flows: [],
        vulnerabilityCount: 0,
        sourceCount: 0,
        sinkCount: 0,
      };
    },

    driftErrorHandling(_root: string): JsErrorHandlingResult {
      return {
        gaps: [],
        handlerCount: 0,
        unhandledCount: 0,
      };
    },

    driftImpactAnalysis(_root: string): JsImpactResult {
      return {
        blastRadii: [],
        deadCode: [],
      };
    },

    driftTestTopology(_root: string): JsTestTopologyResult {
      return {
        quality: {
          coverageBreadth: 0,
          coverageDepth: 0,
          assertionDensity: 0,
          mockRatio: 0,
          isolation: 1,
          freshness: 1,
          stability: 1,
          overall: 0,
          smellCount: 0,
        },
        testCount: 0,
        sourceCount: 0,
        coveragePercent: 0,
        minimumTestSetSize: 0,
      };
    },

    // ─── Structural (9) ──────────────────────────────────────────────
    driftCouplingAnalysis(_root: string): JsCouplingResult {
      return { metrics: [], cycles: [], moduleCount: 0 };
    },

    driftConstraintVerification(_root: string): JsConstraintResult {
      return {
        totalConstraints: 0,
        passing: 0,
        failing: 0,
        violations: [],
      };
    },

    driftContractTracking(_root: string): JsContractResult {
      return {
        endpoints: [],
        mismatches: [],
        paradigmCount: 0,
        frameworkCount: 0,
      };
    },

    driftConstantsAnalysis(_root: string): JsConstantsResult {
      return {
        constantCount: 0,
        secrets: [],
        magicNumbers: [],
        missingEnvVars: [],
        deadConstantCount: 0,
      };
    },

    driftWrapperDetection(_root: string): JsWrapperResult {
      return {
        wrappers: [],
        health: {
          consistency: 0,
          coverage: 0,
          abstractionDepth: 0,
          overall: 0,
        },
        frameworkCount: 0,
        categoryCount: 0,
      };
    },

    driftDnaAnalysis(_root: string): JsDnaResult {
      return {
        genes: [],
        mutations: [],
        health: {
          overall: 0,
          consistency: 0,
          confidence: 0,
          mutationScore: 1,
          coverage: 0,
        },
        geneticDiversity: 0,
      };
    },

    driftOwaspAnalysis(_root: string): JsOwaspResult {
      return {
        findings: [],
        compliance: {
          postureScore: 100,
          owaspCoverage: 0,
          cweTop25Coverage: 0,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
        },
      };
    },

    driftCryptoAnalysis(_root: string): JsCryptoResult {
      return {
        findings: [],
        health: {
          overall: 100,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
        },
      };
    },

    driftDecomposition(_root: string): JsDecompositionResult {
      return {
        modules: [],
        moduleCount: 0,
        totalFiles: 0,
        avgCohesion: 0,
        avgCoupling: 0,
      };
    },

    // ─── Enforcement (5) ─────────────────────────────────────────────
    driftCheck(_root: string): JsCheckResult {
      return {
        overallPassed: true,
        totalViolations: 0,
        gates: [],
        sarif: null,
      };
    },

    driftAudit(_root: string): JsAuditResult {
      return {
        healthScore: 100,
        breakdown: {
          avgConfidence: 0,
          approvalRatio: 0,
          complianceRate: 1,
          crossValidationRate: 0,
          duplicateFreeRate: 1,
        },
        trend: 'stable',
        degradationAlerts: [],
        autoApprovedCount: 0,
        needsReviewCount: 0,
      };
    },

    driftViolations(_root: string): JsViolation[] {
      return [];
    },

    driftGates(_root: string): JsGateResult[] {
      return [];
    },

    driftReport(_format: string): string {
      return '';
    },

    // ─── Feedback (3) ────────────────────────────────────────────────
    driftDismissViolation(_input: JsFeedbackInput): JsFeedbackResult {
      return { success: true, message: 'Stub: violation dismissed' };
    },

    driftFixViolation(_violationId: string): JsFeedbackResult {
      return { success: true, message: 'Stub: violation marked as fixed' };
    },

    driftSuppressViolation(
      _violationId: string,
      _reason: string,
    ): JsFeedbackResult {
      return { success: true, message: 'Stub: violation suppressed' };
    },

    // ─── Advanced (4) ────────────────────────────────────────────────
    async driftSimulate(
      _taskCategory: string,
      _taskDescription: string,
      _contextJson: string,
    ): Promise<string> {
      return JSON.stringify({
        strategies: [],
        taskCategory: _taskCategory,
        taskDescription: _taskDescription,
      });
    },

    async driftDecisions(_repoPath: string): Promise<string> {
      return JSON.stringify({ decisions: [] });
    },

    async driftContext(
      _intent: string,
      _depth: string,
      _dataJson: string,
    ): Promise<string> {
      return JSON.stringify({
        sections: [],
        tokenCount: 0,
        intent: _intent,
        depth: _depth,
      });
    },

    async driftGenerateSpec(
      _moduleJson: string,
      _migrationPathJson?: string,
    ): Promise<string> {
      return JSON.stringify({
        moduleName: '',
        sections: [],
        totalTokenCount: 0,
        hasAllSections: false,
      });
    },
  };
}
