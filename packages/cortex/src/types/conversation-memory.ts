/**
 * Conversation Memory Type
 * 
 * Stores summarized conversations with key decisions and action items.
 * Enables "what did we discuss about X" queries.
 */

import type { BaseMemory } from './memory.js';

/**
 * Action item from a conversation
 */
export interface ConversationActionItem {
  item: string;
  assignee?: string;
  status: 'pending' | 'in_progress' | 'done' | 'cancelled';
  dueDate?: string;
  completedAt?: string;
}

/**
 * Conversation Memory - Summarized past discussions
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
  actionItems?: ConversationActionItem[];

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
