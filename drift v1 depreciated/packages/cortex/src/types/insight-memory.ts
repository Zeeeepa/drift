/**
 * Insight Memory Type
 * 
 * Learned insights and observations from any domain.
 * Captures knowledge gained through experience, research, or feedback.
 */

import type { BaseMemory } from './memory.js';

/**
 * Insight Memory - Learned observations
 * 
 * Half-life: 90 days (insights need reinforcement)
 * 
 * Examples:
 * - "Users prefer weekly summaries over daily notifications"
 * - "Our best hires came from referrals, not job boards"
 * - "Async standups work better for distributed teams"
 */
export interface InsightMemory extends BaseMemory {
  type: 'insight';

  /** The insight itself */
  insight: string;
  /** How this was learned */
  source: 'observation' | 'experiment' | 'feedback' | 'research' | 'experience' | 'inference';

  /** Domain this applies to */
  domain?: string;
  /** How broadly this applies */
  applicability?: 'universal' | 'contextual' | 'specific';
  /** Conditions when this insight applies */
  conditions?: string[];

  /** Whether this has been validated */
  validated?: boolean;
  /** Who validated it */
  validatedBy?: string;
  /** When it was validated */
  validatedAt?: string;

  /** Evidence supporting this insight */
  evidence?: string[];
  /** Known contradictions or exceptions */
  contradictions?: string[];
}
