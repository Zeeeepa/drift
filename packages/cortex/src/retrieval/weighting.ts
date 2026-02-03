/**
 * Intent Weighting
 * 
 * Different intents weight different memory types differently.
 * For example, security audits weight tribal knowledge higher
 * because security gotchas are critical.
 */

import type { MemoryType } from '../types/index.js';
import type { Intent } from './engine.js';

/**
 * Weight matrix for intent-based memory weighting
 */
const WEIGHTS: Record<Intent, Record<MemoryType, number>> = {
  // ============================================
  // Domain-agnostic intents
  // ============================================
  create: {
    core: 1.0,
    tribal: 1.2,          // What should I know?
    procedural: 1.5,      // How do we do this?
    semantic: 1.2,
    episodic: 0.5,
    decision: 1.0,        // Past decisions that affect this
    insight: 1.3,         // Relevant insights
    reference: 1.0,       // Relevant references
    preference: 1.2,      // How we prefer to do things
    pattern_rationale: 1.0,
    constraint_override: 0.8,
    decision_context: 0.8,
    code_smell: 1.0,
    // Universal memory types
    agent_spawn: 1.5,     // Relevant agent configs
    entity: 1.3,          // Related entities
    goal: 1.2,            // Related goals
    feedback: 1.3,        // Past corrections
    workflow: 1.8,        // How to do this
    conversation: 0.5,    // Past discussions
    incident: 1.0,        // Past problems
    meeting: 0.3,         // Meeting context
    skill: 1.0,           // Relevant skills
    environment: 1.2,     // Environment context
  },
  investigate: {
    core: 1.0,
    tribal: 1.2,
    procedural: 0.8,
    semantic: 1.5,        // Consolidated knowledge
    episodic: 0.8,
    decision: 1.2,        // Why did we decide this?
    insight: 1.5,         // What have we learned?
    reference: 1.5,       // External knowledge
    preference: 0.5,
    pattern_rationale: 1.3,
    constraint_override: 0.8,
    decision_context: 1.3,
    code_smell: 0.8,
    // Universal memory types
    agent_spawn: 0.5,
    entity: 1.5,          // Entity knowledge
    goal: 1.0,
    feedback: 1.0,
    workflow: 0.8,
    conversation: 1.2,    // Past discussions
    incident: 1.5,        // Past incidents
    meeting: 0.8,
    skill: 1.2,
    environment: 1.0,
  },
  decide: {
    core: 1.0,
    tribal: 1.5,          // Institutional knowledge critical
    procedural: 0.8,
    semantic: 1.2,
    episodic: 0.5,
    decision: 2.0,        // Past decisions most relevant
    insight: 1.5,         // Insights inform decisions
    reference: 1.2,       // External references
    preference: 1.3,      // What do we prefer?
    pattern_rationale: 1.0,
    constraint_override: 1.0,
    decision_context: 1.5,
    code_smell: 0.5,
    // Universal memory types
    agent_spawn: 0.5,
    entity: 1.3,          // Entity context
    goal: 1.5,            // Goal alignment
    feedback: 1.2,        // Past corrections
    workflow: 0.8,
    conversation: 1.0,    // Past discussions
    incident: 1.5,        // Past problems
    meeting: 0.8,
    skill: 0.5,
    environment: 0.8,
  },
  recall: {
    core: 1.0,
    tribal: 1.2,
    procedural: 1.0,
    semantic: 1.5,        // Consolidated knowledge first
    episodic: 1.0,        // Recent interactions
    decision: 1.2,
    insight: 1.3,
    reference: 1.2,
    preference: 1.0,
    pattern_rationale: 1.0,
    constraint_override: 0.8,
    decision_context: 1.0,
    code_smell: 0.8,
    // Universal memory types
    agent_spawn: 1.0,
    entity: 1.2,
    goal: 1.0,
    feedback: 1.0,
    workflow: 1.0,
    conversation: 1.5,    // Past discussions
    incident: 1.2,
    meeting: 1.2,
    skill: 0.8,
    environment: 0.8,
  },
  learn: {
    core: 1.0,
    tribal: 1.0,
    procedural: 1.2,
    semantic: 1.0,
    episodic: 0.5,
    decision: 0.8,
    insight: 1.5,         // Related insights
    reference: 1.5,       // Related references
    preference: 0.8,
    pattern_rationale: 1.0,
    constraint_override: 0.5,
    decision_context: 0.8,
    code_smell: 1.0,
    // Universal memory types
    agent_spawn: 0.5,
    entity: 0.8,
    goal: 0.5,
    feedback: 1.5,        // Learning from corrections
    workflow: 1.2,        // How-to knowledge
    conversation: 0.5,
    incident: 1.3,        // Learning from incidents
    meeting: 0.3,
    skill: 1.8,           // Skill knowledge
    environment: 0.5,
  },
  // ============================================
  // Code-specific intents
  // ============================================
  add_feature: {
    core: 1.0,
    tribal: 1.0,
    procedural: 1.5,      // How to do things
    semantic: 1.2,        // What patterns exist
    episodic: 0.5,
    decision: 0.8,
    insight: 1.0,
    reference: 0.8,
    preference: 1.0,
    pattern_rationale: 1.3,
    constraint_override: 1.0,
    decision_context: 0.8,
    code_smell: 1.2,
    // Universal memory types
    agent_spawn: 0.8,
    entity: 1.0,
    goal: 0.8,
    feedback: 1.2,
    workflow: 1.2,
    conversation: 0.3,
    incident: 0.8,
    meeting: 0.2,
    skill: 0.8,
    environment: 1.0,
  },
  fix_bug: {
    core: 1.0,
    tribal: 1.5,          // Known issues
    procedural: 0.8,
    semantic: 1.2,
    episodic: 1.0,        // Recent context
    decision: 0.5,
    insight: 1.2,
    reference: 0.8,
    preference: 0.5,
    pattern_rationale: 1.0,
    constraint_override: 0.8,
    decision_context: 1.0,
    code_smell: 1.5,      // Past mistakes
    // Universal memory types
    agent_spawn: 0.5,
    entity: 1.0,
    goal: 0.5,
    feedback: 1.5,        // Past corrections
    workflow: 0.8,
    conversation: 0.5,
    incident: 1.8,        // Past incidents critical
    meeting: 0.2,
    skill: 0.8,
    environment: 1.2,
  },
  refactor: {
    core: 1.0,
    tribal: 1.2,
    procedural: 1.0,
    semantic: 1.3,
    episodic: 0.5,
    decision: 1.2,
    insight: 1.2,
    reference: 1.0,
    preference: 1.2,
    pattern_rationale: 1.5,  // Why patterns exist
    constraint_override: 1.2,
    decision_context: 1.5,   // Why decisions were made
    code_smell: 1.3,
    // Universal memory types
    agent_spawn: 0.5,
    entity: 0.8,
    goal: 0.8,
    feedback: 1.2,
    workflow: 1.0,
    conversation: 0.3,
    incident: 1.0,
    meeting: 0.2,
    skill: 1.0,
    environment: 0.8,
  },
  security_audit: {
    core: 1.0,
    tribal: 2.0,          // Security gotchas critical
    procedural: 1.0,
    semantic: 1.5,
    episodic: 0.3,
    decision: 1.0,
    insight: 1.5,
    reference: 1.5,
    preference: 0.5,
    pattern_rationale: 1.2,
    constraint_override: 1.5,  // Security overrides
    decision_context: 1.0,
    code_smell: 1.8,
    // Universal memory types
    agent_spawn: 0.5,
    entity: 1.2,
    goal: 0.5,
    feedback: 1.5,        // Security corrections
    workflow: 1.0,
    conversation: 0.3,
    incident: 2.0,        // Security incidents critical
    meeting: 0.2,
    skill: 1.0,
    environment: 1.5,     // Environment security
  },
  understand_code: {
    core: 1.0,
    tribal: 1.2,
    procedural: 0.8,
    semantic: 1.5,        // Consolidated knowledge
    episodic: 0.5,
    decision: 1.0,
    insight: 1.2,
    reference: 1.2,
    preference: 0.5,
    pattern_rationale: 1.5,
    constraint_override: 0.8,
    decision_context: 1.5,
    code_smell: 1.0,
    // Universal memory types
    agent_spawn: 0.5,
    entity: 1.2,
    goal: 0.5,
    feedback: 1.0,
    workflow: 0.8,
    conversation: 0.5,
    incident: 1.0,
    meeting: 0.3,
    skill: 1.2,
    environment: 1.0,
  },
  add_test: {
    core: 1.0,
    tribal: 1.2,
    procedural: 1.5,      // How to write tests
    semantic: 1.0,
    episodic: 0.5,
    decision: 0.5,
    insight: 1.0,
    reference: 1.0,
    preference: 1.2,
    pattern_rationale: 1.0,
    constraint_override: 0.8,
    decision_context: 0.8,
    code_smell: 1.3,
    // Universal memory types
    agent_spawn: 0.5,
    entity: 0.8,
    goal: 0.5,
    feedback: 1.2,
    workflow: 1.2,
    conversation: 0.3,
    incident: 1.0,
    meeting: 0.2,
    skill: 1.0,
    environment: 1.0,
  },
  // ============================================
  // New intents for universal memory types
  // ============================================
  spawn_agent: {
    core: 1.0,
    tribal: 0.8,
    procedural: 1.0,
    semantic: 0.8,
    episodic: 0.5,
    decision: 0.5,
    insight: 0.8,
    reference: 0.5,
    preference: 1.2,
    pattern_rationale: 0.5,
    constraint_override: 0.5,
    decision_context: 0.5,
    code_smell: 0.3,
    // Universal memory types
    agent_spawn: 2.0,     // Primary target
    entity: 0.8,
    goal: 0.5,
    feedback: 1.0,
    workflow: 1.0,
    conversation: 0.3,
    incident: 0.5,
    meeting: 0.2,
    skill: 0.8,
    environment: 0.5,
  },
  execute_workflow: {
    core: 1.0,
    tribal: 1.2,
    procedural: 1.5,
    semantic: 1.0,
    episodic: 0.5,
    decision: 0.8,
    insight: 1.0,
    reference: 1.0,
    preference: 1.0,
    pattern_rationale: 0.8,
    constraint_override: 0.8,
    decision_context: 0.8,
    code_smell: 0.5,
    // Universal memory types
    agent_spawn: 0.8,
    entity: 1.0,
    goal: 1.0,
    feedback: 1.2,
    workflow: 2.0,        // Primary target
    conversation: 0.5,
    incident: 1.0,        // Past problems with this workflow
    meeting: 0.3,
    skill: 1.0,
    environment: 1.5,
  },
  track_progress: {
    core: 1.0,
    tribal: 0.8,
    procedural: 0.5,
    semantic: 1.0,
    episodic: 0.8,
    decision: 1.0,
    insight: 1.0,
    reference: 0.5,
    preference: 0.5,
    pattern_rationale: 0.5,
    constraint_override: 0.5,
    decision_context: 1.0,
    code_smell: 0.3,
    // Universal memory types
    agent_spawn: 0.5,
    entity: 1.2,
    goal: 2.0,            // Primary target
    feedback: 0.8,
    workflow: 0.8,
    conversation: 1.2,
    incident: 1.0,
    meeting: 1.0,
    skill: 0.5,
    environment: 0.5,
  },
  diagnose_issue: {
    core: 1.0,
    tribal: 1.5,          // Known issues
    procedural: 1.0,
    semantic: 1.2,
    episodic: 1.0,
    decision: 0.8,
    insight: 1.3,
    reference: 1.0,
    preference: 0.3,
    pattern_rationale: 1.0,
    constraint_override: 0.8,
    decision_context: 1.0,
    code_smell: 1.5,
    // Universal memory types
    agent_spawn: 0.5,
    entity: 1.2,
    goal: 0.5,
    feedback: 1.0,
    workflow: 0.8,
    conversation: 0.8,
    incident: 2.0,        // Primary target
    meeting: 0.3,
    skill: 1.0,
    environment: 1.5,
  },
};

/**
 * Intent weighter
 */
export class IntentWeighter {
  /**
   * Get the weight for a memory type given an intent
   */
  getWeight(memoryType: MemoryType, intent: Intent): number {
    return WEIGHTS[intent]?.[memoryType] ?? 1.0;
  }

  /**
   * Get all weights for an intent
   */
  getWeightsForIntent(intent: Intent): Record<MemoryType, number> {
    return WEIGHTS[intent] ?? {};
  }
}
