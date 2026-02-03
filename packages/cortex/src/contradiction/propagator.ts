/**
 * Confidence Propagator
 * 
 * Propagates confidence changes through the memory graph when:
 * - Feedback contradicts a memory
 * - New memory supersedes old
 * - Multiple feedbacks agree/disagree
 */

import type { IMemoryStorage } from '../storage/interface.js';
import type { ContradictionResult, ContradictionType } from './detector.js';

/**
 * Confidence update result
 */
export interface ConfidenceUpdate {
  memoryId: string;
  previousConfidence: number;
  newConfidence: number;
  reason: string;
  propagatedFrom?: string;
}

/**
 * Propagation rules configuration
 */
export interface PropagationRules {
  /** Confidence delta for direct contradiction */
  directContradictionDelta: number;
  /** Confidence delta for partial contradiction */
  partialContradictionDelta: number;
  /** Confidence delta for supersession */
  supersessionDelta: number;
  /** Confidence delta for confirmation */
  confirmationDelta: number;
  /** Factor for propagating to supporting memories */
  supportingPropagationFactor: number;
  /** Minimum confidence before archival */
  archivalThreshold: number;
  /** Number of agreeing feedbacks for consensus boost */
  consensusThreshold: number;
  /** Confidence boost for consensus */
  consensusBoost: number;
}

const DEFAULT_RULES: PropagationRules = {
  directContradictionDelta: -0.3,
  partialContradictionDelta: -0.15,
  supersessionDelta: -0.5,
  confirmationDelta: 0.1,
  supportingPropagationFactor: 0.5,
  archivalThreshold: 0.15,
  consensusThreshold: 3,
  consensusBoost: 0.2,
};

/**
 * Confidence Propagator
 */
export class ConfidencePropagator {
  private storage: IMemoryStorage;
  private rules: PropagationRules;

  constructor(storage: IMemoryStorage, rules?: Partial<PropagationRules>) {
    this.storage = storage;
    this.rules = { ...DEFAULT_RULES, ...rules };
  }

  /**
   * Apply confidence updates for a contradiction
   */
  async applyContradiction(
    contradiction: ContradictionResult,
    newMemoryId: string
  ): Promise<ConfidenceUpdate[]> {
    const updates: ConfidenceUpdate[] = [];
    
    // Get the existing memory
    const existingMemory = await this.storage.read(contradiction.existingMemoryId);
    if (!existingMemory) return updates;

    // Calculate confidence delta based on contradiction type
    const delta = this.getContradictionDelta(contradiction);
    
    // Apply to the contradicted memory
    const newConfidence = Math.max(
      this.rules.archivalThreshold,
      existingMemory.confidence + delta
    );

    await this.storage.update(contradiction.existingMemoryId, {
      confidence: newConfidence,
    });

    updates.push({
      memoryId: contradiction.existingMemoryId,
      previousConfidence: existingMemory.confidence,
      newConfidence,
      reason: `Contradicted by ${newMemoryId}: ${contradiction.evidence}`,
    });

    // Create contradiction relationship
    await this.storage.addRelationship(
      newMemoryId,
      contradiction.existingMemoryId,
      'contradicts'
    );

    // Propagate to supporting memories
    const supportingUpdates = await this.propagateToSupporting(
      contradiction.existingMemoryId,
      delta * this.rules.supportingPropagationFactor,
      `Supporting memory of contradicted ${contradiction.existingMemoryId}`
    );
    updates.push(...supportingUpdates);

    // Check if should archive
    if (newConfidence <= this.rules.archivalThreshold) {
      await this.archiveMemory(contradiction.existingMemoryId, newMemoryId);
    }

    return updates;
  }

  /**
   * Apply confidence boost for confirmation
   */
  async applyConfirmation(
    memoryId: string,
    confirmingMemoryId: string,
    context: string
  ): Promise<ConfidenceUpdate[]> {
    const updates: ConfidenceUpdate[] = [];
    
    const memory = await this.storage.read(memoryId);
    if (!memory) return updates;

    const newConfidence = Math.min(1.0, memory.confidence + this.rules.confirmationDelta);

    await this.storage.update(memoryId, {
      confidence: newConfidence,
      lastAccessed: new Date().toISOString(),
      accessCount: memory.accessCount + 1,
    });

    updates.push({
      memoryId,
      previousConfidence: memory.confidence,
      newConfidence,
      reason: `Confirmed by ${confirmingMemoryId}: ${context}`,
    });

    // Create supports relationship
    await this.storage.addRelationship(confirmingMemoryId, memoryId, 'supports');

    return updates;
  }

