/**
 * Adaptive Consolidation Scheduler
 * 
 * Intelligent consolidation triggering based on:
 * - Token pressure (approaching context limits)
 * - Memory quality degradation
 * - Contradiction density
 * - Context clustering
 * - Time-based fallback
 */

import type { IMemoryStorage } from '../storage/interface.js';
import type { MemoryType } from '../types/index.js';
import type { ConsolidationEngine, ConsolidationResult } from './engine.js';

/**
 * Types of consolidation triggers
 */
export type ConsolidationTriggerType =
  | 'scheduled'
  | 'token_pressure'
  | 'memory_count'
  | 'confidence_degradation'
  | 'contradiction_density'
  | 'context_cluster'
  | 'manual';

/**
 * Consolidation trigger
 */
export interface ConsolidationTrigger {
  type: ConsolidationTriggerType;
  reason: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  metrics: Record<string, number>;
  suggestedScope: ConsolidationScope;
}

/**
 * Consolidation scope
 */
export interface ConsolidationScope {
  memoryTypes?: MemoryType[];
  contextCluster?: string;
  minAge?: number;
  maxConfidence?: number;
  aggressiveness: 'conservative' | 'moderate' | 'aggressive';
  targetTokenReduction?: number;
}

/**
 * Token usage metrics
 */
export interface TokenUsage {
  totalTokens: number;
  byType: Record<MemoryType, number>;
  byAge: {
    last24h: number;
    last7d: number;
    last30d: number;
    older: number;
  };
  compressionPotential: number;
}

/**
 * Quality metrics
 */
export interface QualityMetrics {
  avgConfidence: number;
  confidenceTrend: 'improving' | 'stable' | 'degrading';
  contradictionDensity: number;
  staleMemoryRatio: number;
  orphanMemoryRatio: number;
}

/**
 * Adaptive scheduler configuration
 */
export interface AdaptiveSchedulerConfig {
  /** Enable adaptive scheduling */
  enabled: boolean;
  /** Fallback interval in hours */
  fallbackIntervalHours: number;
  /** Token budget (estimated context window) */
  tokenBudget: number;
  /** Trigger consolidation at this % of budget */
  tokenPressureThreshold: number;
  /** Maximum memory count before triggering */
  maxMemoryCount: number;
  /** Minimum average confidence before triggering */
  minAvgConfidence: number;
  /** Maximum contradiction density (per 100 memories) */
  maxContradictionDensity: number;
  /** Check interval in minutes */
  checkIntervalMinutes: number;
}

const DEFAULT_CONFIG: AdaptiveSchedulerConfig = {
  enabled: true,
  fallbackIntervalHours: 24,
  tokenBudget: 100000,  // ~100k tokens
  tokenPressureThreshold: 0.8,
  maxMemoryCount: 500,
  minAvgConfidence: 0.5,
  maxContradictionDensity: 10,
  checkIntervalMinutes: 30,
};

/**
 * Adaptive Consolidation Scheduler
 */
export class AdaptiveConsolidationScheduler {
  private storage: IMemoryStorage;
  private engine: ConsolidationEngine;
  private config: AdaptiveSchedulerConfig;
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastRun: Date | null = null;
  private lastMetrics: { tokens: TokenUsage; quality: QualityMetrics } | null = null;

