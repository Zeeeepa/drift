/**
 * Preference Memory Type
 * 
 * User, team, or organization preferences.
 * Captures how things should be done, not just how they are done.
 */

import type { BaseMemory } from './memory.js';

/**
 * Preference Memory - How we like things done
 * 
 * Half-life: 120 days (preferences are fairly stable)
 * 
 * Examples:
 * - "Prefer async communication over meetings"
 * - "Always use TypeScript strict mode"
 * - "Documentation should include examples"
 */
export interface PreferenceMemory extends BaseMemory {
  type: 'preference';

  /** The preference */
  preference: string;
  /** Category (communication, workflow, tools, style, etc.) */
  category: string;

  /** Who this applies to */
  scope: 'personal' | 'team' | 'organization';
  /** Specific contexts where this applies */
  appliesTo?: string[];

  /** How strongly this is preferred */
  strength: 'suggestion' | 'preference' | 'requirement';

  /** Why this preference exists */
  reason?: string;
  /** Exceptions to this preference */
  exceptions?: string[];
}
