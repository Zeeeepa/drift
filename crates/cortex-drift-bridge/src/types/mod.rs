//! Shared data structures for the bridge (no logic).

pub mod confidence_adjustment;
pub mod data_source;
pub mod event_processing_result;
pub mod grounding_result;
pub mod grounding_snapshot;
pub mod grounding_verdict;

pub use confidence_adjustment::{AdjustmentMode, ConfidenceAdjustment};
pub use data_source::GroundingDataSource;
pub use event_processing_result::EventProcessingResult;
pub use grounding_result::GroundingResult;
pub use grounding_snapshot::GroundingSnapshot;
pub use grounding_verdict::GroundingVerdict;
