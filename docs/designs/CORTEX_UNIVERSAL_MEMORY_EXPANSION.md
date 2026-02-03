# Cortex Universal Memory Expansion

> **Design Document v1.0**  
> **Status:** Approved for Implementation  
> **Author:** Drift Team  
> **Date:** February 2026  
> **Depends On:** CORTEX_STANDALONE_DESIGN.md

---

## Executive Summary

Expand Cortex from a code-focused memory system into a **universal persistent memory layer** for AI agents. This document defines 10 new memory types that transform Cortex into a complete cognitive architecture supporting business decisions, agent orchestration, goal tracking, workflow automation, incident management, and continuous learning from feedback.

**Key Insight:** The existing Cortex infrastructure (storage, retrieval, consolidation, decay, validation, embeddings, causal graphs) is 100% domain-agnostic. Adding new memory types requires only:
1. Type definitions (~30 lines each)
2. Half-life configuration (1 line)
3. Intent weight mappings (1 object per intent)
4. Summary generation (1 switch case)

**Estimated Effort:** 2-3 days for all 10 new memory types.

---

## Research Foundation

This design incorporates learnings from state-of-the-art AI memory research:

### Academic Foundations

| Source | Key Insight | How We Apply It |
|--------|-------------|-----------------|
| **Mem0 (arXiv 2504.19413)** | Extraction + consolidation paradigm outperforms RAG | Our consolidation engine already implements this |
| **MAGMA (arXiv 2601.03236)** | Multi-graph architecture (semantic, temporal, causal, entity) | Our causal graph system + bitemporal storage |
| **MMAG (arXiv 2512.01710)** | Five-layer memory: conversational, long-term, episodic, sensory, working | Maps to our type hierarchy |
| **MaRS (arXiv 2512.12856)** | Provenance-tracked nodes with typed indices | Our BaseMemory already has this |

### Industry Best Practices

| Practice | Source | Our Implementation |
|----------|--------|-------------------|
| **Intelligent Decay** | Cognitive science | Half-life based decay per memory type |
| **Memory Consolidation** | Sleep research | Episodic → Semantic compression |
| **Contradiction Detection** | Enterprise governance | ValidationEngine with ContradictionDetector |
| **Bitemporal Tracking** | Financial systems | Transaction time + valid time on all memories |
| **Graph-based Relationships** | Knowledge graphs | Causal graph + relationship storage |

### Security Considerations

| Threat | Mitigation |
|--------|------------|
| **Memory Poisoning** | Confidence scoring, validation engine, provenance tracking |
| **Context Hijacking** | Bitemporal queries, archival system, supersession chains |
| **Privacy Leakage** | Privacy sanitizer, scope-based access, tag filtering |

---

## Goals

1. **Zero Breaking Changes** - Existing Drift users unaffected
2. **Minimal Implementation** - Leverage existing infrastructure
3. **Enterprise-Grade** - Security, governance, auditability built-in
4. **Agent-First Design** - Enable autonomous agent workflows
5. **Human-AI Collaboration** - Support team knowledge management
6. **Continuous Learning** - Agents improve from feedback over time

---

## Architecture Validation

### Existing Infrastructure (No Changes Required)

| Component | Location | Status |
|-----------|----------|--------|
| SQLite Storage | `storage/sqlite/` | ✅ Type-agnostic JSON storage |
| Vector Search | `storage/sqlite/` | ✅ sqlite-vec integration |
| Embedding Providers | `embeddings/` | ✅ Local/OpenAI/Ollama |
| Retrieval Engine | `retrieval/engine.ts` | ✅ Intent-aware, budget-managed |
| Consolidation | `consolidation/` | ✅ Sleep-inspired compression |
| Decay System | `decay/` | ✅ Half-life based |
| Validation | `validation/` | ✅ Pluggable validators |
| Causal Graphs | `causal/` | ✅ Relationship tracking |
| Learning System | `learning/` | ✅ Fact/preference extraction |
| Privacy | `privacy/` | ✅ Sanitization + validation |

### Files Requiring Modification

| File | Change | Lines |
|------|--------|-------|
| `types/memory.ts` | Add new types to MemoryType union | ~10 |
| `types/index.ts` | Export new type files | ~10 |
| `decay/half-lives.ts` | Add half-life values | ~10 |
| `retrieval/weighting.ts` | Add intent weights | ~60 |
| `cortex.ts` | Add embedding text extraction | ~20 |
| `storage/sqlite/storage.ts` | Add summary generation | ~20 |

**Total: ~130 lines of modifications + ~300 lines of new type definitions**

---

## New Memory Types

### Type Hierarchy

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BaseMemory                                   │
│  (id, type, bitemporal, confidence, importance, summary, links...)  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
   ┌────▼────┐               ┌──────▼──────┐             ┌──────▼──────┐
   │ EXISTING │               │    NEW      │             │   CODE      │
   │ (9 types)│               │ (10 types)  │             │ (4 types)   │
   └──────────┘               └─────────────┘             └─────────────┘
   • core                     • agent_spawn               • pattern_rationale
   • tribal                   • entity                    • constraint_override
   • procedural               • goal                      • decision_context
   • semantic                 • workflow                  • code_smell
   • episodic                 • conversation
   • decision                 • feedback
   • insight                  • incident
   • reference                • meeting
   • preference               • skill
                              • environment
```

### Memory Type Summary

| Type | Purpose | Half-Life | Priority |
|------|---------|-----------|----------|
| `agent_spawn` | Reusable agent configurations | 365 days | P0 |
| `entity` | Projects, products, teams, systems | 180 days | P0 |
| `goal` | Objectives with progress tracking | 90 days | P0 |
| `workflow` | Step-by-step processes | 180 days | P1 |
| `conversation` | Summarized past discussions | 30 days | P1 |
| `feedback` | Corrections and learning signals | 120 days | P0 |
| `incident` | Postmortems and lessons learned | 365 days | P1 |
| `meeting` | Meeting notes and action items | 60 days | P2 |
| `skill` | Knowledge domains and proficiency | 180 days | P2 |
| `environment` | System/environment configurations | 90 days | P2 |

---

## Type Definitions

### 1. Agent Spawn Memory (P0)

**Purpose:** Store reusable agent configurations for "spawn my X" workflows.

```typescript
// drift/packages/cortex/src/types/agent-spawn-memory.ts

import type { BaseMemory } from './memory.js';

