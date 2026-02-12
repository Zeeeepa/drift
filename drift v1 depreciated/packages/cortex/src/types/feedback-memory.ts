/**
 * Feedback Memory Type
 * 
 * Captures corrections and learning signals from user interactions.
 * Enables agents to learn from mistakes and improve over time.
 */

import type { BaseMemory } from './memory.js';

/**
 * Types of memory feedback (corrections)
 */
export type MemoryFeedbackType =
  | 'factual_error'      // Wrong information
  | 'style_preference'   // Communication style
  | 'missing_context'    // Didn't consider something
  | 'wrong_approach'     // Bad solution strategy
  | 'too_verbose'        // Response too long
  | 'too_brief'          // Response too short
  | 'incorrect_tool'     // Used wrong tool/method
  | 'security_concern'   // Security issue
  | 'other';

/**
 * Feedback Memory - Corrections and learning signals
 * 
 * Half-life: 120 days (feedback needs reinforcement)
 * 
 * Examples:
 * - "User corrected: use async/await not callbacks"
 * - "User prefers concise responses, not verbose"
 * - "Wrong assumption: project uses PostgreSQL not MySQL"
 */
export interface FeedbackMemory extends BaseMemory {
  type: 'feedback';

  /** What the agent said/did */
  originalOutput: string;
  /** What the user wanted instead */
  correction: string;

  /** Context of the interaction */
  context: string;
  /** What the user was trying to accomplish */
  intent?: string;

  /** Classification */
  feedbackType: MemoryFeedbackType;

  /** Extracted generalizable rule */
  extractedRule?: string;
  /** Domains/contexts this applies to */
  appliesTo?: string[];

  /** Has this been validated as correct? */
  validated: boolean;
  /** Other feedback that contradicts this */
  contradictedBy?: string[];

  /** Source interaction ID */
  sourceEpisodeId?: string;
}
