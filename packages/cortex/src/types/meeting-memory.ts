/**
 * Meeting Memory Type
 * 
 * Stores meeting summaries with agenda, decisions, and action items.
 * Enables "what did we decide in the last planning meeting" queries.
 */

import type { BaseMemory } from './memory.js';

/**
 * Meeting types
 */
export type MeetingType = 
  | 'standup' 
  | 'planning' 
  | 'retro' 
  | 'review' 
  | '1on1' 
  | 'all_hands' 
  | 'workshop' 
  | 'other';

/**
 * Action item from a meeting
 */
export interface MeetingActionItem {
  item: string;
  assignee?: string;
  dueDate?: string;
  status: 'pending' | 'done' | 'cancelled';
}

/**
 * Meeting Memory - Meeting notes and action items
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
  meetingType: MeetingType;

  /** When */
  scheduledAt: string;
  duration?: string;

  /** Who */
  participants: string[];
  organizer?: string;

  /** Content */
  agenda?: string[];
  meetingSummary: string;

  /** Outcomes */
  decisions?: string[];
  actionItems?: MeetingActionItem[];

  /** Follow-up */
  nextMeeting?: string;
  openQuestions?: string[];

  /** Links */
  relatedMeetings?: string[];
  relatedGoals?: string[];

  /** Domain classification */
  domain?: string;
}
