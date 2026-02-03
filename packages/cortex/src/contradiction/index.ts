/**
 * Contradiction Detection and Confidence Propagation
 * 
 * Detects when memories contradict each other and propagates
 * confidence changes through the memory graph.
 */

export { ContradictionDetector, type ContradictionResult, type ContradictionType, type ContradictionDetectorConfig } from './detector.js';
export { ConfidencePropagator, recalculateConfidences, type ConfidenceUpdate, type PropagationRules } from './propagator.js';
