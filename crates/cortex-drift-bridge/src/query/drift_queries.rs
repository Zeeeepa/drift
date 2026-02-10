//! Parameterized read-only queries against drift.db.
//!
//! 10 queries matching the 10 evidence types in the grounding system.
//! All queries are read-only — the bridge never writes to drift.db (D6 compliance).

use rusqlite::Connection;

use crate::errors::BridgeResult;

/// Query pattern confidence from drift.db by pattern_id.
pub fn pattern_confidence(conn: &Connection, pattern_id: &str) -> BridgeResult<Option<f64>> {
    let result = conn.query_row(
        "SELECT confidence FROM drift_patterns WHERE id = ?1",
        rusqlite::params![pattern_id],
        |row| row.get::<_, f64>(0),
    );
    match result {
        Ok(v) => Ok(Some(v)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

/// Query pattern occurrence rate from drift.db by pattern_id.
pub fn pattern_occurrence_rate(conn: &Connection, pattern_id: &str) -> BridgeResult<Option<f64>> {
    let result = conn.query_row(
        "SELECT occurrence_rate FROM drift_patterns WHERE id = ?1",
        rusqlite::params![pattern_id],
        |row| row.get::<_, f64>(0),
    );
    match result {
        Ok(v) => Ok(Some(v)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

/// Query false positive rate from drift.db by pattern_id.
pub fn false_positive_rate(conn: &Connection, pattern_id: &str) -> BridgeResult<Option<f64>> {
    let result = conn.query_row(
        "SELECT fp_rate FROM drift_violation_feedback WHERE pattern_id = ?1",
        rusqlite::params![pattern_id],
        |row| row.get::<_, f64>(0),
    );
    match result {
        Ok(v) => Ok(Some(v)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

/// Query constraint verification status from drift.db by constraint_id.
pub fn constraint_verified(conn: &Connection, constraint_id: &str) -> BridgeResult<Option<bool>> {
    let result = conn.query_row(
        "SELECT verified FROM drift_constraints WHERE id = ?1",
        rusqlite::params![constraint_id],
        |row| row.get::<_, bool>(0),
    );
    match result {
        Ok(v) => Ok(Some(v)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

/// Query coupling instability metric from drift.db by module path.
pub fn coupling_metric(conn: &Connection, module_path: &str) -> BridgeResult<Option<f64>> {
    let result = conn.query_row(
        "SELECT instability FROM drift_coupling WHERE module = ?1",
        rusqlite::params![module_path],
        |row| row.get::<_, f64>(0),
    );
    match result {
        Ok(v) => Ok(Some(v)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

/// Query DNA health score from drift.db by project identifier.
pub fn dna_health(conn: &Connection, project: &str) -> BridgeResult<Option<f64>> {
    let result = conn.query_row(
        "SELECT health_score FROM drift_dna WHERE project = ?1",
        rusqlite::params![project],
        |row| row.get::<_, f64>(0),
    );
    match result {
        Ok(v) => Ok(Some(v)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

/// Query test coverage from drift.db by module path.
pub fn test_coverage(conn: &Connection, module_path: &str) -> BridgeResult<Option<f64>> {
    let result = conn.query_row(
        "SELECT coverage FROM drift_test_topology WHERE module = ?1",
        rusqlite::params![module_path],
        |row| row.get::<_, f64>(0),
    );
    match result {
        Ok(v) => Ok(Some(v)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

/// Query error handling gap count from drift.db by module path.
pub fn error_handling_gaps(conn: &Connection, module_path: &str) -> BridgeResult<Option<u32>> {
    let result = conn.query_row(
        "SELECT gap_count FROM drift_error_handling WHERE module = ?1",
        rusqlite::params![module_path],
        |row| row.get::<_, u32>(0),
    );
    match result {
        Ok(v) => Ok(Some(v)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

/// Query decision evidence score from drift.db by decision_id.
pub fn decision_evidence(conn: &Connection, decision_id: &str) -> BridgeResult<Option<f64>> {
    let result = conn.query_row(
        "SELECT evidence_score FROM drift_decisions WHERE id = ?1",
        rusqlite::params![decision_id],
        |row| row.get::<_, f64>(0),
    );
    match result {
        Ok(v) => Ok(Some(v)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

/// Query boundary data score from drift.db by boundary_id.
pub fn boundary_data(conn: &Connection, boundary_id: &str) -> BridgeResult<Option<f64>> {
    let result = conn.query_row(
        "SELECT boundary_score FROM drift_boundaries WHERE id = ?1",
        rusqlite::params![boundary_id],
        |row| row.get::<_, f64>(0),
    );
    match result {
        Ok(v) => Ok(Some(v)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}
