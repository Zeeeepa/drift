/**
 * Base Memory Interface
 * 
 * All memory types extend this base interface which provides:
 * - Unique identification
 * - Type discrimination
 * - Bitemporal tracking
 * - Confidence and importance
 * - Access tracking
 * - Linking to Drift entities
 * - Archival support
 */

import type { TransactionTime, ValidTime } from './bitemporal.js';

/**
 * All supported memory types
 */
export type MemoryType =
  // Domain-agnostic types
  | 'core'
  | 'tribal'
  | 'procedural'
  | 'semantic'
  | 'episodic'
  | 'decision'           // Standalone decisions (business, personal, etc.)
  | 'insight'            // Learned insights/observations
  | 'reference'          // External references/citations
  | 'preference'         // User/team preferences
  // Code-specific types
  | 'pattern_rationale'
  | 'constraint_override'
  | 'decision_context'   // Code decision context (linked to ADRs)
  | 'code_smell'
  // Universal memory types (v2)
  | 'agent_spawn'        // Reusable agent configurations
  | 'entity'             // Projects, products, teams, systems
  | 'goal'               // Objectives with progress tracking
  | 'feedback'           // Corrections and learning signals
  | 'workflow'           // Step-by-step processes
  | 'conversation'       // Summarized past discussions
  | 'incident'           // Postmortems and lessons learned
  | 'meeting'            // Meeting notes and action items
  | 'skill'              // Knowledge domains and proficiency
  | 'environment';       // System/environment configurations

/**
 * Importance levels for memories
 */
export type Importance = 'low' | 'normal' | 'high' | 'critical';

/**
 * Base interface for all memory types
 */
export interface BaseMemory {
  /** Unique identifier */
  id: string;
  /** Discriminator for memory type */
  type: MemoryType;

  // Bitemporal tracking
  /** When we learned this */
  transactionTime: TransactionTime;
  /** When this was/is true */
  validTime: ValidTime;

  // Confidence & importance
  /** Confidence score 0.0 - 1.0 */
  confidence: number;
  /** Importance level */
  importance: Importance;

  // Access tracking
  /** ISO timestamp of last access */
  lastAccessed?: string;
  /** Number of times accessed */
  accessCount: number;

  // Compression levels
  /** Short summary (~20 tokens) */
  summary: string;

  // Linking to Drift entities
  /** Pattern IDs this memory relates to */
  linkedPatterns?: string[];
  /** Constraint IDs this memory relates to */
  linkedConstraints?: string[];
  /** File paths this memory relates to */
  linkedFiles?: string[];
  /** Function IDs from call graph */
  linkedFunctions?: string[];

  // Metadata
  /** ISO timestamp of creation */
  createdAt: string;
  /** ISO timestamp of last update */
  updatedAt: string;
  /** Who created this memory */
  createdBy?: string;
  /** Tags for categorization */
  tags?: string[];

  // Archival
  /** Whether this memory is archived */
  archived?: boolean;
  /** Reason for archival */
  archiveReason?: string;
  /** ID of memory that supersedes this one */
  supersededBy?: string;
  /** ID of memory this one supersedes */
  supersedes?: string;

  // Validation
  /** ISO timestamp of last validation */
  lastValidated?: string;
}

/**
 * Union type of all memory types
 */
export type Memory =
  // Domain-agnostic
  | import('./core-memory.js').CoreMemory
  | import('./tribal-memory.js').TribalMemory
  | import('./procedural-memory.js').ProceduralMemory
  | import('./semantic-memory.js').SemanticMemory
  | import('./episodic-memory.js').EpisodicMemory
  | import('./decision-memory.js').DecisionMemory
  | import('./insight-memory.js').InsightMemory
  | import('./reference-memory.js').ReferenceMemory
  | import('./preference-memory.js').PreferenceMemory
  // Code-specific
  | import('./pattern-rationale.js').PatternRationaleMemory
  | import('./constraint-override.js').ConstraintOverrideMemory
  | import('./decision-context.js').DecisionContextMemory
  | import('./code-smell.js').CodeSmellMemory
  // Universal memory types (v2)
  | import('./agent-spawn-memory.js').AgentSpawnMemory
  | import('./entity-memory.js').EntityMemory
  | import('./goal-memory.js').GoalMemory
  | import('./feedback-memory.js').FeedbackMemory
  | import('./workflow-memory.js').WorkflowMemory
  | import('./conversation-memory.js').ConversationMemory
  | import('./incident-memory.js').IncidentMemory
  | import('./meeting-memory.js').MeetingMemory
  | import('./skill-memory.js').SkillMemory
  | import('./environment-memory.js').EnvironmentMemory;

/**
 * Memory summary for list views
 */
export interface MemorySummary {
  id: string;
  type: MemoryType;
  summary: string;
  confidence: number;
  importance: Importance;
  createdAt: string;
  lastAccessed?: string;
  accessCount: number;
}

/**
 * Query options for memory searches
 */
export interface MemoryQuery {
  /** Filter by memory types */
  types?: MemoryType[];
  /** Filter by topics (for tribal, semantic) */
  topics?: string[];
  /** Filter by pattern IDs */
  patterns?: string[];
  /** Filter by constraint IDs */
  constraints?: string[];
  /** Filter by decision IDs */
  decisions?: string[];
  /** Filter by file paths */
  files?: string[];
  /** Filter by function IDs */
  functions?: string[];
  /** Minimum confidence */
  minConfidence?: number;
  /** Maximum confidence */
  maxConfidence?: number;
  /** Minimum access count */
  minAccessCount?: number;
  /** Filter by importance */
  importance?: Importance[];
  /** Include archived memories */
  includeArchived?: boolean;
  /** Filter by tags */
  tags?: string[];
  /** Minimum date (createdAt) */
  minDate?: string;
  /** Maximum date (createdAt) */
  maxDate?: string;
  /** Consolidation status (for episodic) */
  consolidationStatus?: 'pending' | 'consolidated' | 'pruned';
  /** Order by field */
  orderBy?: string;
  /** Order direction */
  orderDir?: 'asc' | 'desc';
  /** Maximum results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}
