/**
 * Temporal Validator
 * 
 * Validates memories based on time-based staleness.
 * Different memory types have different half-lives.
 */

import type { Memory, MemoryType } from '../types/index.js';
import type { ValidationIssue } from './engine.js';

/**
 * Half-lives in days for different memory types
 */
const HALF_LIVES: Record<MemoryType, number> = {
  // Domain-agnostic
  core: Infinity,
  tribal: 365,
  procedural: 180,
  semantic: 90,
  episodic: 7,
  decision: 180,
  insight: 90,
  reference: 60,
  preference: 120,
  // Code-specific
  pattern_rationale: 180,
  constraint_override: 90,
  decision_context: 180,
  code_smell: 90,
  // Universal memory types (v2)
  agent_spawn: 365,
  entity: 180,
  goal: 90,
  feedback: 120,
  workflow: 180,
  conversation: 30,
  incident: 365,
  meeting: 60,
  skill: 180,
  environment: 90,
};

/**
 * Validation thresholds in days
 */
const VALIDATION_THRESHOLDS: Record<MemoryType, number> = {
  // Domain-agnostic
  core: 365,
  tribal: 90,
  procedural: 60,
  semantic: 30,
  episodic: 7,
  decision: 90,
  insight: 45,
  reference: 30,
  preference: 60,
  // Code-specific
  pattern_rationale: 60,
  constraint_override: 30,
  decision_context: 90,
  code_smell: 30,
  // Universal memory types (v2)
  agent_spawn: 90,
  entity: 60,
  goal: 30,
  feedback: 45,
  workflow: 60,
  conversation: 14,
  incident: 90,
  meeting: 30,
  skill: 60,
  environment: 30,
};

/**
 * Temporal validator
 */
export class TemporalValidator {
  /**
   * Validate a memory's temporal freshness
   */
  validate(memory: Memory): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    const daysSinceValidation = this.daysSince(memory.lastValidated || memory.createdAt);
    const daysSinceAccess = this.daysSince(memory.lastAccessed || memory.createdAt);

    const validationThreshold = VALIDATION_THRESHOLDS[memory.type] || 30;
    const halfLife = HALF_LIVES[memory.type] || 90;

    // Check validation staleness
    if (daysSinceValidation > validationThreshold) {
      issues.push({
        dimension: 'temporal',
        severity: daysSinceValidation > validationThreshold * 2 ? 'moderate' : 'minor',
        description: `Memory not validated in ${daysSinceValidation} days`,
        suggestion: 'Re-validate against current codebase',
      });
    }

    // Check dormancy
    if (daysSinceAccess > halfLife && halfLife !== Infinity) {
      issues.push({
        dimension: 'temporal',
        severity: 'minor',
        description: `Memory not accessed in ${daysSinceAccess} days`,
        suggestion: 'Consider archiving if no longer relevant',
      });
    }

    return issues;
  }

  /**
   * Calculate days since a date
   */
  private daysSince(dateStr: string): number {
    const date = new Date(dateStr);
    const now = new Date();
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  }
}