/**
 * Agent Spawn Memory
 * 
 * Stores reusable agent configurations that can be instantiated on demand.
 * Enables "spawn my code reviewer" or "start security auditor" workflows.
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
  /** Unique slug for invocation */
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
```

### 2. Entity Memory (P0)

**Purpose:** Track projects, products, teams, clients, and systems as first-class entities.

```typescript
// drift/packages/cortex/src/types/entity-memory.ts

import type { BaseMemory } from './memory.js';

/**
 * Entity Memory
 * 
 * Represents a named entity (project, product, team, client, system)
 * with attributes, relationships, and contextual knowledge.
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
  entityType: 'project' | 'product' | 'team' | 'client' | 'vendor' | 'system' | 'service' | 'other';
  /** Primary name */
  name: string;
  /** Alternative names / aliases */
  aliases?: string[];

  /** Flexible attributes */
  attributes: Record<string, unknown>;

  /** Relationships to other entities */
  relationships?: Array<{
    targetEntityId: string;
    targetEntityName?: string;
    relationshipType: 'owns' | 'depends_on' | 'integrates_with' | 'managed_by' | 'related_to';
    metadata?: Record<string, unknown>;
  }>;

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
```

### 3. Goal Memory (P0)

**Purpose:** Track objectives with hierarchical structure, progress, and blockers.

```typescript
// drift/packages/cortex/src/types/goal-memory.ts

import type { BaseMemory } from './memory.js';

/**
 * Goal Memory
 * 
 * Tracks objectives with progress, success criteria, and blockers.
 * Supports hierarchical goal structures (OKRs, epics, milestones).
 * 
 * Half-life: 90 days (goals need regular review)
 * 
 * Examples:
 * - "Launch v2.0 by Q2" with sub-goals and blockers
 * - "Reduce API latency to <100ms" with success criteria
 * - "Hire 3 engineers" with progress tracking
 */
export interface GoalMemory extends BaseMemory {
  type: 'goal';

  /** Goal title */
  title: string;
  /** Detailed description */
  description: string;

  /** Hierarchy */
  parentGoalId?: string;
  childGoalIds?: string[];

  /** Status tracking */
  status: 'active' | 'achieved' | 'abandoned' | 'blocked' | 'at_risk';
  /** Progress percentage (0-100) */
  progress: number;

  /** Success criteria */
  successCriteria: Array<{
    criterion: string;
    met: boolean;
    evidence?: string;
    metAt?: string;
  }>;

  /** Timeline */
  targetDate?: string;
  achievedDate?: string;
  createdDate: string;

  /** Blockers */
  blockers?: Array<{
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    createdAt: string;
    resolvedAt?: string;
    resolution?: string;
  }>;

  /** Owner / assignee */
  owner?: string;
  /** Stakeholders */
  stakeholders?: string[];

  /** Lessons learned (populated on completion) */
  lessonsLearned?: string[];

  /** Domain classification */
  domain?: string;
}
```

### 4. Feedback Memory (P0)

**Purpose:** Learn from corrections to improve agent behavior over time.

```typescript
// drift/packages/cortex/src/types/feedback-memory.ts

import type { BaseMemory } from './memory.js';

/**
 * Feedback Memory
 * 
 * Captures corrections and learning signals from user interactions.
 * Enables agents to learn from mistakes and improve over time.
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
  feedbackType: 
    | 'factual_error'      // Wrong information
    | 'style_preference'   // Communication style
    | 'missing_context'    // Didn't consider something
    | 'wrong_approach'     // Bad solution strategy
    | 'too_verbose'        // Response too long
    | 'too_brief'          // Response too short
    | 'incorrect_tool'     // Used wrong tool/method
    | 'security_concern'   // Security issue
    | 'other';

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
```

### 5. Workflow Memory (P1)

**Purpose:** Store step-by-step processes for guided execution.

```typescript
// drift/packages/cortex/src/types/workflow-memory.ts

import type { BaseMemory } from './memory.js';

/**
 * Workflow Memory
 * 
 * Stores step-by-step processes that can be executed with guidance.
 * Supports variations based on conditions.
 * 
 * Half-life: 180 days (workflows are fairly stable)
 * 
 * Examples:
 * - "Deploy to production" with pre-flight checks
 * - "Onboard new team member" with checklist
 * - "Release new version" with rollback steps
 */
export interface WorkflowMemory extends BaseMemory {
  type: 'workflow';

  /** Workflow name */
  name: string;
  /** Description */
  description: string;
  /** Unique slug for invocation */
  slug: string;

  /** Ordered steps */
  steps: Array<{
    order: number;
    name: string;
    description: string;
    /** Tools/commands used in this step */
    tools?: string[];
    /** Typical duration */
    estimatedDuration?: string;
    /** Tips and warnings */
    tips?: string[];
    /** Required before proceeding */
    required: boolean;
    /** Verification criteria */
    verification?: string;
  }>;

  /** Phrases that trigger this workflow */
  triggerPhrases: string[];

  /** Conditional variations */
  variations?: Array<{
    condition: string;
    description: string;
    stepOverrides: Record<number, Partial<WorkflowMemory['steps'][0]>>;
    additionalSteps?: WorkflowMemory['steps'];
  }>;

  /** Execution history */
  stats?: {
    executionCount: number;
    avgDuration?: string;
    lastExecuted?: string;
    successRate: number;
  };

  /** Prerequisites */
  prerequisites?: string[];
  /** Domain classification */
  domain?: string;
}
```

### 6. Conversation Memory (P1)

**Purpose:** Summarize past discussions for searchable history.

```typescript
// drift/packages/cortex/src/types/conversation-memory.ts

import type { BaseMemory } from './memory.js';

/**
 * Conversation Memory
 * 
 * Stores summarized conversations with key decisions and action items.
 * Enables "what did we discuss about X" queries.
 * 
 * Half-life: 30 days (conversations fade quickly unless reinforced)
 * 
 * Examples:
 * - "API redesign discussion" with decisions made
 * - "Client requirements call" with action items
 * - "Architecture review" with concerns raised
 */
export interface ConversationMemory extends BaseMemory {
  type: 'conversation';

  /** Auto-generated or user-provided title */
  title: string;
  /** Participants (user IDs, names, or agent IDs) */
  participants: string[];

  /** Compressed summary */
  conversationSummary: string;
  /** Key decisions made */
  keyDecisions?: string[];
  /** Topics discussed */
  topics?: string[];

  /** Action items */
  actionItems?: Array<{
    item: string;
    assignee?: string;
    status: 'pending' | 'in_progress' | 'done' | 'cancelled';
    dueDate?: string;
    completedAt?: string;
  }>;

