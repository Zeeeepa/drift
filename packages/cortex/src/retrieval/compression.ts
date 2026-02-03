/**
 * Hierarchical Compression
 * 
 * Compresses memories at different levels:
 * - Summary: ~20 tokens
 * - Expanded: ~100 tokens
 * - Full: Complete memory
 */

import type { Memory } from '../types/index.js';

/**
 * Compression result
 */
export interface CompressionResult {
  /** Summary text */
  summary: string;
  /** Expanded text */
  expanded: string;
  /** Full content */
  full: string;
  /** Token count for summary */
  summaryTokens: number;
  /** Token count for expanded */
  expandedTokens: number;
  /** Token count for full */
  fullTokens: number;
}

/**
 * Hierarchical compressor
 */
export class HierarchicalCompressor {
  /**
   * Compress a memory at all levels
   */
  compress(memory: Memory): CompressionResult {
    const summary = this.generateSummary(memory);
    const expanded = this.generateExpanded(memory);
    const full = JSON.stringify(memory);

    return {
      summary,
      expanded,
      full,
      summaryTokens: this.estimateTokens(summary),
      expandedTokens: this.estimateTokens(expanded),
      fullTokens: this.estimateTokens(full),
    };
  }

  /**
   * Generate summary (~20 tokens)
   */
  private generateSummary(memory: Memory): string {
    return memory.summary || this.defaultSummary(memory);
  }

  /**
   * Generate expanded version (~100 tokens)
   */
  private generateExpanded(memory: Memory): string {
    const parts: string[] = [memory.summary];

    switch (memory.type) {
      case 'tribal':
        parts.push(`Topic: ${memory.topic}`);
        parts.push(`Knowledge: ${memory.knowledge}`);
        if (memory.warnings?.length) {
          parts.push(`Warnings: ${memory.warnings.join(', ')}`);
        }
        break;

      case 'procedural':
        parts.push(`Procedure: ${memory.name}`);
        parts.push(`Steps: ${memory.steps?.length || 0}`);
        if (memory.steps?.length) {
          parts.push(`First step: ${memory.steps[0]?.action}`);
        }
        break;

      case 'semantic':
        parts.push(`Topic: ${memory.topic}`);
        parts.push(`Knowledge: ${memory.knowledge}`);
        break;

      case 'pattern_rationale':
        parts.push(`Pattern: ${memory.patternName}`);
        parts.push(`Rationale: ${memory.rationale}`);
        break;

      case 'constraint_override':
        parts.push(`Constraint: ${memory.constraintName}`);
        parts.push(`Reason: ${memory.reason}`);
        break;

      case 'code_smell':
        parts.push(`Smell: ${memory.name}`);
        parts.push(`Reason: ${memory.reason}`);
        parts.push(`Suggestion: ${memory.suggestion}`);
        break;

      case 'decision_context':
        parts.push(`Decision: ${memory.decisionSummary}`);
        if (memory.businessContext) {
          parts.push(`Context: ${memory.businessContext}`);
        }
        break;

      case 'episodic':
        if (memory.interaction) {
          parts.push(`Query: ${memory.interaction.userQuery?.slice(0, 100) || 'N/A'}`);
          parts.push(`Outcome: ${memory.interaction.outcome || 'unknown'}`);
        }
        break;

      case 'core':
        parts.push(`Project: ${memory.project.name}`);
        parts.push(`Stack: ${memory.project.techStack.join(', ')}`);
        break;

      // Universal memory types (v2)
      case 'agent_spawn':
        parts.push(`Agent: ${memory.name}`);
        parts.push(`Description: ${memory.description}`);
        parts.push(`Tools: ${memory.tools.join(', ')}`);
        parts.push(`Triggers: ${memory.triggerPatterns.join(', ')}`);
        break;

      case 'entity':
        parts.push(`${memory.entityType}: ${memory.name}`);
        parts.push(`Status: ${memory.status}`);
        parts.push(`Facts: ${memory.keyFacts.join('. ')}`);
        if (memory.warnings?.length) {
          parts.push(`Warnings: ${memory.warnings.join(', ')}`);
        }
        break;

      case 'goal':
        parts.push(`Goal: ${memory.title}`);
        parts.push(`Status: ${memory.status} (${memory.progress}%)`);
        parts.push(`Description: ${memory.description}`);
        if (memory.blockers?.length) {
          parts.push(`Blockers: ${memory.blockers.length}`);
        }
        break;

      case 'feedback':
        parts.push(`Type: ${memory.feedbackType}`);
        parts.push(`Correction: ${memory.correction}`);
        if (memory.extractedRule) {
          parts.push(`Rule: ${memory.extractedRule}`);
        }
        break;

      case 'workflow':
        parts.push(`Workflow: ${memory.name}`);
        parts.push(`Steps: ${memory.steps.length}`);
        parts.push(`Triggers: ${memory.triggerPhrases.join(', ')}`);
        break;

      case 'conversation':
        parts.push(`Conversation: ${memory.title}`);
        parts.push(`Participants: ${memory.participants.join(', ')}`);
        parts.push(`Summary: ${memory.conversationSummary}`);
        if (memory.keyDecisions?.length) {
          parts.push(`Decisions: ${memory.keyDecisions.join('; ')}`);
        }
        break;

      case 'incident':
        parts.push(`Incident: ${memory.title}`);
        parts.push(`Severity: ${memory.severity}`);
        parts.push(`Impact: ${memory.impact}`);
        if (memory.rootCause) {
          parts.push(`Root cause: ${memory.rootCause}`);
        }
        parts.push(`Lessons: ${memory.lessonsLearned.join('; ')}`);
        break;

      case 'meeting':
        parts.push(`Meeting: ${memory.title}`);
        parts.push(`Type: ${memory.meetingType}`);
        parts.push(`Summary: ${memory.meetingSummary}`);
        if (memory.decisions?.length) {
          parts.push(`Decisions: ${memory.decisions.join('; ')}`);
        }
        break;

      case 'skill':
        parts.push(`Skill: ${memory.name}`);
        parts.push(`Domain: ${memory.domain}`);
        parts.push(`Level: ${memory.proficiencyLevel}`);
        if (memory.keyPrinciples?.length) {
          parts.push(`Principles: ${memory.keyPrinciples.join('; ')}`);
        }
        break;

      case 'environment':
        parts.push(`Environment: ${memory.name}`);
        parts.push(`Type: ${memory.environmentType}`);
        parts.push(`Warnings: ${memory.warnings.join('; ')}`);
        if (memory.accessInstructions) {
          parts.push(`Access: ${memory.accessInstructions}`);
        }
        break;
    }

    return parts.join('\n');
  }

