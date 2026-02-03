/**
 * Skill Memory Type
 * 
 * Tracks knowledge domains with proficiency levels and learning resources.
 * Enables tailored explanations and learning path suggestions.
 */

import type { BaseMemory } from './memory.js';

/**
 * Proficiency levels
 */
export type ProficiencyLevel = 
  | 'learning' 
  | 'beginner' 
  | 'competent' 
  | 'proficient' 
  | 'expert';

/**
 * Learning resource types
 */
export type ResourceType = 
  | 'documentation' 
  | 'tutorial' 
  | 'reference' 
  | 'example' 
  | 'video' 
  | 'book';

/**
 * Learning resource
 */
export interface LearningResource {
  title: string;
  url?: string;
  type: ResourceType;
  recommended: boolean;
}

/**
 * Skill Memory - Knowledge domains and proficiency
 * 
 * Half-life: 180 days (skills are fairly stable)
 * 
 * Examples:
 * - "React Testing" with proficiency and resources
 * - "AWS Lambda" with key principles and gotchas
 * - "GraphQL" with common patterns and anti-patterns
 */
export interface SkillMemory extends BaseMemory {
  type: 'skill';

  /** Skill name */
  name: string;
  /** Domain classification */
  domain: string;
  /** Sub-domain */
  subdomain?: string;

  /** Proficiency level */
  proficiencyLevel: ProficiencyLevel;

  /** Knowledge content */
  keyPrinciples?: string[];
  commonPatterns?: string[];
  antiPatterns?: string[];
  gotchas?: string[];

  /** Learning resources */
  resources?: LearningResource[];

  /** Learning path */
  prerequisites?: string[];
  nextToLearn?: string[];

  /** Related skills */
  relatedSkills?: string[];

  /** Scope */
  scope: 'personal' | 'team' | 'organization';
}
