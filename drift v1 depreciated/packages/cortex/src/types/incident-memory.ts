/**
 * Incident Memory Type
 * 
 * Stores incident postmortems with root cause analysis and prevention measures.
 * Enables proactive warnings when similar situations arise.
 */

import type { BaseMemory } from './memory.js';

/**
 * Incident severity levels
 */
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Incident types
 */
export type IncidentType = 
  | 'outage' 
  | 'security' 
  | 'data_loss' 
  | 'performance' 
  | 'integration' 
  | 'other';

/**
 * Action item from incident postmortem
 */
export interface IncidentActionItem {
  item: string;
  owner?: string;
  status: 'pending' | 'in_progress' | 'done';
  dueDate?: string;
  completedAt?: string;
}

/**
 * Incident Memory - Postmortems and lessons learned
 * 
 * Half-life: 365 days (incidents are critical institutional knowledge)
 * 
 * Examples:
 * - "Production outage 2024-01-15" with root cause
 * - "Data migration failure" with rollback steps
 * - "Security breach attempt" with detection methods
 */
export interface IncidentMemory extends BaseMemory {
  type: 'incident';

  /** Incident title */
  title: string;
  /** Severity classification */
  severity: IncidentSeverity;
  /** Incident type */
  incidentType?: IncidentType;

  /** Timeline */
  detectedAt: string;
  resolvedAt?: string;
  duration?: string;

  /** Impact assessment */
  impact: string;
  affectedSystems: string[];
  affectedUsers?: string;
  businessImpact?: string;

  /** Root cause analysis */
  rootCause?: string;
  contributingFactors?: string[];
  /** How it was detected */
  detectionMethod?: string;

  /** Resolution */
  resolution: string;
  workarounds?: string[];
  /** Who resolved it */
  resolvedBy?: string;

  /** Prevention */
  actionItems?: IncidentActionItem[];

  /** Lessons learned */
  lessonsLearned: string[];
  /** Prevention measures implemented */
  preventionMeasures?: string[];

  /** Warning triggers - conditions that should surface this incident */
  warningTriggers?: string[];

  /** Related incidents */
  relatedIncidents?: string[];
}