  constructor(
    storage: IMemoryStorage,
    engine: ConsolidationEngine,
    config?: Partial<AdaptiveSchedulerConfig>
  ) {
    this.storage = storage;
    this.engine = engine;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start the adaptive scheduler
   */
  start(): void {
    if (!this.config.enabled) return;

    const intervalMs = this.config.checkIntervalMinutes * 60 * 1000;

    this.timer = setInterval(async () => {
      const trigger = await this.checkTriggers();
      if (trigger) {
        await this.runConsolidation(trigger);
      }
    }, intervalMs);

    // Initial check
    void this.checkTriggers().then(t => {
      if (t && t.urgency === 'critical') {
        void this.runConsolidation(t);
      }
    });
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Check all triggers and return the most urgent one
   */
  async checkTriggers(): Promise<ConsolidationTrigger | null> {
    const triggers: ConsolidationTrigger[] = [];

    // Gather metrics
    const tokenUsage = await this.calculateTokenUsage();
    const qualityMetrics = await this.calculateQualityMetrics();
    
    this.lastMetrics = { tokens: tokenUsage, quality: qualityMetrics };

    // Check token pressure
    const tokenTrigger = this.checkTokenPressure(tokenUsage);
    if (tokenTrigger) triggers.push(tokenTrigger);

    // Check memory count
    const countTrigger = await this.checkMemoryCount();
    if (countTrigger) triggers.push(countTrigger);

    // Check confidence degradation
    const confidenceTrigger = this.checkConfidenceDegradation(qualityMetrics);
    if (confidenceTrigger) triggers.push(confidenceTrigger);

    // Check contradiction density
    const contradictionTrigger = this.checkContradictionDensity(qualityMetrics);
    if (contradictionTrigger) triggers.push(contradictionTrigger);

    // Check scheduled fallback
    const scheduledTrigger = this.checkScheduledFallback();
    if (scheduledTrigger) triggers.push(scheduledTrigger);

    // Return most urgent trigger
    if (triggers.length === 0) return null;

    const urgencyOrder: Record<string, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    triggers.sort((a, b) => (urgencyOrder[a.urgency] ?? 3) - (urgencyOrder[b.urgency] ?? 3));
    return triggers[0] ?? null;
  }

  /**
   * Run consolidation with the given trigger
   */
  async runConsolidation(_trigger: ConsolidationTrigger): Promise<ConsolidationResult> {
    this.lastRun = new Date();
    
    // For now, use the standard consolidation
    // In the future, this would use _trigger.suggestedScope to customize
    return this.engine.consolidate(false);
  }

  /**
   * Get current metrics
   */
  getMetrics(): { tokens: TokenUsage; quality: QualityMetrics } | null {
    return this.lastMetrics;
  }

  /**
   * Get last run time
   */
  getLastRun(): Date | null {
    return this.lastRun;
  }

  /**
   * Force a metrics refresh
   */
  async refreshMetrics(): Promise<{ tokens: TokenUsage; quality: QualityMetrics }> {
    const tokens = await this.calculateTokenUsage();
    const quality = await this.calculateQualityMetrics();
    this.lastMetrics = { tokens, quality };
    return this.lastMetrics;
  }

  // ============================================================================
  // Trigger Checks
  // ============================================================================

  private checkTokenPressure(usage: TokenUsage): ConsolidationTrigger | null {
    const usageRatio = usage.totalTokens / this.config.tokenBudget;
    
    if (usageRatio < this.config.tokenPressureThreshold) {
      return null;
    }

    const urgency = usageRatio > 0.95 ? 'critical' :
                    usageRatio > 0.9 ? 'high' :
                    usageRatio > 0.85 ? 'medium' : 'low';

    return {
      type: 'token_pressure',
      reason: `Token usage at ${Math.round(usageRatio * 100)}% of budget`,
      urgency,
      metrics: {
        totalTokens: usage.totalTokens,
        budget: this.config.tokenBudget,
        usageRatio,
        compressionPotential: usage.compressionPotential,
      },
      suggestedScope: {
        aggressiveness: urgency === 'critical' ? 'aggressive' : 'moderate',
        targetTokenReduction: usage.totalTokens - (this.config.tokenBudget * 0.7),
        // Target older memories first
        minAge: 7,
      },
    };
  }

  private async checkMemoryCount(): Promise<ConsolidationTrigger | null> {
    const count = await this.storage.count();
    
    if (count < this.config.maxMemoryCount) {
      return null;
    }

    const ratio = count / this.config.maxMemoryCount;
    const urgency = ratio > 2 ? 'high' : ratio > 1.5 ? 'medium' : 'low';

    return {
      type: 'memory_count',
      reason: `Memory count (${count}) exceeds threshold (${this.config.maxMemoryCount})`,
      urgency,
      metrics: {
        count,
        threshold: this.config.maxMemoryCount,
        ratio,
      },
      suggestedScope: {
        aggressiveness: 'moderate',
        // Focus on episodic memories which are meant to be consolidated
        memoryTypes: ['episodic'],
      },
    };
  }

  private checkConfidenceDegradation(metrics: QualityMetrics): ConsolidationTrigger | null {
    if (metrics.avgConfidence >= this.config.minAvgConfidence) {
      return null;
    }

    const urgency = metrics.avgConfidence < 0.3 ? 'high' :
                    metrics.avgConfidence < 0.4 ? 'medium' : 'low';

    return {
      type: 'confidence_degradation',
      reason: `Average confidence (${Math.round(metrics.avgConfidence * 100)}%) below threshold`,
      urgency,
      metrics: {
        avgConfidence: metrics.avgConfidence,
        threshold: this.config.minAvgConfidence,
        staleRatio: metrics.staleMemoryRatio,
      },
      suggestedScope: {
        aggressiveness: 'conservative',
        // Target low confidence memories
        maxConfidence: 0.4,
      },
    };
  }

  private checkContradictionDensity(metrics: QualityMetrics): ConsolidationTrigger | null {
    if (metrics.contradictionDensity <= this.config.maxContradictionDensity) {
      return null;
    }

    const urgency = metrics.contradictionDensity > 20 ? 'high' : 'medium';

    return {
      type: 'contradiction_density',
      reason: `High contradiction density (${metrics.contradictionDensity.toFixed(1)} per 100 memories)`,
      urgency,
      metrics: {
        density: metrics.contradictionDensity,
        threshold: this.config.maxContradictionDensity,
      },
      suggestedScope: {
        aggressiveness: 'moderate',
        // Focus on types that commonly contradict
        memoryTypes: ['tribal', 'semantic', 'feedback'],
      },
    };
  }

  private checkScheduledFallback(): ConsolidationTrigger | null {
    if (!this.lastRun) {
      // Never run before, but don't trigger immediately
      return null;
    }

    const hoursSinceLastRun = 
      (Date.now() - this.lastRun.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastRun < this.config.fallbackIntervalHours) {
      return null;
    }

    return {
      type: 'scheduled',
      reason: `Scheduled consolidation (${Math.round(hoursSinceLastRun)}h since last run)`,
      urgency: 'low',
      metrics: {
        hoursSinceLastRun,
        interval: this.config.fallbackIntervalHours,
      },
      suggestedScope: {
        aggressiveness: 'conservative',
      },
    };
  }

  // ============================================================================
  // Metrics Calculation
  // ============================================================================

  private async calculateTokenUsage(): Promise<TokenUsage> {
    const memories = await this.storage.search({ limit: 10000 });
    
    const byType: Record<string, number> = {};
    const byAge = { last24h: 0, last7d: 0, last30d: 0, older: 0 };
    let totalTokens = 0;
    let compressionPotential = 0;

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    for (const memory of memories) {
      // Estimate tokens (rough: 4 chars per token)
      const tokens = Math.ceil(JSON.stringify(memory).length / 4);
      totalTokens += tokens;

      // By type
      byType[memory.type] = (byType[memory.type] || 0) + tokens;

      // By age
      const age = now - new Date(memory.createdAt).getTime();
      if (age < day) {
        byAge.last24h += tokens;
      } else if (age < 7 * day) {
        byAge.last7d += tokens;
      } else if (age < 30 * day) {
        byAge.last30d += tokens;
      } else {
        byAge.older += tokens;
      }

      // Compression potential (episodic memories can be consolidated)
      if (memory.type === 'episodic') {
        compressionPotential += tokens * 0.7; // Assume 70% reduction
      } else if (memory.confidence < 0.3) {
        compressionPotential += tokens; // Can be archived
      }
    }

    return {
      totalTokens,
      byType: byType as Record<MemoryType, number>,
      byAge,
      compressionPotential,
    };
  }

  private async calculateQualityMetrics(): Promise<QualityMetrics> {
    const memories = await this.storage.search({ limit: 1000 });
    
    if (memories.length === 0) {
      return {
        avgConfidence: 1.0,
        confidenceTrend: 'stable',
        contradictionDensity: 0,
        staleMemoryRatio: 0,
        orphanMemoryRatio: 0,
      };
    }

    // Average confidence
    const avgConfidence = memories.reduce((sum, m) => sum + m.confidence, 0) / memories.length;

    // Confidence trend (compare recent vs older)
    const recentMemories = memories.filter(m => {
      const age = Date.now() - new Date(m.createdAt).getTime();
      return age < 7 * 24 * 60 * 60 * 1000;
    });
    const olderMemories = memories.filter(m => {
      const age = Date.now() - new Date(m.createdAt).getTime();
      return age >= 7 * 24 * 60 * 60 * 1000;
    });

    const recentAvg = recentMemories.length > 0
      ? recentMemories.reduce((sum, m) => sum + m.confidence, 0) / recentMemories.length
      : avgConfidence;
    const olderAvg = olderMemories.length > 0
      ? olderMemories.reduce((sum, m) => sum + m.confidence, 0) / olderMemories.length
      : avgConfidence;

    const confidenceTrend = recentAvg > olderAvg + 0.05 ? 'improving' :
                           recentAvg < olderAvg - 0.05 ? 'degrading' : 'stable';

    // Contradiction density (would need to query relationships)
    // For now, estimate based on low-confidence memories
    const lowConfidenceCount = memories.filter(m => m.confidence < 0.5).length;
    const contradictionDensity = (lowConfidenceCount / memories.length) * 100;

    // Stale memory ratio (not accessed in 30 days)
    const staleCount = memories.filter(m => {
      if (!m.lastAccessed) return true;
      const age = Date.now() - new Date(m.lastAccessed).getTime();
      return age > 30 * 24 * 60 * 60 * 1000;
    }).length;
    const staleMemoryRatio = staleCount / memories.length;

    // Orphan ratio (no linked patterns, files, or relationships)
    const orphanCount = memories.filter(m => {
      return !m.linkedPatterns?.length && 
             !m.linkedFiles?.length && 
             !m.linkedConstraints?.length;
    }).length;
    const orphanMemoryRatio = orphanCount / memories.length;

    return {
      avgConfidence,
      confidenceTrend,
      contradictionDensity,
      staleMemoryRatio,
      orphanMemoryRatio,
    };
  }
}