  /** Open questions / unresolved items */
  openQuestions?: string[];

  /** Related conversations */
  relatedConversations?: string[];
  /** Related entities */
  relatedEntities?: string[];

  /** Timeline */
  startedAt: string;
  endedAt?: string;
  /** Approximate message count */
  messageCount?: number;

  /** Domain classification */
  domain?: string;
}
```

### 7. Incident Memory (P1)

**Purpose:** Store postmortems and lessons learned from incidents.

```typescript
// drift/packages/cortex/src/types/incident-memory.ts

import type { BaseMemory } from './memory.js';

/**
 * Incident Memory
 * 
 * Stores incident postmortems with root cause analysis and prevention measures.
 * Enables proactive warnings when similar situations arise.
 * 
 * Half-life: 365 days (incidents are critical institutional knowledge)
 * 
 * Examples:
 * - "Production outage 2024-01-15" with root cause
 * - "Data migration failure" with rollback steps
 * - "Security breach attempt" with detection methods
 */
export interface IncidentMemory extends BaseMemory {
  type: 'incident';

  /** Incident title */
  title: string;
  /** Severity classification */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Incident type */
  incidentType?: 'outage' | 'security' | 'data_loss' | 'performance' | 'integration' | 'other';

  /** Timeline */
  detectedAt: string;
  resolvedAt?: string;
  duration?: string;

  /** Impact assessment */
  impact: string;
  affectedSystems: string[];
  affectedUsers?: string;
  businessImpact?: string;

  /** Root cause analysis */
  rootCause?: string;
  contributingFactors?: string[];
  /** How it was detected */
  detectionMethod?: string;

  /** Resolution */
  resolution: string;
  workarounds?: string[];
  /** Who resolved it */
  resolvedBy?: string;

  /** Prevention */
  actionItems?: Array<{
    item: string;
    owner?: string;
    status: 'pending' | 'in_progress' | 'done';
    dueDate?: string;
    completedAt?: string;
  }>;

  /** Lessons learned */
  lessonsLearned: string[];
  /** Prevention measures implemented */
  preventionMeasures?: string[];

  /** Warning triggers - conditions that should surface this incident */
  warningTriggers?: string[];

  /** Related incidents */
  relatedIncidents?: string[];
}
```

### 8. Meeting Memory (P2)

**Purpose:** Store meeting notes with decisions and action items.

```typescript
// drift/packages/cortex/src/types/meeting-memory.ts

import type { BaseMemory } from './memory.js';

/**
 * Meeting Memory
 * 
 * Stores meeting summaries with agenda, decisions, and action items.
 * Enables "what did we decide in the last planning meeting" queries.
 * 
 * Half-life: 60 days (meeting details fade, decisions persist elsewhere)
 * 
 * Examples:
 * - "Sprint Planning 2024-W03" with committed items
 * - "1:1 with Sarah" with feedback discussed
 * - "Architecture Review" with decisions made
 */
export interface MeetingMemory extends BaseMemory {
  type: 'meeting';

  /** Meeting title */
  title: string;
  /** Meeting type */
  meetingType: 'standup' | 'planning' | 'retro' | 'review' | '1on1' | 'all_hands' | 'workshop' | 'other';

  /** When */
  scheduledAt: string;
  duration?: string;

  /** Who */
  participants: string[];
  organizer?: string;

  /** Content */
  agenda?: string[];
  summary: string;

  /** Outcomes */
  decisions?: string[];
  actionItems?: Array<{
    item: string;
    assignee?: string;
    dueDate?: string;
    status: 'pending' | 'done' | 'cancelled';
  }>;

  /** Follow-up */
  nextMeeting?: string;
  openQuestions?: string[];

  /** Links */
  relatedMeetings?: string[];
  relatedGoals?: string[];

  /** Domain classification */
  domain?: string;
}
```

### 9. Skill Memory (P2)

**Purpose:** Track knowledge domains and proficiency levels.

```typescript
// drift/packages/cortex/src/types/skill-memory.ts

import type { BaseMemory } from './memory.js';

/**
 * Skill Memory
 * 
 * Tracks knowledge domains with proficiency levels and learning resources.
 * Enables tailored explanations and learning path suggestions.
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
  proficiencyLevel: 'learning' | 'beginner' | 'competent' | 'proficient' | 'expert';

  /** Knowledge content */
  keyPrinciples?: string[];
  commonPatterns?: string[];
  antiPatterns?: string[];
  gotchas?: string[];

  /** Learning resources */
  resources?: Array<{
    title: string;
    url?: string;
    type: 'documentation' | 'tutorial' | 'reference' | 'example' | 'video' | 'book';
    recommended: boolean;
  }>;

  /** Learning path */
  prerequisites?: string[];
  nextToLearn?: string[];

  /** Related skills */
  relatedSkills?: string[];

  /** Scope */
  scope: 'personal' | 'team' | 'organization';
}
```

### 10. Environment Memory (P2)

**Purpose:** Store environment/system configurations and access information.

```typescript
// drift/packages/cortex/src/types/environment-memory.ts

import type { BaseMemory } from './memory.js';

/**
 * Environment Memory
 * 
 * Stores environment configurations, access instructions, and warnings.
 * Enables context-aware environment interactions.
 * 
 * Half-life: 90 days (environments change frequently)
 * 
 * Examples:
 * - "Production" with access restrictions and warnings
 * - "Staging" with test data information
 * - "Local Development" with setup instructions
 */
export interface EnvironmentMemory extends BaseMemory {
  type: 'environment';

  /** Environment name */
  name: string;
  /** Environment type */
  environmentType: 'production' | 'staging' | 'development' | 'testing' | 'sandbox' | 'other';

  /** Configuration (flexible) */
  config: Record<string, unknown>;

  /** Access information */
  accessInstructions?: string;
  credentials?: {
    type: string;
    location: string;  // Where to find them, NOT the actual credentials
    rotationSchedule?: string;
  };

  /** Warnings and restrictions */
  warnings: string[];
  restrictions?: string[];

  /** Dependencies */
  dependsOn?: string[];
  usedBy?: string[];

  /** URLs / endpoints */
  endpoints?: Record<string, string>;

  /** Health / status */
  healthCheckUrl?: string;
  lastVerified?: string;
  status?: 'healthy' | 'degraded' | 'down' | 'unknown';