  /**
   * Check for and apply consensus boost
   */
  async checkConsensus(memoryId: string): Promise<ConfidenceUpdate | null> {
    const memory = await this.storage.read(memoryId);
    if (!memory) return null;

    // Get all supporting relationships
    const supporters = await this.storage.getRelated(memoryId, 'supports');
    
    // Count feedback memories that support this
    const feedbackSupporters = supporters.filter(m => m.type === 'feedback');
    
    if (feedbackSupporters.length >= this.rules.consensusThreshold) {
      const newConfidence = Math.min(1.0, memory.confidence + this.rules.consensusBoost);
      
      await this.storage.update(memoryId, { confidence: newConfidence });
      
      return {
        memoryId,
        previousConfidence: memory.confidence,
        newConfidence,
        reason: `Consensus reached: ${feedbackSupporters.length} supporting feedbacks`,
      };
    }

    return null;
  }

  /**
   * Apply supersession (new memory replaces old)
   */
  async applySupersession(
    newMemoryId: string,
    oldMemoryId: string,
    reason: string
  ): Promise<ConfidenceUpdate[]> {
    const updates: ConfidenceUpdate[] = [];
    
    const oldMemory = await this.storage.read(oldMemoryId);
    if (!oldMemory) return updates;

    const newConfidence = Math.max(
      this.rules.archivalThreshold,
      oldMemory.confidence + this.rules.supersessionDelta
    );

    await this.storage.update(oldMemoryId, {
      confidence: newConfidence,
      supersededBy: newMemoryId,
    });

    // Update new memory to reference what it supersedes
    await this.storage.update(newMemoryId, {
      supersedes: oldMemoryId,
    });

    // Create supersedes relationship
    await this.storage.addRelationship(newMemoryId, oldMemoryId, 'supersedes');

    updates.push({
      memoryId: oldMemoryId,
      previousConfidence: oldMemory.confidence,
      newConfidence,
      reason: `Superseded by ${newMemoryId}: ${reason}`,
    });

    // Archive if below threshold
    if (newConfidence <= this.rules.archivalThreshold) {
      await this.archiveMemory(oldMemoryId, newMemoryId);
    }

    return updates;
  }

  /**
   * Propagate confidence change to supporting memories
   */
  private async propagateToSupporting(
    memoryId: string,
    delta: number,
    reason: string
  ): Promise<ConfidenceUpdate[]> {
    const updates: ConfidenceUpdate[] = [];
    
    // Get memories that support this one
    const supporters = await this.storage.getRelated(memoryId, 'supports');
    
    for (const supporter of supporters) {
      const newConfidence = Math.max(
        this.rules.archivalThreshold,
        Math.min(1.0, supporter.confidence + delta)
      );

      if (Math.abs(newConfidence - supporter.confidence) > 0.01) {
        await this.storage.update(supporter.id, { confidence: newConfidence });
        
        updates.push({
          memoryId: supporter.id,
          previousConfidence: supporter.confidence,
          newConfidence,
          reason,
          propagatedFrom: memoryId,
        });
      }
    }

    return updates;
  }

  /**
   * Archive a memory that's been contradicted below threshold
   */
  private async archiveMemory(memoryId: string, supersededBy: string): Promise<void> {
    await this.storage.update(memoryId, {
      archived: true,
      archiveReason: `Confidence dropped below threshold after contradiction by ${supersededBy}`,
      supersededBy,
    });
  }

  /**
   * Get confidence delta for contradiction type
   */
  private getContradictionDelta(contradiction: ContradictionResult): number {
    // Scale by contradiction confidence
    const baseDeltas: Record<ContradictionType, number> = {
      direct: this.rules.directContradictionDelta,
      partial: this.rules.partialContradictionDelta,
      supersedes: this.rules.supersessionDelta,
      temporal: this.rules.partialContradictionDelta,
    };

    const baseDelta = baseDeltas[contradiction.contradictionType];
    return baseDelta * contradiction.confidence;
  }
}

/**
 * Batch confidence recalculation
 */
export async function recalculateConfidences(
  storage: IMemoryStorage,
  memoryIds?: string[]
): Promise<ConfidenceUpdate[]> {
  const updates: ConfidenceUpdate[] = [];
  
  // Get memories to process
  const memories = memoryIds
    ? await Promise.all(memoryIds.map(id => storage.read(id)))
    : await storage.search({ limit: 1000 });

  for (const memory of memories) {
    if (!memory) continue;

    // Get contradiction count
    const contradictors = await storage.getRelated(memory.id, 'contradicts');
    const supporters = await storage.getRelated(memory.id, 'supports');
    
    // Calculate adjustment based on relationship balance
    const contradictionPenalty = contradictors.length * 0.1;
    const supportBonus = Math.min(supporters.length * 0.05, 0.2);
    
    const adjustment = supportBonus - contradictionPenalty;
    
    if (Math.abs(adjustment) > 0.01) {
      const newConfidence = Math.max(0.1, Math.min(1.0, memory.confidence + adjustment));
      
      await storage.update(memory.id, { confidence: newConfidence });
      
      updates.push({
        memoryId: memory.id,
        previousConfidence: memory.confidence,
        newConfidence,
        reason: `Recalculated: ${supporters.length} supporters, ${contradictors.length} contradictors`,
      });
    }
  }

  return updates;
}
