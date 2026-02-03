/**
 * Entity Memory Type
 * 
 * Represents a named entity (project, product, team, client, system)
 * with attributes, relationships, and contextual knowledge.
 */

import type { BaseMemory } from './memory.js';

/**
 * Entity types
 */
export type EntityType = 
  | 'project' 
  | 'product' 
  | 'team' 
  | 'client' 
  | 'vendor' 
  | 'system' 
  | 'service' 
  | 'other';

/**
 * Relationship between entities
 */
export interface EntityRelationship {
  targetEntityId: string;
  targetEntityName?: string;
  relationshipType: 'owns' | 'depends_on' | 'integrates_with' | 'managed_by' | 'related_to';
  metadata?: Record<string, unknown>;
}

/**
 * Entity Memory - Projects, products, teams, systems
 * 
 * Half-life: 180 days (entities are fairly stable)
 * 
 * Examples:
 * - "Payment Service" with dependencies and warnings
 * - "Acme Corp" client with preferences and history
 * - "Platform Team" with members and responsibilities
 */
export interface EntityMemory extends BaseMemory {
  type: 'entity';

  /** Entity type classification */
  entityType: EntityType;
  /** Primary name */
  name: string;
  /** Alternative names / aliases */
  aliases?: string[];

  /** Flexible attributes */
  attributes: Record<string, unknown>;

  /** Relationships to other entities */
  relationships?: EntityRelationship[];

  /** Current status */
  status: 'active' | 'deprecated' | 'planned' | 'archived' | 'maintenance';

  /** Quick facts for context injection */
  keyFacts: string[];
  /** Warnings / things to watch out for */
  warnings?: string[];
  /** Contact / owner information */
  owner?: string;

  /** Domain classification */
  domain?: string;
}