  /** Owner */
  owner?: string;
}
```

---

## Configuration Updates

### Half-Lives (decay/half-lives.ts)

```typescript
export const HALF_LIVES: Record<MemoryType, number> = {
  // Existing types (unchanged)
  core: Infinity,
  tribal: 365,
  procedural: 180,
  semantic: 90,
  episodic: 7,
  decision: 180,
  insight: 90,
  reference: 60,
  preference: 120,
  pattern_rationale: 180,
  constraint_override: 90,
  decision_context: 180,
  code_smell: 90,

  // New types
  agent_spawn: 365,      // Agent configs are stable
  entity: 180,           // Entities are fairly stable
  goal: 90,              // Goals need regular review
  workflow: 180,         // Workflows are stable
  conversation: 30,      // Conversations fade quickly
  feedback: 120,         // Feedback needs reinforcement
  incident: 365,         // Incidents are critical knowledge
  meeting: 60,           // Meeting details fade
  skill: 180,            // Skills are stable
  environment: 90,       // Environments change frequently
};
```

### Minimum Confidence (decay/half-lives.ts)

```typescript
export const MIN_CONFIDENCE: Record<MemoryType, number> = {
  // Existing (unchanged)
  core: 0.0,
  tribal: 0.2,
  procedural: 0.3,
  semantic: 0.3,
  episodic: 0.1,
  decision: 0.2,
  insight: 0.3,
  reference: 0.2,
  preference: 0.2,
  pattern_rationale: 0.3,
  constraint_override: 0.2,
  decision_context: 0.3,
  code_smell: 0.2,

  // New types
  agent_spawn: 0.3,      // Keep agent configs
  entity: 0.2,           // Keep entity knowledge
  goal: 0.2,             // Archive completed goals
  workflow: 0.3,         // Keep workflows
  conversation: 0.1,     // Let conversations fade
  feedback: 0.2,         // Keep validated feedback
  incident: 0.2,         // Keep incident knowledge
  meeting: 0.1,          // Let meeting details fade
  skill: 0.2,            // Keep skill knowledge
  environment: 0.2,      // Keep environment info
};
```

### Intent Weights (retrieval/weighting.ts)

```typescript
// Add weights for new types to each intent

const WEIGHTS: Record<Intent, Record<MemoryType, number>> = {
  // Domain-agnostic intents
  create: {
    // ... existing weights ...
    agent_spawn: 1.5,    // Relevant agent configs
    entity: 1.3,         // Related entities
    goal: 1.2,           // Related goals
    workflow: 1.8,       // How to do this
    conversation: 0.5,   // Past discussions
    feedback: 1.3,       // Past corrections
    incident: 1.0,       // Past problems
    meeting: 0.3,        // Meeting context
    skill: 1.0,          // Relevant skills
    environment: 1.2,    // Environment context
  },
  
  investigate: {
    // ... existing weights ...
    agent_spawn: 0.5,
    entity: 1.5,         // Entity knowledge
    goal: 1.0,
    workflow: 0.8,
    conversation: 1.2,   // Past discussions
    feedback: 1.0,
    incident: 1.5,       // Past incidents
    meeting: 0.8,
    skill: 1.2,
    environment: 1.0,
  },
  
  decide: {
    // ... existing weights ...
    agent_spawn: 0.5,
    entity: 1.3,         // Entity context
    goal: 1.5,           // Goal alignment
    workflow: 0.8,
    conversation: 1.0,   // Past discussions
    feedback: 1.2,       // Past corrections
    incident: 1.5,       // Past problems
    meeting: 0.8,
    skill: 0.5,
    environment: 0.8,
  },
  
  recall: {
    // ... existing weights ...
    agent_spawn: 1.0,
    entity: 1.2,
    goal: 1.0,
    workflow: 1.0,
    conversation: 1.5,   // Past discussions
    feedback: 1.0,
    incident: 1.2,
    meeting: 1.2,
    skill: 0.8,
    environment: 0.8,
  },
  
  learn: {
    // ... existing weights ...
    agent_spawn: 0.5,
    entity: 0.8,
    goal: 0.5,
    workflow: 1.2,       // How-to knowledge
    conversation: 0.5,
    feedback: 1.5,       // Learning from corrections
    incident: 1.3,       // Learning from incidents
    meeting: 0.3,
    skill: 1.8,          // Skill knowledge
    environment: 0.5,
  },

  // Code-specific intents (add new types with lower weights)
  add_feature: {
    // ... existing weights ...
    agent_spawn: 0.8,
    entity: 1.0,
    goal: 0.8,
    workflow: 1.2,
    conversation: 0.3,
    feedback: 1.2,
    incident: 0.8,
    meeting: 0.2,
    skill: 0.8,
    environment: 1.0,
  },
  
  // ... similar for fix_bug, refactor, security_audit, understand_code, add_test
};
```

---

## New Intents

Add new intents for the expanded memory types:

```typescript
// retrieval/engine.ts

export type Intent =
  // Existing domain-agnostic
  | 'create'
  | 'investigate'
  | 'decide'
  | 'recall'
  | 'learn'
  // Existing code-specific
  | 'add_feature'
  | 'fix_bug'
  | 'refactor'
  | 'security_audit'
  | 'understand_code'
  | 'add_test'
  // NEW: Agent orchestration
  | 'spawn_agent'        // Looking for agent configs
  | 'execute_workflow'   // Running a workflow
  // NEW: Goal tracking
  | 'track_progress'     // Checking goal progress
  | 'identify_blockers'  // Finding blockers
  // NEW: Incident response
  | 'diagnose_issue'     // Investigating a problem
  | 'prevent_incident';  // Proactive prevention
```

### New Intent Weights

```typescript
spawn_agent: {
  agent_spawn: 2.0,      // Primary target
  entity: 0.8,
  workflow: 1.0,
  preference: 1.2,
  // ... others low
},

execute_workflow: {
  workflow: 2.0,         // Primary target
  procedural: 1.5,
  entity: 1.0,
  environment: 1.5,
  incident: 1.0,         // Past problems with this workflow
  // ... others low
},

track_progress: {
  goal: 2.0,             // Primary target
  conversation: 1.2,
  meeting: 1.0,
  entity: 0.8,
  // ... others low
},

