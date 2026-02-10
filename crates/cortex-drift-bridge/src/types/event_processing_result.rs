//! EventProcessingResult: result of processing a Drift event through the bridge.

use cortex_core::memory::types::MemoryType;

/// Result of processing a Drift event through the bridge.
#[derive(Debug, Clone)]
pub struct EventProcessingResult {
    /// The event that was processed.
    pub event_type: String,
    /// Whether a memory was created.
    pub memory_created: bool,
    /// The created memory ID (if any).
    pub memory_id: Option<String>,
    /// The memory type (if created).
    pub memory_type: Option<MemoryType>,
    /// Any links created.
    pub links_created: Vec<String>,
    /// Processing duration in microseconds.
    pub duration_us: u64,
    /// Error (if processing failed but was non-fatal).
    pub error: Option<String>,
}
