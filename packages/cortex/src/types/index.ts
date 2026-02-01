/**
 * Drift Cortex Type Definitions
 * 
 * Complete type system for the memory architecture including:
 * - 13 memory types:
 *   - Domain-agnostic: Core, Tribal, Procedural, Semantic, Episodic, Decision, Insight, Reference, Preference
 *   - Code-specific: PatternRationale, ConstraintOverride, DecisionContext, CodeSmell
 * - Bitemporal tracking (transaction time + valid time)
 * - Memory citations for code references
 * - Causal relationships (v2)
 * - Compression levels (v2)
 * - Session context (v2)
 * - Learning system (v2)
 * - Prediction system (v2)
 * - Generation context (v2)
 */

// Core memory types
export * from './memory.js';
export * from './core-memory.js';
export * from './tribal-memory.js';
export * from './procedural-memory.js';
export * from './semantic-memory.js';
export * from './episodic-memory.js';

// Domain-agnostic types (new)
export * from './decision-memory.js';
export * from './insight-memory.js';
export * from './reference-memory.js';
export * from './preference-memory.js';

// Code-specific types
export * from './pattern-rationale.js';
export * from './constraint-override.js';
export * from './decision-context.js';
export * from './code-smell.js';

// Supporting types
export * from './bitemporal.js';
export * from './citation.js';

// Cortex v2 types
export * from './causal.js';
export * from './compressed-memory.js';
export * from './session-context.js';
export * from './learning.js';
export * from './prediction.js';
export * from './generation-context.js';
