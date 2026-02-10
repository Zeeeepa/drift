//! GroundingDataSource: the 12 Drift subsystems that can provide grounding evidence.

use serde::{Deserialize, Serialize};

/// The Drift subsystems that can provide grounding evidence.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum GroundingDataSource {
    /// Pattern detection engine.
    Patterns,
    /// Convention detection engine.
    Conventions,
    /// Constraint enforcement engine.
    Constraints,
    /// Coupling analysis engine.
    Coupling,
    /// DNA fingerprinting engine.
    Dna,
    /// Test topology engine.
    TestTopology,
    /// Error handling analysis engine.
    ErrorHandling,
    /// Decision mining engine.
    Decisions,
    /// Boundary detection engine.
    Boundaries,
    /// Taint analysis engine.
    Taint,
    /// Call graph engine.
    CallGraph,
    /// Security analysis engine.
    Security,
}

impl GroundingDataSource {
    /// All 12 data sources.
    pub const ALL: [GroundingDataSource; 12] = [
        Self::Patterns,
        Self::Conventions,
        Self::Constraints,
        Self::Coupling,
        Self::Dna,
        Self::TestTopology,
        Self::ErrorHandling,
        Self::Decisions,
        Self::Boundaries,
        Self::Taint,
        Self::CallGraph,
        Self::Security,
    ];

    /// String representation for storage/display.
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Patterns => "patterns",
            Self::Conventions => "conventions",
            Self::Constraints => "constraints",
            Self::Coupling => "coupling",
            Self::Dna => "dna",
            Self::TestTopology => "test_topology",
            Self::ErrorHandling => "error_handling",
            Self::Decisions => "decisions",
            Self::Boundaries => "boundaries",
            Self::Taint => "taint",
            Self::CallGraph => "call_graph",
            Self::Security => "security",
        }
    }
}
