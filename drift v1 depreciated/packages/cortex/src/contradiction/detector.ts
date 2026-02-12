/**
 * Contradiction Detector
 * 
 * Detects when new memories contradict existing ones.
 * Uses semantic similarity and rule-based heuristics.
 */

import type { Memory, MemoryType } from '../types/index.js';
import type { IMemoryStorage } from '../storage/interface.js';
import type { IEmbeddingProvider } from '../embeddings/interface.js';

/**
 * Types of contradictions
 */
export type ContradictionType = 
  | 'direct'      // Explicitly contradicts (A says X, B says not X)
  | 'partial'     // Partially contradicts (A says X always, B says X sometimes)
  | 'supersedes'  // New information replaces old (A is outdated version of B)
  | 'temporal';   // Was true then, not true now

/**
 * Result of contradiction detection
 */
export interface ContradictionResult {
  /** ID of the existing memory that's contradicted */
  existingMemoryId: string;
  /** Type of contradiction */
  contradictionType: ContradictionType;
  /** Confidence in this contradiction (0-1) */
  confidence: number;
  /** Evidence/reason for the contradiction */
  evidence: string;
  /** Suggested action to resolve */
  suggestedAction: 'lower_confidence' | 'archive' | 'merge' | 'flag_for_review';
  /** Semantic similarity score */
  similarityScore: number;
}

/**
 * Configuration for contradiction detection
 */
export interface ContradictionDetectorConfig {
  /** Minimum similarity to consider as potential contradiction */
  minSimilarityThreshold: number;
  /** Minimum confidence to report a contradiction */
  minContradictionConfidence: number;
  /** Maximum candidates to check */
  maxCandidates: number;
  /** Memory types to check for contradictions */
  checkTypes: MemoryType[];
}

const DEFAULT_CONFIG: ContradictionDetectorConfig = {
  minSimilarityThreshold: 0.6,
  minContradictionConfidence: 0.5,
  maxCandidates: 50,
  checkTypes: [
    'tribal', 'semantic', 'procedural', 'pattern_rationale',
    'decision_context', 'feedback', 'skill', 'workflow',
  ],
};

/**
 * Contradiction detection keywords
 */
const NEGATION_PATTERNS = [
  /\bnot\b/i, /\bnever\b/i, /\bdon't\b/i, /\bdoesn't\b/i,
  /\bshouldn't\b/i, /\bwon't\b/i, /\bcan't\b/i, /\bavoid\b/i,
  /\binstead\b/i, /\brather than\b/i, /\bno longer\b/i,
];

const ABSOLUTE_PATTERNS = [
  /\balways\b/i, /\bnever\b/i, /\bmust\b/i, /\bshould\b/i,
  /\bevery\b/i, /\ball\b/i, /\bnone\b/i,
];

/**
 * Contradiction Detector
 */
export class ContradictionDetector {
  private storage: IMemoryStorage;
  private embeddings: IEmbeddingProvider;
  private config: ContradictionDetectorConfig;