diagnose_issue: {
  incident: 2.0,         // Primary target
  tribal: 1.5,           // Known issues
  entity: 1.2,
  environment: 1.5,
  feedback: 1.0,
  // ... others low
},
```

---

## Embedding Text Extraction

Update `cortex.ts` to generate embedding text for new types:

```typescript
private getEmbeddingText(memory: Memory): string | null {
  switch (memory.type) {
    // Existing cases...
    
    // New types
    case 'agent_spawn':
      return `Agent: ${memory.name}. ${memory.description}. Triggers: ${memory.triggerPatterns.join(', ')}`;
    
    case 'entity':
      return `${memory.entityType}: ${memory.name}. ${memory.keyFacts.join('. ')}`;
    
    case 'goal':
      return `Goal: ${memory.title}. ${memory.description}. Status: ${memory.status}`;
    
    case 'workflow':
      return `Workflow: ${memory.name}. ${memory.description}. Steps: ${memory.steps.map(s => s.name).join(', ')}`;
    
    case 'conversation':
      return `Conversation: ${memory.title}. ${memory.conversationSummary}`;
    
    case 'feedback':
      return `Feedback: ${memory.feedbackType}. ${memory.correction}. Rule: ${memory.extractedRule || ''}`;
    
    case 'incident':
      return `Incident: ${memory.title}. ${memory.rootCause || memory.impact}. Lessons: ${memory.lessonsLearned.join('. ')}`;
    
    case 'meeting':
      return `Meeting: ${memory.title}. ${memory.summary}`;
    
    case 'skill':
      return `Skill: ${memory.name}. Domain: ${memory.domain}. ${memory.keyPrinciples?.join('. ') || ''}`;
    
    case 'environment':
      return `Environment: ${memory.name}. Type: ${memory.environmentType}. Warnings: ${memory.warnings.join('. ')}`;
    
    default:
      return memory.summary;
  }
}
```

---

## Summary Generation

Update `storage/sqlite/storage.ts` for new types:

```typescript
private generateSummary(memory: Memory): string {
  switch (memory.type) {
    // Existing cases...
    
    // New types
    case 'agent_spawn':
      return `🤖 ${memory.name}: ${memory.tools?.length || 0} tools`;
    
    case 'entity':
      return `📦 ${memory.entityType}: ${memory.name}`;
    
    case 'goal':
      return `🎯 ${memory.title}: ${memory.progress}% (${memory.status})`;
    
    case 'workflow':
      return `📋 ${memory.name}: ${memory.steps?.length || 0} steps`;
    
    case 'conversation':
      return `💬 ${memory.title}: ${memory.participants?.length || 0} participants`;
    
    case 'feedback':
      return `📝 ${memory.feedbackType}: ${memory.extractedRule?.slice(0, 40) || memory.correction.slice(0, 40)}...`;
    
    case 'incident':
      return `🚨 ${memory.severity}: ${memory.title}`;
    
    case 'meeting':
      return `📅 ${memory.meetingType}: ${memory.title}`;
    
    case 'skill':
      return `🧠 ${memory.name}: ${memory.proficiencyLevel}`;
    
    case 'environment':
      return `🌍 ${memory.environmentType}: ${memory.name}`;
    
    default:
      return memory.summary || 'Memory';
  }
}
```


---

## Implementation Plan

### Phase 1: Type Definitions (Day 1)

| Task | File | Lines | Priority |
|------|------|-------|----------|
| Add MemoryType union members | `types/memory.ts` | ~10 | P0 |
| Create `agent-spawn-memory.ts` | `types/` | ~60 | P0 |
| Create `entity-memory.ts` | `types/` | ~50 | P0 |
| Create `goal-memory.ts` | `types/` | ~55 | P0 |
| Create `feedback-memory.ts` | `types/` | ~45 | P0 |
| Create `workflow-memory.ts` | `types/` | ~55 | P1 |
| Create `conversation-memory.ts` | `types/` | ~50 | P1 |
| Create `incident-memory.ts` | `types/` | ~60 | P1 |
| Create `meeting-memory.ts` | `types/` | ~45 | P2 |
| Create `skill-memory.ts` | `types/` | ~45 | P2 |
| Create `environment-memory.ts` | `types/` | ~45 | P2 |
| Update `types/index.ts` exports | `types/index.ts` | ~15 | P0 |

### Phase 2: Configuration Updates (Day 1)

| Task | File | Lines |
|------|------|-------|
| Add half-lives for new types | `decay/half-lives.ts` | ~12 |
| Add min confidence for new types | `decay/half-lives.ts` | ~12 |
| Add intent weights for new types | `retrieval/weighting.ts` | ~80 |
| Add new intents | `retrieval/engine.ts` | ~15 |
| Add new intent weights | `retrieval/weighting.ts` | ~40 |

### Phase 3: Core Integration (Day 2)

| Task | File | Lines |
|------|------|-------|
| Add embedding text extraction | `cortex.ts` | ~25 |
| Add summary generation | `storage/sqlite/storage.ts` | ~30 |
| Update validation schemas | `validation/schemas.ts` | ~50 |
| Add type guards | `types/guards.ts` | ~30 |

### Phase 4: MCP Tools (Day 2-3)

| Task | File | Priority |
|------|------|----------|
| `cortex_spawn_agent` tool | `mcp/tools/memory/` | P0 |
| `cortex_entity` tool | `mcp/tools/memory/` | P0 |
| `cortex_goal` tool | `mcp/tools/memory/` | P0 |
| `cortex_feedback` tool | `mcp/tools/memory/` | P0 |
| `cortex_workflow` tool | `mcp/tools/memory/` | P1 |
| `cortex_conversation` tool | `mcp/tools/memory/` | P1 |
| `cortex_incident` tool | `mcp/tools/memory/` | P1 |
| `cortex_meeting` tool | `mcp/tools/memory/` | P2 |
| `cortex_skill` tool | `mcp/tools/memory/` | P2 |
| `cortex_environment` tool | `mcp/tools/memory/` | P2 |

### Phase 5: Testing & Documentation (Day 3)

| Task | Priority |
|------|----------|
| Unit tests for each new type | P0 |
| Integration tests for retrieval | P0 |
| Update wiki documentation | P1 |
| Add usage examples | P1 |
| Performance benchmarks | P2 |

**Total Estimated Effort: 2-3 days**

---

## Security Considerations

### Memory Poisoning Prevention

| Threat | Mitigation | Implementation |
|--------|------------|----------------|
| Malicious memory injection | Confidence scoring + validation | ValidationEngine |
| False feedback loops | Feedback validation flag | `FeedbackMemory.validated` |
| Agent config tampering | Version tracking + audit trail | `AgentSpawnMemory.version` |
| Workflow manipulation | Step verification | `WorkflowMemory.steps[].verification` |

### Access Control

```typescript
// Scope-based access for sensitive memory types
interface MemoryScope {
  scope: 'personal' | 'team' | 'organization' | 'public';
  allowedUsers?: string[];
  allowedRoles?: string[];
}

