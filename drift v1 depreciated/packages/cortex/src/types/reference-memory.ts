/**
 * Reference Memory Type
 * 
 * External references, citations, and resources.
 * Stores key points from articles, docs, papers, etc.
 */

import type { BaseMemory } from './memory.js';

/**
 * Reference Memory - External knowledge sources
 * 
 * Half-life: 60 days (references can become outdated)
 * 
 * Examples:
 * - "Nielsen Norman Group article on notification UX"
 * - "AWS documentation on Lambda cold starts"
 * - "Research paper on distributed consensus"
 */
export interface ReferenceMemory extends BaseMemory {
  type: 'reference';

  /** Reference title */
  title: string;
  /** URL or location */
  url?: string;

  /** Key points extracted from this reference */
  keyPoints: string[];
  /** Full content (optional, for search) */
  fullContent?: string;

  /** Author or source */
  author?: string;
  /** When it was published */
  publishedAt?: string;
  /** When we last verified it's still valid */
  lastVerified?: string;

  /** Domain/topic */
  domain?: string;
  /** Type of reference */
  referenceType?: 'article' | 'paper' | 'documentation' | 'book' | 'video' | 'podcast' | 'other';

  /** Is this an authoritative source? */
  authoritative?: boolean;
  /** Is this potentially outdated? */
  outdated?: boolean;
}
