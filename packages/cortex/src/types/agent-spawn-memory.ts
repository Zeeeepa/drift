/**
 * Agent Spawn Memory Type
 * 
 * Stores reusable agent configurations that can be instantiated on demand.
 * Enables "spawn my code reviewer" or "start security auditor" workflows.
 */

import type { BaseMemory, MemoryType } from './memory.js';

/**
 * Agent Spawn Memory - Reusable agent configurations
 * 
 * Half-life: 365 days (agent configs are stable)
 * 
 * Examples:
 * - "Code Reviewer" agent with specific review criteria
 * - "Security Auditor" with OWASP checklist
 * - "Documentation Writer" with style guide
 */
export interface AgentSpawnMemory extends BaseMemory {
  type: 'agent_spawn';

  /** Agent display name */
  name: string;
  /** What this agent does */
  description: string;
  /** Unique slug for invocation (e.g., 'code-reviewer') */
  slug: string;

  /** System prompt / personality */
  systemPrompt: string;
  /** Tools this agent can use */
  tools: string[];
  /** Constraints / things it cannot do */
  constraints?: string[];

  /** Trigger phrases that invoke this agent */
  triggerPatterns: string[];
  /** Auto-spawn on trigger match? */
  autoSpawn: boolean;

  /** Memory types to inherit when spawned */
  inheritMemoryTypes?: MemoryType[];
  /** How many related memories to pass */
  inheritDepth?: number;
  /** Specific memory IDs to always include */
  pinnedMemories?: string[];

  /** Performance tracking */
  stats?: {
    invocationCount: number;
    successRate: number;
    avgDurationMs: number;
    lastInvoked?: string;
  };

  /** Version for config evolution */
  version: string;
}