  constructor(
    storage: IMemoryStorage,
    embeddings: IEmbeddingProvider,
    config?: Partial<ContradictionDetectorConfig>
  ) {
    this.storage = storage;
    this.embeddings = embeddings;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Detect contradictions for a new memory
   */
  async detectContradictions(newMemory: Memory): Promise<ContradictionResult[]> {
    // Skip types we don't check
    if (!this.config.checkTypes.includes(newMemory.type)) {
      return [];
    }

    // Get embedding for new memory
    const newText = this.getMemoryText(newMemory);
    if (!newText) return [];

    let newEmbedding: number[];
    try {
      newEmbedding = await this.embeddings.embed(newText);
    } catch {
      return []; // Can't detect without embeddings
    }

    // Find similar memories
    const candidates = await this.storage.similaritySearch(
      newEmbedding,
      this.config.maxCandidates,
      this.config.minSimilarityThreshold
    );

    // Filter out the new memory itself and different types
    const relevantCandidates = candidates.filter(
      m => m.id !== newMemory.id && this.config.checkTypes.includes(m.type)
    );

    // Check each candidate for contradictions
    const results: ContradictionResult[] = [];
    
    for (const candidate of relevantCandidates) {
      const contradiction = await this.checkContradiction(newMemory, candidate, newEmbedding);
      if (contradiction && contradiction.confidence >= this.config.minContradictionConfidence) {
        results.push(contradiction);
      }
    }

    // Sort by confidence
    results.sort((a, b) => b.confidence - a.confidence);

    return results;
  }

  /**
   * Check if two memories contradict each other
   */
  private async checkContradiction(
    newMemory: Memory,
    existingMemory: Memory,
    newEmbedding: number[]
  ): Promise<ContradictionResult | null> {
    const newText = this.getMemoryText(newMemory);
    const existingText = this.getMemoryText(existingMemory);
    
    if (!newText || !existingText) return null;

    // Calculate similarity
    let similarityScore = 0;
    try {
      const existingEmbedding = await this.embeddings.embed(existingText);
      similarityScore = this.cosineSimilarity(newEmbedding, existingEmbedding);
    } catch {
      similarityScore = this.textSimilarity(newText, existingText);
    }

    // Check for contradiction signals
    const signals = this.detectContradictionSignals(newText, existingText, newMemory, existingMemory);
    
    if (signals.length === 0) return null;

    // Calculate overall confidence
    const confidence = this.calculateContradictionConfidence(signals, similarityScore);
    
    // Determine contradiction type
    const contradictionType = this.determineContradictionType(signals, newMemory, existingMemory);
    
    // Determine suggested action
    const suggestedAction = this.determineSuggestedAction(contradictionType, confidence, existingMemory);

    return {
      existingMemoryId: existingMemory.id,
      contradictionType,
      confidence,
      evidence: signals.map(s => s.reason).join('; '),
      suggestedAction,
      similarityScore,
    };
  }

  /**
   * Detect signals that indicate contradiction
   */
  private detectContradictionSignals(
    newText: string,
    existingText: string,
    newMemory: Memory,
    existingMemory: Memory
  ): Array<{ type: string; weight: number; reason: string }> {
    const signals: Array<{ type: string; weight: number; reason: string }> = [];

    // Check for negation patterns
    const newHasNegation = NEGATION_PATTERNS.some(p => p.test(newText));
    const existingHasNegation = NEGATION_PATTERNS.some(p => p.test(existingText));
    
    if (newHasNegation !== existingHasNegation) {
      signals.push({
        type: 'negation_mismatch',
        weight: 0.4,
        reason: 'One memory uses negation while the other does not',
      });
    }

    // Check for absolute statements that conflict
    const newHasAbsolute = ABSOLUTE_PATTERNS.some(p => p.test(newText));
    const existingHasAbsolute = ABSOLUTE_PATTERNS.some(p => p.test(existingText));
    
    if (newHasAbsolute && existingHasAbsolute) {
      signals.push({
        type: 'absolute_conflict',
        weight: 0.3,
        reason: 'Both memories make absolute statements',
      });
    }

    // Check for temporal supersession
    if (this.isTemporalSupersession(newMemory, existingMemory)) {
      signals.push({
        type: 'temporal_supersession',
        weight: 0.5,
        reason: 'New memory appears to update older information',
      });
    }

    // Check for feedback contradicting existing knowledge
    if (newMemory.type === 'feedback' && this.isFeedbackContradiction(newMemory, existingMemory)) {
      signals.push({
        type: 'feedback_contradiction',
        weight: 0.7,
        reason: 'Feedback explicitly corrects existing knowledge',
      });
    }

    // Check for same topic with different conclusions
    if (this.hasSameTopicDifferentConclusion(newMemory, existingMemory)) {
      signals.push({
        type: 'topic_conflict',
        weight: 0.5,
        reason: 'Same topic with different conclusions',
      });
    }

    return signals;
  }

  /**
   * Check if new memory temporally supersedes existing
   */
  private isTemporalSupersession(newMemory: Memory, existingMemory: Memory): boolean {
    const newDate = new Date(newMemory.createdAt);
    const existingDate = new Date(existingMemory.createdAt);
    const daysDiff = (newDate.getTime() - existingDate.getTime()) / (1000 * 60 * 60 * 24);
    
    // If new memory is significantly newer and covers same topic
    return daysDiff > 30;
  }

  /**
   * Check if feedback contradicts existing memory
   */
  private isFeedbackContradiction(feedback: Memory, existing: Memory): boolean {
    if (feedback.type !== 'feedback') return false;
    
    const feedbackMem = feedback as any;
    const correction = feedbackMem.correction?.toLowerCase() || '';
    const existingText = this.getMemoryText(existing)?.toLowerCase() || '';
    
    // Check if correction explicitly mentions the existing content
    const existingWords = existingText.split(/\s+/).filter(w => w.length > 4);
    const matchingWords = existingWords.filter(w => correction.includes(w));
    
    return matchingWords.length >= 3;
  }

  /**
   * Check if memories have same topic but different conclusions
   */
  private hasSameTopicDifferentConclusion(newMemory: Memory, existingMemory: Memory): boolean {
    // Extract topics from both memories
    const newTopic = this.extractTopic(newMemory);
    const existingTopic = this.extractTopic(existingMemory);
    
    if (!newTopic || !existingTopic) return false;
    
    // Check topic similarity
    const topicSimilarity = this.textSimilarity(newTopic, existingTopic);
    return topicSimilarity > 0.7;
  }

  /**
   * Extract topic from memory
   */
  private extractTopic(memory: Memory): string | null {
    const m = memory as any;
    return m.topic || m.name || m.title || m.patternName || m.constraintName || null;
  }

  /**
   * Calculate overall contradiction confidence
   */
  private calculateContradictionConfidence(
    signals: Array<{ type: string; weight: number; reason: string }>,
    similarityScore: number
  ): number {
    if (signals.length === 0) return 0;

    // Base confidence from signals
    const signalConfidence = signals.reduce((sum, s) => sum + s.weight, 0) / signals.length;
    
    // Boost by similarity (high similarity + contradiction signals = more confident)
    const similarityBoost = similarityScore > 0.8 ? 1.2 : similarityScore > 0.6 ? 1.0 : 0.8;
    
    return Math.min(1.0, signalConfidence * similarityBoost);
  }

  /**
   * Determine the type of contradiction
   */
  private determineContradictionType(
    signals: Array<{ type: string; weight: number; reason: string }>,
    _newMemory: Memory,
    _existingMemory: Memory
  ): ContradictionType {
    const signalTypes = signals.map(s => s.type);
    
    if (signalTypes.includes('temporal_supersession')) {
      return 'supersedes';
    }
    
    if (signalTypes.includes('feedback_contradiction')) {
      return 'direct';
    }
    
    if (signalTypes.includes('negation_mismatch') && signalTypes.includes('absolute_conflict')) {
      return 'direct';
    }
    
    if (signalTypes.includes('topic_conflict')) {
      return 'partial';
    }
    
    return 'partial';
  }

  /**
   * Determine suggested action for contradiction
   */
  private determineSuggestedAction(
    contradictionType: ContradictionType,
    confidence: number,
    existingMemory: Memory
  ): 'lower_confidence' | 'archive' | 'merge' | 'flag_for_review' {
    // High confidence direct contradiction → archive old
    if (contradictionType === 'direct' && confidence > 0.8) {
      return 'archive';
    }
    
    // Supersession → archive old
    if (contradictionType === 'supersedes') {
      return 'archive';
    }
    
    // Partial contradiction with high existing confidence → flag for review
    if (contradictionType === 'partial' && existingMemory.confidence > 0.7) {
      return 'flag_for_review';
    }
    
    // Default → lower confidence
    return 'lower_confidence';
  }

  /**
   * Get searchable text from memory
   */
  private getMemoryText(memory: Memory): string | null {
    const m = memory as any;
    
    switch (memory.type) {
      case 'tribal':
        return `${m.topic}: ${m.knowledge}`;
      case 'procedural':
        return `${m.name}: ${m.description}`;
      case 'semantic':
        return `${m.topic}: ${m.knowledge}`;
      case 'pattern_rationale':
        return `${m.patternName}: ${m.rationale}`;
      case 'feedback':
        return `${m.correction} ${m.extractedRule || ''}`;
      case 'skill':
        return `${m.name}: ${m.keyPrinciples?.join('. ') || ''}`;
      case 'workflow':
        return `${m.name}: ${m.description}`;
      default:
        return memory.summary;
    }
  }

  /**
   * Calculate cosine similarity between embeddings
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += (a[i] ?? 0) * (b[i] ?? 0);
      normA += (a[i] ?? 0) * (a[i] ?? 0);
      normB += (b[i] ?? 0) * (b[i] ?? 0);
    }
    
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  /**
   * Simple text similarity (fallback)
   */
  private textSimilarity(a: string, b: string): number {
    const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    
    const intersection = new Set([...wordsA].filter(w => wordsB.has(w)));
    const union = new Set([...wordsA, ...wordsB]);
    
    return union.size === 0 ? 0 : intersection.size / union.size;
  }
}