// Applied to sensitive types
interface EnvironmentMemory extends BaseMemory {
  // Credentials location, NOT actual credentials
  credentials?: {
    type: string;
    location: string;  // "AWS Secrets Manager: prod/db"
    rotationSchedule?: string;
  };
}
```

### Audit Trail

All memory operations are tracked via bitemporal storage:

```typescript
interface AuditableMemory {
  // Transaction time: when was this recorded?
  transactionTime: { recordedAt: string };
  
  // Valid time: when is this knowledge valid?
  validTime: { validFrom: string; validTo?: string };
  
  // Who created/modified?
  createdBy?: string;
  updatedBy?: string;
  
  // Supersession chain for corrections
  supersededBy?: string;
  supersedes?: string;
}
```

### Sensitive Data Handling

| Memory Type | Sensitive Fields | Protection |
|-------------|------------------|------------|
| `environment` | `credentials.location` | Never store actual secrets |
| `entity` | `attributes` | Sanitize PII |
| `incident` | `affectedUsers` | Anonymize counts |
| `feedback` | `originalOutput` | Truncate if needed |

### Privacy Sanitization

The existing `PrivacySanitizer` applies to all new types:

```typescript
// Automatically sanitizes before storage
const sanitized = await privacySanitizer.sanitize(memory);

// Patterns detected and redacted:
// - Email addresses → [EMAIL]
// - Phone numbers → [PHONE]
// - API keys → [API_KEY]
// - Credit cards → [CARD]
// - SSN/Tax IDs → [ID]
```

---

## Migration Path

### For Existing Drift Users

**Zero migration required.** New types are additive:

```typescript
// Existing memories continue to work
const existingMemories = await cortex.retrieve({
  intent: 'add_feature',
  focus: 'authentication',
});

// New types available immediately after upgrade
await cortex.add({
  type: 'goal',
  title: 'Implement OAuth2',
  // ...
});
```

### Database Schema

SQLite storage is schema-agnostic (JSON blobs):

```sql
-- Existing schema (unchanged)
CREATE TABLE memories (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  content JSON NOT NULL,  -- Flexible JSON storage
  embedding BLOB,
  confidence REAL,
  importance TEXT,
  created_at TEXT,
  updated_at TEXT
);

-- New types stored in same table
-- No schema migration needed
```

### Backward Compatibility

| Scenario | Behavior |
|----------|----------|
| Old Cortex reads new types | Graceful fallback to BaseMemory |
| New Cortex reads old data | Full compatibility |
| Mixed type queries | All types included in retrieval |
| Type-specific queries | Filter by `type` field |

### Version Detection

```typescript
// Cortex auto-detects available types
const capabilities = await cortex.getCapabilities();
// {
//   supportedTypes: ['core', 'tribal', ..., 'agent_spawn', 'entity', ...],
//   supportedIntents: ['add_feature', ..., 'spawn_agent', 'track_progress', ...],
//   version: '2.0.0'
// }
```

---

## Testing Strategy

### Unit Tests

```typescript
// tests/types/agent-spawn-memory.test.ts
describe('AgentSpawnMemory', () => {
  it('should create valid agent spawn memory', async () => {
    const memory = createAgentSpawnMemory({
      name: 'Code Reviewer',
      slug: 'code-reviewer',
      systemPrompt: 'You are a code reviewer...',
      tools: ['readFile', 'grepSearch'],
      triggerPatterns: ['review my code', 'code review'],
      autoSpawn: true,
    });
    
    expect(memory.type).toBe('agent_spawn');
    expect(memory.confidence).toBe(1.0);
  });
  
  it('should validate required fields', () => {
    expect(() => createAgentSpawnMemory({
      name: 'Test',
      // Missing required fields
    })).toThrow();
  });
});
```

### Integration Tests

```typescript
// tests/integration/universal-memory.test.ts
describe('Universal Memory Integration', () => {
  let cortex: Cortex;
  
  beforeEach(async () => {
    cortex = await Cortex.create({ storage: { path: ':memory:' } });
  });
  
  it('should retrieve agent spawns for spawn_agent intent', async () => {
    await cortex.add({
      type: 'agent_spawn',
      name: 'Security Auditor',
      triggerPatterns: ['security audit', 'check security'],
      // ...
    });
    
    const result = await cortex.retrieve({
      intent: 'spawn_agent',
      focus: 'security audit',
    });
    
    expect(result.memories).toHaveLength(1);
    expect(result.memories[0].type).toBe('agent_spawn');
  });
  
  it('should cross-reference goals with incidents', async () => {
    const goalId = await cortex.add({
      type: 'goal',
      title: 'Improve API reliability',
      // ...
    });
    
    await cortex.add({
      type: 'incident',
      title: 'API outage',
      relatedGoals: [goalId],
      // ...
    });
    
    const result = await cortex.retrieve({
      intent: 'track_progress',
      focus: 'API reliability',
    });
    
    expect(result.memories.map(m => m.type)).toContain('goal');
    expect(result.memories.map(m => m.type)).toContain('incident');
  });
});
```

### Retrieval Quality Tests

```typescript
// tests/retrieval/intent-weighting.test.ts
describe('Intent Weighting for New Types', () => {
  it('should prioritize agent_spawn for spawn_agent intent', async () => {
    // Add mixed memories
    await cortex.add({ type: 'agent_spawn', name: 'Reviewer', ... });
    await cortex.add({ type: 'tribal', topic: 'code review', ... });
    await cortex.add({ type: 'procedural', title: 'Review process', ... });
    
    const result = await cortex.retrieve({
      intent: 'spawn_agent',
      focus: 'code review',
    });
    
    // Agent spawn should be first due to 2.0 weight
    expect(result.memories[0].type).toBe('agent_spawn');
  });
  
  it('should prioritize incidents for diagnose_issue intent', async () => {
    await cortex.add({ type: 'incident', title: 'DB timeout', ... });
    await cortex.add({ type: 'tribal', topic: 'database', ... });
    
    const result = await cortex.retrieve({
      intent: 'diagnose_issue',
      focus: 'database timeout',
    });
    
    expect(result.memories[0].type).toBe('incident');
  });
});
```

### Performance Benchmarks

```typescript
// tests/performance/universal-memory.bench.ts
describe('Performance Benchmarks', () => {
  it('should retrieve from 10k mixed memories in <100ms', async () => {
    // Seed 10k memories of various types
    await seedMixedMemories(cortex, 10000);
    
    const start = performance.now();
    await cortex.retrieve({
      intent: 'recall',
      focus: 'test query',
      maxMemories: 20,
    });
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(100);
  });
  
  it('should handle 1k agent spawns efficiently', async () => {
    await seedAgentSpawns(cortex, 1000);
    
    const start = performance.now();
    await cortex.retrieve({
      intent: 'spawn_agent',
      focus: 'code review',
    });
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(50);
  });
});
```

---

## Success Metrics

### Adoption Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| New type usage | 50% of users use ≥1 new type | Telemetry |
| Agent spawn adoption | 100+ agent configs created | Memory count |
| Goal tracking adoption | 500+ goals tracked | Memory count |
| Feedback loop engagement | 1000+ feedback memories | Memory count |

### Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Retrieval relevance | >80% relevant results | User feedback |
| Intent classification accuracy | >90% correct intent | A/B testing |
| Cross-type linking | >50% memories linked | Graph analysis |
| Consolidation effectiveness | 3:1 compression ratio | Memory stats |

### Performance Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Retrieval latency (10k memories) | <100ms | Benchmarks |
| Storage overhead per memory | <5KB average | Database size |
| Embedding generation | <50ms per memory | Timing |
| Consolidation cycle | <5s for 1k memories | Timing |

### User Satisfaction

| Metric | Target | Measurement |
|--------|--------|-------------|
| "Agent remembers context" | >4.5/5 rating | Survey |
| "Useful for non-code tasks" | >4.0/5 rating | Survey |
| "Improves over time" | >4.0/5 rating | Survey |
| NPS for memory features | >50 | Survey |

---

## Open Questions

### Product Questions

1. **Default Agent Spawns:** Should we ship pre-built agent configs (Code Reviewer, Security Auditor, etc.)?
   - Pro: Immediate value, best practices baked in
   - Con: May not fit all workflows

2. **Goal Hierarchy Depth:** How deep should goal hierarchies go?
   - Current: Unlimited (parentGoalId chain)
   - Consider: Limit to 3-4 levels for UX

3. **Feedback Auto-Extraction:** Should we auto-extract feedback from conversations?
   - Pro: Passive learning
   - Con: May capture noise

### Technical Questions

1. **Cross-Project Memories:** Should some types (skills, agent_spawn) be global across projects?
   - Current: All memories are project-scoped
   - Consider: Global scope for portable knowledge

2. **Real-Time Sync:** Should memories sync across devices/sessions?
   - Current: Local SQLite only
   - Consider: Optional cloud sync layer

3. **Memory Limits:** Should we cap memories per type?
   - Current: No limits (decay handles cleanup)
   - Consider: Soft limits with warnings

### Integration Questions

1. **Calendar Integration:** Should meeting memories auto-populate from calendar?
   - Pro: Zero-friction capture
   - Con: Privacy concerns, noise

2. **Issue Tracker Integration:** Should goals link to Jira/Linear/GitHub Issues?
   - Pro: Single source of truth
   - Con: Sync complexity

3. **Slack/Teams Integration:** Should conversations auto-capture from chat?
   - Pro: Comprehensive history
   - Con: Volume, privacy, noise

---

## Appendix A: Full Type Exports

```typescript
// drift/packages/cortex/src/types/index.ts

