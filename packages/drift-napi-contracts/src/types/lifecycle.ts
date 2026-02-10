/**
 * Lifecycle types — aligned to crates/drift/drift-napi/src/bindings/lifecycle.rs
 */

/** Options for driftInitialize(). All fields optional. */
export interface InitOptions {
  /** Path to drift.db. Defaults to `.drift/drift.db`. */
  dbPath?: string;
  /** Project root for scanning and config resolution. */
  projectRoot?: string;
  /** TOML configuration string. Overrides file-based config. */
  configToml?: string;
}

/**
 * Progress update sent from Rust via ThreadsafeFunction.
 * Aligned to crates/drift/drift-napi/src/conversions/types.rs ProgressUpdate.
 */
export interface ProgressUpdate {
  processed: number;
  total: number;
  phase: string;
  currentFile: string | null;
}

/** Callback type for driftScanWithProgress. */
export type ProgressCallback = (update: ProgressUpdate) => void;
