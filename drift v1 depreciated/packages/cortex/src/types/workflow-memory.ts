/**
 * Workflow Memory Type
 * 
 * Stores step-by-step processes that can be executed with guidance.
 * Supports variations based on conditions.
 */

import type { BaseMemory } from './memory.js';

/**
 * A step in a workflow
 */
export interface WorkflowStep {
  order: number;
  name: string;
  description: string;
  /** Tools/commands used in this step */
  tools?: string[];
  /** Typical duration */
  estimatedDuration?: string;
  /** Tips and warnings */
  tips?: string[];
  /** Required before proceeding */
  required: boolean;
  /** Verification criteria */
  verification?: string;
}

/**
 * Conditional variation of a workflow
 */
export interface WorkflowVariation {
  condition: string;
  description: string;
  stepOverrides: Record<number, Partial<WorkflowStep>>;
  additionalSteps?: WorkflowStep[];
}

/**
 * Workflow execution stats
 */
export interface WorkflowStats {
  executionCount: number;
  avgDuration?: string;
  lastExecuted?: string;
  successRate: number;
}

/**
 * Workflow Memory - Step-by-step processes
 * 
 * Half-life: 180 days (workflows are fairly stable)
 * 
 * Examples:
 * - "Deploy to production" with pre-flight checks
 * - "Onboard new team member" with checklist
 * - "Release new version" with rollback steps
 */
export interface WorkflowMemory extends BaseMemory {
  type: 'workflow';

  /** Workflow name */
  name: string;
  /** Description */
  description: string;
  /** Unique slug for invocation */
  slug: string;

  /** Ordered steps */
  steps: WorkflowStep[];

  /** Phrases that trigger this workflow */
  triggerPhrases: string[];

  /** Conditional variations */
  variations?: WorkflowVariation[];

  /** Execution history */
  stats?: WorkflowStats;

  /** Prerequisites */
  prerequisites?: string[];
  /** Domain classification */
  domain?: string;
}
