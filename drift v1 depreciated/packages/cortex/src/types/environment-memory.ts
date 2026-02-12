/**
 * Environment Memory Type
 * 
 * Stores environment configurations, access instructions, and warnings.
 * Enables context-aware environment interactions.
 */

import type { BaseMemory } from './memory.js';

/**
 * Environment types
 */
export type EnvironmentType = 
  | 'production' 
  | 'staging' 
  | 'development' 
  | 'testing' 
  | 'sandbox' 
  | 'other';

/**
 * Credential reference (NOT actual credentials)
 */
export interface CredentialReference {
  type: string;
  location: string;  // Where to find them, NOT the actual credentials
  rotationSchedule?: string;
}

/**
 * Environment health status
 */
export type EnvironmentStatus = 'healthy' | 'degraded' | 'down' | 'unknown';

/**
 * Environment Memory - System/environment configurations
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
  environmentType: EnvironmentType;

  /** Configuration (flexible) */
  config: Record<string, unknown>;

  /** Access information */
  accessInstructions?: string;
  credentials?: CredentialReference;

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
  status?: EnvironmentStatus;

  /** Owner */
  owner?: string;
}
