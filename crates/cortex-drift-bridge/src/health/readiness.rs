//! Readiness probe: are all required subsystems initialized?

use super::checks::SubsystemCheck;
use super::status::BridgeHealth;

/// Run all health checks and compute overall bridge health.
pub fn compute_health(checks: &[SubsystemCheck]) -> BridgeHealth {
    if checks.is_empty() {
        return BridgeHealth::Unavailable;
    }

    let unhealthy: Vec<String> = checks
        .iter()
        .filter(|c| !c.healthy)
        .map(|c| format!("{}: {}", c.name, c.detail))
        .collect();

    if unhealthy.is_empty() {
        BridgeHealth::Available
    } else if checks.iter().any(|c| c.healthy) {
        // At least one subsystem works — degraded, not unavailable
        BridgeHealth::Degraded(unhealthy)
    } else {
        BridgeHealth::Unavailable
    }
}

/// Check if the bridge is ready to serve requests.
/// Requires at minimum: cortex_db available.
pub fn is_ready(checks: &[SubsystemCheck]) -> bool {
    checks
        .iter()
        .any(|c| c.name == "cortex_db" && c.healthy)
}
