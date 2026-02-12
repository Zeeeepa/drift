/**
 * Half-Lives Configuration
 * 
 * Different memory types have different half-lives.
 * Core memories never decay, episodic memories decay quickly.
 */

import type { MemoryType } from '../types/index.js';

/**
 * Half-lives in days for different memory types
 */
export const HALF_LIVES: Record<MemoryType, number> = {
  // Domain-agnostic
  core: Infinity,           // Never decays
  tribal: 365,              // Institutional knowledge is precious
  procedural: 180,          // How-to knowledge is stable
  semantic: 90,             // Consolidated knowledge persists
  episodic: 7,              // Specific interactions fade quickly
  decision: 180,            // Decisions are important, persist
  insight: 90,              // Insights need reinforcement
  reference: 60,            // References can become outdated
  preference: 120,          // Preferences are fairly stable
  // Code-specific
  pattern_rationale: 180,   // Pattern context is stable
  constraint_override: 90,  // Overrides need periodic review
  decision_context: 180,    // Decision context is stable
  code_smell: 90,           // Smell patterns need validation
  // Universal memory types (v2)
  agent_spawn: 365,         // Agent configs are stable
  entity: 180,              // Entities are fairly stable
  goal: 90,                 // Goals need regular review
  feedback: 120,            // Feedback needs reinforcement
  workflow: 180,            // Workflows are stable
  conversation: 30,         // Conversations fade quickly
  incident: 365,            // Incidents are critical knowledge
  meeting: 60,              // Meeting details fade
  skill: 180,               // Skills are stable
  environment: 90,          // Environments change frequently
};

/**
 * Minimum confidence before archival
 */
export const MIN_CONFIDENCE: Record<MemoryType, number> = {
  // Domain-agnostic
  core: 0.0,                // Never archive
  tribal: 0.2,
  procedural: 0.3,
  semantic: 0.3,
  episodic: 0.1,
  decision: 0.2,
  insight: 0.3,
  reference: 0.2,
  preference: 0.2,
  // Code-specific
  pattern_rationale: 0.3,
  constraint_override: 0.2,
  decision_context: 0.3,
  code_smell: 0.2,
  // Universal memory types (v2)
  agent_spawn: 0.3,         // Keep agent configs
  entity: 0.2,              // Keep entity knowledge
  goal: 0.2,                // Archive completed goals
  feedback: 0.2,            // Keep validated feedback
  workflow: 0.3,            // Keep workflows
  conversation: 0.1,        // Let conversations fade
  incident: 0.2,            // Keep incident knowledge
  meeting: 0.1,             // Let meeting details fade
  skill: 0.2,               // Keep skill knowledge
  environment: 0.2,         // Keep environment info
};