// Base types
export type { BaseMemory, MemoryType, Memory } from './memory.js';

// Existing types
export type { CoreMemory } from './core-memory.js';
export type { TribalMemory } from './tribal-memory.js';
export type { ProceduralMemory } from './procedural-memory.js';
export type { SemanticMemory } from './semantic-memory.js';
export type { EpisodicMemory } from './episodic-memory.js';
export type { DecisionMemory } from './decision-memory.js';
export type { InsightMemory } from './insight-memory.js';
export type { ReferenceMemory } from './reference-memory.js';
export type { PreferenceMemory } from './preference-memory.js';

// Code-specific types
export type { PatternRationaleMemory } from './pattern-rationale-memory.js';
export type { ConstraintOverrideMemory } from './constraint-override-memory.js';
export type { DecisionContextMemory } from './decision-context-memory.js';
export type { CodeSmellMemory } from './code-smell-memory.js';

// NEW: Universal memory types
export type { AgentSpawnMemory } from './agent-spawn-memory.js';
export type { EntityMemory } from './entity-memory.js';
export type { GoalMemory } from './goal-memory.js';
export type { FeedbackMemory } from './feedback-memory.js';
export type { WorkflowMemory } from './workflow-memory.js';
export type { ConversationMemory } from './conversation-memory.js';
export type { IncidentMemory } from './incident-memory.js';
export type { MeetingMemory } from './meeting-memory.js';
export type { SkillMemory } from './skill-memory.js';
export type { EnvironmentMemory } from './environment-memory.js';
```

---

## Appendix B: MemoryType Union Update

```typescript
// drift/packages/cortex/src/types/memory.ts

export type MemoryType =
  // Core types (domain-agnostic)
  | 'core'
  | 'tribal'
  | 'procedural'
  | 'semantic'
  | 'episodic'
  | 'decision'
  | 'insight'
  | 'reference'
  | 'preference'
  // Code-specific types
  | 'pattern_rationale'
  | 'constraint_override'
  | 'decision_context'
  | 'code_smell'
  // NEW: Universal memory types
  | 'agent_spawn'
  | 'entity'
  | 'goal'
  | 'feedback'
  | 'workflow'
  | 'conversation'
  | 'incident'
  | 'meeting'
  | 'skill'
  | 'environment';
