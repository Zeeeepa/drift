/**
 * Decision Memory Type
 * 
 * Standalone decisions for any domain (business, personal, research, etc.)
 * Unlike decision_context which is linked to code ADRs, this is domain-agnostic.
 */

import type { BaseMemory } from './memory.js';

/**
 * Decision Memory - Standalone decision records
 * 
 * Half-life: 180 days (important decisions persist)
 * 
 * Examples:
 * - "We decided to register a UK subsidiary for EU market access"
 * - "Chose PostgreSQL over MongoDB for ACID compliance"
 * - "Hired a fractional CFO instead of full-time"
 */
export interface DecisionMemory extends BaseMemory {
  type: 'decision';

  /** Decision title */
  title: string;
  /** Decision outcome */
  outcome: 'approved' | 'rejected' | 'deferred' | 'superseded';

  /** Brief summary of the decision */
  decisionSummary: string;
  /** Context that led to this decision */
  context?: string;

  /** Alternatives considered */
  alternatives?: Array<{
    option: string;
    pros?: string[];
    cons?: string[];
    rejectedReason?: string;
  }>;

  /** People involved in the decision */
  stakeholders?: string[];
  /** Who made the final call */
  decisionMaker?: string;

  /** Conditions that would trigger revisiting */
  revisitWhen?: string[];
  /** When to review this decision */
  reviewSchedule?: 'monthly' | 'quarterly' | 'yearly' | 'never';

  /** Domain/category (business, technical, personal, etc.) */
  domain?: string;
  /** Related decision IDs */
  relatedDecisions?: string[];
}
