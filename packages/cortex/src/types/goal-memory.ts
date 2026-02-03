/**
 * Goal Memory Type
 * 
 * Tracks objectives with hierarchical structure, progress, and blockers.
 * Supports OKRs, epics, milestones, and personal goals.
 */

import type { BaseMemory } from './memory.js';

/**
 * Goal status
 */
export type GoalStatus = 'active' | 'achieved' | 'abandoned' | 'blocked' | 'at_risk';

/**
 * Success criterion for a goal
 */
export interface SuccessCriterion {
  criterion: string;
  met: boolean;
  evidence?: string;
  metAt?: string;
}

/**
 * Blocker preventing goal progress
 */
export interface GoalBlocker {
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
}

/**
 * Goal Memory - Objectives with progress tracking
 * 
 * Half-life: 90 days (goals need regular review)
 * 
 * Examples:
 * - "Launch v2.0 by Q2" with sub-goals and blockers
 * - "Reduce API latency to <100ms" with success criteria
 * - "Hire 3 engineers" with progress tracking
 */
export interface GoalMemory extends BaseMemory {
  type: 'goal';

  /** Goal title */
  title: string;
  /** Detailed description */
  description: string;

  /** Hierarchy */
  parentGoalId?: string;
  childGoalIds?: string[];

  /** Status tracking */
  status: GoalStatus;
  /** Progress percentage (0-100) */
  progress: number;

  /** Success criteria */
  successCriteria: SuccessCriterion[];

  /** Timeline */
  targetDate?: string;
  achievedDate?: string;
  createdDate: string;

  /** Blockers */
  blockers?: GoalBlocker[];

  /** Owner / assignee */
  owner?: string;
  /** Stakeholders */
  stakeholders?: string[];

  /** Lessons learned (populated on completion) */
  lessonsLearned?: string[];

  /** Domain classification */
  domain?: string;
}