```

---

## Appendix C: MCP Tool Schemas

### cortex_spawn_agent

```json
{
  "name": "cortex_spawn_agent",
  "description": "Create or retrieve an agent spawn configuration. Use for 'spawn my X' workflows.",
  "parameters": {
    "type": "object",
    "properties": {
      "action": {
        "type": "string",
        "enum": ["create", "get", "list", "invoke"],
        "description": "Action to perform"
      },
      "name": {
        "type": "string",
        "description": "Agent name (for create/get)"
      },
      "slug": {
        "type": "string",
        "description": "Unique slug for invocation"
      },
      "systemPrompt": {
        "type": "string",
        "description": "Agent system prompt (for create)"
      },
      "tools": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Tools this agent can use"
      },
      "triggerPatterns": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Phrases that invoke this agent"
      }
    },
    "required": ["action"]
  }
}
```

### cortex_goal

```json
{
  "name": "cortex_goal",
  "description": "Track goals with progress, blockers, and success criteria.",
  "parameters": {
    "type": "object",
    "properties": {
      "action": {
        "type": "string",
        "enum": ["create", "update", "list", "get", "complete", "block"],
        "description": "Action to perform"
      },
      "title": {
        "type": "string",
        "description": "Goal title"
      },
      "description": {
        "type": "string",
        "description": "Goal description"
      },
      "parentGoalId": {
        "type": "string",
        "description": "Parent goal for hierarchy"
      },
      "progress": {
        "type": "number",
        "description": "Progress percentage (0-100)"
      },
      "status": {
        "type": "string",
        "enum": ["active", "achieved", "abandoned", "blocked", "at_risk"]
      },
      "blocker": {
        "type": "object",
        "properties": {
          "description": { "type": "string" },
          "severity": { "type": "string", "enum": ["low", "medium", "high", "critical"] }
        },
        "description": "Blocker to add (for block action)"
      }
    },
    "required": ["action"]
  }
}
```

### cortex_feedback

```json
{
  "name": "cortex_feedback",
  "description": "Record corrections and learning signals to improve agent behavior.",
  "parameters": {
    "type": "object",
    "properties": {
      "action": {
        "type": "string",
        "enum": ["record", "list", "validate", "apply"],
        "description": "Action to perform"
      },
      "originalOutput": {
        "type": "string",
        "description": "What the agent said/did"
      },
      "correction": {
        "type": "string",
        "description": "What the user wanted instead"
      },
      "feedbackType": {
        "type": "string",
        "enum": ["factual_error", "style_preference", "missing_context", "wrong_approach", "too_verbose", "too_brief", "incorrect_tool", "security_concern", "other"]
      },
      "extractedRule": {
        "type": "string",
        "description": "Generalizable rule from this feedback"
      }
    },
    "required": ["action"]
  }
}
```

### cortex_incident

```json
{
  "name": "cortex_incident",
  "description": "Record and retrieve incident postmortems for proactive warnings.",
  "parameters": {
    "type": "object",
    "properties": {
      "action": {
        "type": "string",
        "enum": ["record", "list", "get", "search", "warnings"],
        "description": "Action to perform"
      },
      "title": {
        "type": "string",
        "description": "Incident title"
      },
      "severity": {
        "type": "string",
        "enum": ["low", "medium", "high", "critical"]
      },
      "rootCause": {
        "type": "string",
        "description": "Root cause analysis"
      },
      "lessonsLearned": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Lessons learned"
      },
      "warningTriggers": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Conditions that should surface this incident"
      }
    },
    "required": ["action"]
  }
}
```

---

## Appendix D: Example Usage Scenarios

### Scenario 1: Agent Spawn Workflow

```typescript
// User: "spawn my code reviewer"

// 1. Cortex retrieves agent config
const agents = await cortex.retrieve({
  intent: 'spawn_agent',
  focus: 'code reviewer',
});

// 2. Match found: Code Reviewer agent
const agent = agents.memories[0] as AgentSpawnMemory;
// {
//   name: 'Code Reviewer',
//   systemPrompt: 'You are a thorough code reviewer...',
//   tools: ['readFile', 'grepSearch', 'getDiagnostics'],
//   inheritMemoryTypes: ['tribal', 'pattern_rationale'],
// }

// 3. Agent spawned with inherited context
const context = await cortex.retrieve({
  intent: 'understand_code',
  focus: currentFile,
  types: agent.inheritMemoryTypes,
});
```

### Scenario 2: Goal Progress Tracking

```typescript
// User: "how's the v2 launch going?"

// 1. Retrieve goal and related memories
const result = await cortex.retrieve({
  intent: 'track_progress',
  focus: 'v2 launch',
});

// 2. Returns:
// - Goal: "Launch v2.0" (65% complete, 2 blockers)
// - Related incidents: "Staging deployment failure"
// - Related conversations: "v2 scope discussion"
// - Related meetings: "Sprint planning - v2 features"

// 3. Agent synthesizes status update
```

### Scenario 3: Learning from Feedback

```typescript
// User corrects agent: "No, use async/await not callbacks"

// 1. Record feedback
await cortex.add({
  type: 'feedback',
  originalOutput: 'fs.readFile(path, (err, data) => {...})',
  correction: 'Use async/await: const data = await fs.promises.readFile(path)',
  feedbackType: 'wrong_approach',
  extractedRule: 'Prefer async/await over callbacks for file operations',
  appliesTo: ['typescript', 'javascript', 'file-operations'],
  validated: true,
});

// 2. Future code generation retrieves this feedback
const context = await cortex.retrieve({
  intent: 'add_feature',
  focus: 'file reading utility',
});
// Includes: "Prefer async/await over callbacks for file operations"
```

### Scenario 4: Incident-Driven Warnings

```typescript
// User: "I'm going to update the database schema"

// 1. Retrieve relevant incidents
const result = await cortex.retrieve({
  intent: 'diagnose_issue',
  focus: 'database schema migration',
});

// 2. Returns past incident:
// {
//   title: 'Production data loss during migration',
//   severity: 'critical',
//   rootCause: 'Missing backup before ALTER TABLE',
//   lessonsLearned: ['Always backup before schema changes', 'Test on staging first'],
//   warningTriggers: ['database schema', 'migration', 'ALTER TABLE'],
// }

// 3. Agent proactively warns:
// "⚠️ Before proceeding, I found a relevant incident: 'Production data loss during migration'.
//  Key lessons: Always backup before schema changes, test on staging first."
```

---

## Conclusion

This design document provides a complete specification for expanding Cortex from a code-focused memory system into a universal persistent memory layer. The key insight remains: **the infrastructure is already built**. Adding these 10 new memory types requires only:

- ~300 lines of type definitions
- ~130 lines of configuration updates
- ~200 lines of MCP tool handlers

The result is a cognitive architecture that enables:
- **Agent Orchestration:** Spawn specialized agents on demand
- **Goal Tracking:** Track objectives with progress and blockers
- **Continuous Learning:** Improve from feedback over time
- **Incident Prevention:** Proactive warnings from past problems
- **Knowledge Management:** Capture workflows, meetings, skills

**Next Steps:**
1. Review and approve this design
2. Implement Phase 1 (P0 types) - 1 day
3. Implement Phase 2 (P1 types) - 1 day
4. Implement MCP tools - 1 day
5. Testing and documentation - 1 day

**Total: 3-4 days to full implementation.**