  /**
   * Default summary for memories without one
   */
  private defaultSummary(memory: Memory): string {
    switch (memory.type) {
      case 'tribal':
        return `⚠️ ${memory.topic}: ${memory.knowledge?.slice(0, 50)}...`;
      case 'procedural':
        return `📋 ${memory.name}: ${memory.steps?.length || 0} steps`;
      case 'semantic':
        return `💡 ${memory.topic}: ${memory.knowledge?.slice(0, 50)}...`;
      case 'pattern_rationale':
        return `🎯 ${memory.patternName}: ${memory.rationale?.slice(0, 50)}...`;
      case 'constraint_override':
        return `✅ Override: ${memory.constraintName}`;
      case 'code_smell':
        return `🚫 Avoid: ${memory.name}`;
      case 'decision_context':
        return `📝 Decision: ${memory.decisionSummary?.slice(0, 50)}...`;
      case 'episodic':
        return `💭 ${memory.context?.focus || 'Interaction'}`;
      case 'core':
        return `🏠 ${memory.project?.name || 'Project'}`;
      // Universal memory types (v2)
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
        return `📝 ${memory.feedbackType}: ${memory.extractedRule?.slice(0, 40) || memory.correction?.slice(0, 40)}...`;
      case 'incident':
        return `🚨 ${memory.severity}: ${memory.title}`;
      case 'meeting':
        return `📅 ${memory.meetingType}: ${memory.title}`;
      case 'skill':
        return `🧠 ${memory.name}: ${memory.proficiencyLevel}`;
      case 'environment':
        return `🌍 ${memory.environmentType}: ${memory.name}`;
      default:
        return 'Memory';
    }
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}
