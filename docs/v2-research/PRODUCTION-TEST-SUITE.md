# Drift V2 — Production Test Suite Design

> **Source of truth:** Verified against actual source code in `crates/drift/`, `crates/cortex/`, `crates/cortex-drift-bridge/`, and the [CRITICAL-FLOW-MAP.md](./CRITICAL-FLOW-MAP.md) schema audit (DD-15/DD-16).

---

## Category 1: NAPI Memory & Threading Boundary

Because Rust's rayon and tokio run alongside the Node.js event loop, the biggest risk is thread-affinity and memory exhaustion.

| ID | Test | Parameter | Source Verification |
|----|------|-----------|---------------------|
| T1-01 | **Parallelism Ceiling** — Set `RAYON_NUM_THREADS` to 1, 4, 16, 32. Verify scanner.rs `par_iter()` (line 92) doesn't starve the Node.js event loop during Phase 2 classification. | Success if scan completes for each thread count without Node.js event loop stalls >500ms | `scanner.rs:92` uses `rayon::par_iter()` with `ScanConfig.threads` controlling `ignore::WalkBuilder.threads()` |
| T1-02 | **Buffer Transfer Stress** — Generate a file with 10,000 functions. Assert the NAPI bridge doesn't hit string/buffer limits when passing the massive `ParseResult` (18 fields including `Vec<FunctionInfo>`) from Rust to TypeScript. | Success if all 10,000 functions round-trip through NAPI without truncation or OOM | `ParseResult` has 18 fields; `FunctionInfo` has 18 fields each (verified DD02-E1) |
| T1-03 | **Cancellation Latency** — Trigger `ScanCancellation.cancel()` (using `AtomicBool` with `SeqCst` store in `cancellation.rs:25`) exactly 500ms into a heavy scan. | Success if process terminates in <100ms without orphaned SQLite handles | `cancellation.rs:25` stores `SeqCst`; walker checks `Relaxed` (line 90); scanner checks between phases (line 74, 94) |
| T1-04 | **OnceLock Double-Init Rejection** — Call `driftInitialize()` twice in the same process. | Must return `ALREADY_INITIALIZED` error code, not panic/deadlock | `runtime.rs:138` — `RUNTIME.set()` returns Err on second call |
| T1-05 | **BatchWriter Thread Survival** — Verify the `drift-batch-writer` thread (spawned in `writer.rs:80-83`) survives NAPI garbage collection cycles without being collected. | Thread must remain alive for entire runtime lifetime; `Drop` impl (line 116-121) only sends Shutdown | `writer.rs:80` — `thread::Builder::new().name("drift-batch-writer")` |
| T1-06 | **Concurrent NAPI Calls** — Fire 50 simultaneous `driftScan` + `driftAnalyze` + `driftCheck` calls from JS. | No deadlock on `DatabaseManager.writer` Mutex; read pool distributes correctly | `runtime.rs:29` — `db: DatabaseManager` has `Mutex<Connection>` writer + `ReadPool` readers |
| T1-07 | **AsyncTask Cancellation Propagation** — Start `driftScan` (returns `AsyncTask<ScanTask>`), then call `driftCancelScan()`. | `ScanCancellation.is_cancelled()` must propagate through the rayon `par_iter` (scanner.rs:94-96 returns `None`); Promise must resolve (not reject) with partial results | `scanner.rs:52` — `ScanTask` implements `Task` trait; cancellation via `AtomicBool` |
| T1-08 | **ThreadsafeFunction Progress Delivery** — Call `driftScanWithProgress` on a 500-file repo. Count progress callbacks received in JS. | Callbacks must fire from Rust worker thread to JS main thread without crash; count must be `ceil(500/100)` ≈ 5 progress events | `scanner.rs:99` — progress fires every 100 files via `ThreadsafeFunction<ProgressUpdate, ()>` |
| T1-09 | **NAPI Error Code Propagation** — Call `driftSimulate` with an invalid `task_category` string. | Must return structured `napi::Error` with descriptive message, not panic. Error must be catchable as JS exception. | `advanced.rs` — returns `Result<String>` which napi-rs converts to JS exception on Err |
| T1-10 | **snake_case → camelCase Binding Fidelity** — Load the native `.node` binary and enumerate all exported function names. | All 41 exports must be camelCase (e.g., `driftAnalyze`, NOT `drift_analyze`). Verified against `DRIFT_NAPI_METHOD_NAMES` array in `loader.ts`. | napi-rs v3 auto-converts; `loader.ts` validates all 40 method names at load time |
| T1-11 | **Stub Fallback on Missing Binary** — Call `loadNapi()` when no `.node` binary exists. | Must return `createStubNapi()` (not throw). All 40 stub methods must return safe empty defaults (empty arrays, false, void). | `loader.ts` — `loadNapi()` catches load failure, falls back to stub |

---

## Category 2: SQLite / WAL Concurrency

Drift V2 relies on a `BatchWriter` (bounded channel, 1024 capacity, 500-batch threshold) and a `ReadPool` (default 4 / max 8).

| ID | Test | Parameter | Source Verification |
|----|------|-----------|---------------------|
| T2-01 | **Write-Write Conflict** — Simulate two simultaneous `driftAnalyze` calls that both send BatchCommands. | System must serialize via BatchWriter's single channel; no SQLITE_BUSY because `with_immediate_transaction` acquires write lock at BEGIN (writer.rs) | `writer.rs:24` — `CHANNEL_BOUND: 1024`; `connection/writer.rs:17` — `BEGIN IMMEDIATE` |
| T2-02 | **WAL Checkpoint Pressure** — Run a scan that modifies 5,000 files, triggering 5,000 `UpsertFileMetadata` commands. Monitor `-wal` file size. | `-wal` must truncate after `DatabaseManager.checkpoint()` (PRAGMA wal_checkpoint(TRUNCATE)) | `connection/mod.rs:81-88` — `checkpoint()` calls `PRAGMA wal_checkpoint(TRUNCATE)` |
| T2-03 | **Retention Tier Logic** — Create a `file_metadata` entry, delete the file from disk, run scan. | Entry should appear in `ScanDiff.removed` (via `compute_diff` line 112-115), not be instantly purged | `incremental.rs:112-116` — files in cache but not on disk → `diff.removed` |
| T2-04 | **Channel Backpressure** — Flood the BatchWriter with >1024 commands without flushing. | Sender must block (bounded channel semantics); no data loss after channel drains | `writer.rs:24` — `bounded(CHANNEL_BOUND)` where `CHANNEL_BOUND = 1024` |
| T2-05 | **Batch Atomicity on Failure** — Inject a constraint violation mid-batch (e.g., duplicate PK). Verify the entire batch rolls back. | Buffer must be retained on rollback (line 180 iterates by reference, buffer only cleared after commit on line 323) | `writer.rs:178-180` — iterates `buffer.iter()` not consuming; line 323 — `buffer.clear()` only after `tx.commit()` |
| T2-06 | **Flush Timeout Drain** — Send 499 commands (below `BATCH_SIZE=500`), then wait >100ms. | Auto-flush must trigger on `FLUSH_TIMEOUT` (100ms) even though batch threshold not reached | `writer.rs:26` — `FLUSH_TIMEOUT: Duration::from_millis(100)`; line 145-148 — timeout path flushes non-empty buffer |
| T2-07 | **ReadPool Round-Robin Under Contention** — Spawn 8 concurrent read operations. | `AtomicUsize` round-robin (pool.rs:65) distributes across all 4 connections; no single-connection bottleneck | `pool.rs:65` — `fetch_add(1, Relaxed) % connections.len()` |
| T2-08 | **In-Memory BatchWriter Isolation** — In-memory mode: write via BatchWriter, read via `with_reader`. | Reads must NOT see batch writes (in-memory connections are separate DBs). This is a documented caveat. | `connection/mod.rs:97-98` — "batch writes won't be visible to the main writer — use only for testing" |
| T2-09 | **Writer Mutex Poison Recovery** — Panic inside `with_writer` closure. Subsequent `with_writer` call. | Must return `"write lock poisoned"` error, not hang | `connection/mod.rs:66-68` — `self.writer.lock().map_err(...)` |
| T2-10 | **ReadPool Poison Recovery** — Panic inside `with_reader` closure. Subsequent reads. | Must return `"read pool lock poisoned"` error for the poisoned slot; other slots continue working | `pool.rs:68-70` — per-connection `Mutex` means only one slot is poisoned |
| T2-11 | **Writer Pragma Verification** — After `DatabaseManager::open()`, query all 8 writer pragmas. | `journal_mode=wal`, `synchronous=1` (NORMAL), `foreign_keys=ON`, `cache_size=-64000`, `mmap_size=268435456`, `busy_timeout=5000`, `temp_store=2` (MEMORY), `auto_vacuum=2` (INCREMENTAL) | `pragmas.rs` — applies all 8 pragmas to writer connection |
| T2-12 | **Reader Pragma Isolation** — After open, query reader pragmas. | `query_only=ON`, `cache_size=-64000`, `mmap_size=268435456`, `busy_timeout=5000`. Writers must NOT have `query_only=ON`. | `pool.rs` — readers opened with `SQLITE_OPEN_READ_ONLY` + read pragmas |
| T2-13 | **File-Backed vs In-Memory Mode Behavioral Diff** — Run the same write+read sequence in both modes. | File-backed: BatchWriter writes visible to readers (WAL). In-memory: BatchWriter writes **invisible** to readers (separate DBs). Test must assert this documented caveat. | `connection/mod.rs:97-98` — in-memory caveat documented |

---

## Category 3: Intelligence Precision

Bayesian confidence scoring and DNA profiling are statistically driven — they can drift into inaccuracy.

| ID | Test | Parameter | Source Verification |
|----|------|-----------|---------------------|
| T3-01 | **Bayesian Convergence** — Feed `PatternIntelligencePipeline` 100 identical "False Positive" feedback loops via `InMemoryFeedbackStore.record()`. | `posterior_mean` must drop below `Uncertain` tier threshold (<0.50). Tier assignment: `types.rs:64-74` | `scorer.rs:151-157` — feedback adjustments applied as `(final_alpha + alpha_delta).max(0.01)`. Tiers: Established≥0.85, Emerging≥0.70, Tentative≥0.50, Uncertain<0.50 |
| T3-02 | **DNA Allele Consistency** — Use `GeneExtractorRegistry.with_all_extractors()` (10 extractors) to analyze a repo with 50% camelCase / 50% snake_case naming. | `dna_mutations` must flag both as inconsistent; dominant allele `frequency` ≥ 0.3 required for dominance (extractor.rs:84) | `extractor.rs:82-89` — dominant = highest frequency, must be ≥0.30; `consistency = alleles[0].frequency - alleles[1].frequency` (line 98-99) |
| T3-03 | **Taint Reachability Depth** — Set `max_depth` for `reachability_forward` to 5, 10, 50. | Execution time must scale linearly (not exponentially) when traversing the petgraph directed graph | `reachability/mod.rs` — auto-selects petgraph (<10K nodes) vs SQLite CTE (≥10K nodes) |
| T3-04 | **Confidence Tier Boundary Precision** — Create patterns with `posterior_mean` at exactly 0.50, 0.70, 0.85. | Must classify as Tentative, Emerging, Established respectively (no off-by-one at boundaries) | `types.rs:64-74` — `>=0.85` Established, `>=0.70` Emerging, `>=0.50` Tentative, `<0.50` Uncertain |
| T3-05 | **Temporal Decay Symmetry** — Score a pattern, then simulate 90 days of inactivity via `score_with_momentum`. | Both `alpha` AND `beta` must decay proportionally (preserving `posterior_mean` but widening credible interval) | `scorer.rs:216-222` — `score.alpha *= decay; score.beta *= decay;` then recomputes posterior_mean |
| T3-06 | **Feedback Loop Saturation** — Apply 10,000 dismiss feedback events to the same pattern. | `alpha` must never go below 0.01 (floor in scorer.rs:154); posterior_mean must not become NaN/Inf | `scorer.rs:154` — `.max(0.01)` floor on both alpha and beta after adjustment |
| T3-07 | **6-Factor Weight Invariant** — Verify that `WEIGHT_FREQUENCY + WEIGHT_CONSISTENCY + WEIGHT_AGE + WEIGHT_SPREAD + WEIGHT_MOMENTUM + WEIGHT_DATA_QUALITY == 1.0`. | Exact equality within f64 epsilon | `factors.rs:13-18` — 0.25 + 0.20 + 0.10 + 0.15 + 0.15 + 0.15 = 1.0 |
| T3-08 | **DataQuality Factor Impact** — Score the same pattern with `data_quality=0.3` vs `data_quality=0.9`. | Low quality must produce lower composite score; weight is 0.15 of total | `factors.rs:158-162` — clamped to [0.0, 1.0]; default is 0.7 |
| T3-09 | **Credible Interval Numerical Stability** — Compute CI with alpha=1e7, beta=1.0 (extreme skew). | Must return finite (low, high) values without NaN/Inf. Guard at beta.rs:77-81 | `beta.rs:77-81` — extreme values (>1e6) use mean±epsilon instead of inverse CDF |
| T3-10 | **Convention Persistence Across Runs** — Run pipeline twice with same matches using `InMemoryConventionStore`. | `scan_count` must increment; `discovery_date` preserved; `last_seen` updated | `pipeline.rs:266-282` — test already exists (PIT-INT-06) but needs DB-backed variant |
| T3-11 | **Outlier Detection Minimum Sample** — Feed outlier detector with <3 confidence values. | Must skip outlier detection (not crash); pipeline.rs line 117 filters `>=3` | `pipeline.rs:117` — `.filter(|p| p.confidence_values.len() >= 3)` |

---

## Category 4: Cross-System Bridge Grounding

The bridge between drift.db and cortex.db is the most complex inter-system link.

| ID | Test | Parameter | Source Verification |
|----|------|-----------|---------------------|
| T4-01 | **Link Translation — Broken Link** — Create a Cortex memory referencing a `file_id` in Drift. Delete that file's metadata. | Link translation must return "Broken Link" status, not null pointer/panic | Bridge `link_translation` module (tested in `link_translation_test.rs`) |
| T4-02 | **Grounding Score Weights** — Test all 10 evidence types. A change in `enforcement_status` (new violation) must trigger recalculation. | Grounding score must update for all associated memories within next loop iteration | Bridge `ground_single()` — Bug #6 fix ensured `_drift_db` parameter is not silently ignored |
| T4-03 | **Prepopulated vs Drift DB Fallback** — Provide `MemoryForGrounding` with some fields populated, others None, with drift_db available. | Prepopulated fields must take priority; missing fields must fall back to drift.db queries | Bug #6 fix: `collect_evidence()` uses HashSet of covered EvidenceTypes; pre-populated wins |
| T4-04 | **No Evidence Context = No Fallback** — Provide drift_db but no `evidence_context`. | Must return `InsufficientData`, not attempt DB queries | `enterprise_final_gaps_test.rs` — `no_evidence_context_means_no_fallback` |
| T4-05 | **Atomic Link Removal Race** — Concurrently call `remove_*_link` from 10 threads on the same link. | Must not crash or double-delete; SQL DELETE is idempotent | `link_ops.rs` — 4 atomic `remove_*_link` functions (P2-11/E-04 fix) |
| T4-06 | **Bridge Schema Triple-Duplication** — Verify `schema.rs`, `migrations.rs`, and `tables.rs` produce identical DDL. | Column names, types, and constraints must match across all 3 locations | Known tech debt: schema DDL is triple-duplicated |

---

## Category 5: Analysis Pipeline Integrity

The 4-phase analysis pipeline (AST → String → Regex → Resolution) has critical ordering and data flow dependencies.

| ID | Test | Parameter | Source Verification |
|----|------|-----------|---------------------|
| T5-01 | **Phase Ordering Invariant** — Run `analyze_file()` and verify phase_times_us[0..3] are all populated. | All 4 phases must execute in order; each must record non-zero timing | `pipeline.rs:58-86` — phases 1-4 with `Instant::now()` timing |
| T5-02 | **Resolution Index Accumulation** — Analyze 100 files via `analyze_files()`. Verify `ResolutionIndex` accumulates entries from ALL files, not just the last. | `resolution_entries` count must grow monotonically across files | `pipeline.rs:96-106` — single `resolution_index` shared across all files |
| T5-03 | **ParseResult Completeness Cascade** — Analyze a file where `ParseResult.functions` is empty. | Analysis must still complete (patterns, strings, regex all work); only resolution is degraded | `pipeline.rs:59` — `DetectionContext::from_parse_result()` should handle empty functions |
| T5-04 | **Incremental Skip Correctness** — Scan a repo, modify 1 file, re-scan. | `IncrementalAnalyzer.files_to_analyze()` must return only the 1 modified file + 0 added; unchanged files skipped | `engine/incremental.rs:33-43` — returns `added + modified` only |
| T5-05 | **Content Hash L2 Skip** — Touch file mtime without changing content. | mtime changes → triggers L2 content hash check → same hash → classified as `Unchanged` | `scanner/incremental.rs:46-84` — Level 1 fails, Level 2 compares content_hash |
| T5-06 | **File Removal Detection** — Delete a file between scans. | Must appear in `ScanDiff.removed`; `IncrementalAnalyzer.remove_files()` must clean up tracked hashes | `scanner/incremental.rs:112-116` — cache keys not in seen_paths → removed |
| T5-07 | **Deterministic Scan Output** — Scan the same directory twice. | `ScanDiff.added`, `.modified`, `.removed`, `.unchanged` must be sorted identically both times | `scanner/incremental.rs:118-122` — explicit `.sort()` on all 4 lists |
| T5-08 | **Language Detection Coverage** — Include files with all 18+ supported extensions. | Each must be classified with correct `Language` enum variant, not `None` | `language_detect.rs` — `Language::from_extension()` |

---

## Category 6: Enforcement Gate Orchestration

6 gates with DAG-based topological sort, 30s timeout, and dependency cascading.

| ID | Test | Parameter | Source Verification |
|----|------|-----------|---------------------|
| T6-01 | **Circular Dependency Detection** — Register gates with A→B→C→A cycle. | `topological_sort()` must return `"Circular dependency detected"` error | `orchestrator.rs:198-199` — `sorted.len() != self.gates.len()` check |
| T6-02 | **Dependency Cascade Skip** — Fail PatternCompliance gate. Verify dependent gates are skipped (not failed). | Skipped gates get `GateStatus::Skipped` with `passed=true` and message listing failed deps | `orchestrator.rs:85-97` — `deps_met` check; `GateResult::skipped()` |
| T6-03 | **Timeout Enforcement** — Create a gate that sleeps for 35s. | Orchestrator must mark it `GateStatus::Errored` with timeout message (30s default) | `orchestrator.rs:107-117` — checks `elapsed > self.gate_timeout` AFTER execution |
| T6-04 | **Empty GateInput — PatternCompliance** — Call orchestrator with default (empty) `GateInput`. | PatternCompliance must PASS (not skip); this is the only gate that passes on empty input | DD08-E1: PatternCompliance is unique — passes on empty; others skip |
| T6-05 | **Empty GateInput — Other 5 Gates** — Call each of SecurityBoundaries, TestCoverage, ErrorHandling, ConstraintVerification, Regression with empty input. | All 5 must return `Skipped` status (not silently pass) | Verified in enforcement hardening Phase A |
| T6-06 | **Progressive Enforcement** — Enable progressive config. Submit violations from both old and new files. | New-file violations must have severity downgraded; old-file violations unchanged | `orchestrator.rs:120-133` — checks `new_files` set; applies `progressive.effective_severity()` |
| T6-07 | **Baseline is_new Detection** — Provide `baseline_violations` set. Submit violations matching and not matching the baseline. | Matching violations: `is_new=false`; new violations: `is_new=true`; key format: `"file:line:rule_id"` | `orchestrator.rs:136-144` — checks `input.baseline_violations.contains(&key)` |
| T6-08 | **Gate Execution Timing** — Run all 6 gates. | Every `GateResult.execution_time_ms` must be >0 and reflect actual wall time | `orchestrator.rs:104` — `result.execution_time_ms = elapsed.as_millis() as u64` |
| T6-09 | **Custom Gate Registration** — Use `GateOrchestrator::with_gates()` to register a custom gate. | Custom gate must execute in topo-sorted order alongside built-in gates | `orchestrator.rs:42-48` — `with_gates()` accepts arbitrary `Vec<Box<dyn QualityGate>>` |
| T6-10 | **Suppression Format Coverage (4 formats)** — Create violations on lines with `// drift-ignore`, `# noqa`, `// eslint-disable-next-line`, and `@SuppressWarnings("rule")`. | All 4 formats must suppress their respective violations. Must work on BOTH current line (inline) and line above (next-line directive). | `suppression.rs` — `SuppressionChecker` checks 4 formats bidirectionally |
| T6-11 | **Suppression Rule-Specific Filtering** — Add `// drift-ignore rule_a` on a line with `rule_a` and `rule_b` violations. | Only `rule_a` suppressed; `rule_b` still reported. Bare `// drift-ignore` (no rule list) suppresses ALL rules on that line. | `suppression.rs` — parses optional comma-separated rule list after directive |
| T6-12 | **Quick-Fix Language Awareness** — Generate quick fixes for `WrapInTryCatch` in Python, Rust, Go, Java, Ruby, C#, and JS. | Each language must get its own template (try/except for Python, match/? for Rust, if err for Go, etc.) — NOT JS try/catch for all. | `quick_fixes.rs` — 7 language-specific templates per strategy |
| T6-13 | **Policy Engine — All 4 Aggregation Modes** — Evaluate the same gate results under AllMustPass, AnyMustPass, Weighted, and Threshold modes. | AllMustPass: 1 fail → overall fail. AnyMustPass: 1 pass → overall pass. Weighted: use PC:0.25/CV:0.20/SB:0.25/TC:0.15/EH:0.10/R:0.05 weights. Threshold: pass if score ≥ threshold. | `policy/engine.rs` — 4 `AggregationMode` variants; `policy/types.rs` — 3 presets (Strict/Standard/Lenient) |
| T6-14 | **FP Rate Auto-Disable** — Set FP rate to 25% for a pattern sustained over 30+ days (>10 findings). | `FeedbackTracker.is_detector_disabled()` must return true. `RulesEvaluator` must downgrade severity one level (Error→Warning). | `tracker.rs` — alert at 10% FP, auto-disable at 20% sustained 30d; `evaluator.rs` — FP downgrade |
| T6-15 | **Feedback Abuse Detection** — Record 50 dismiss actions from the same author within 1 hour. | Must flag the author as suspicious via abuse detection threshold. | `tracker.rs` — per-author dismiss timestamps, threshold window |
| T6-16 | **Progressive Enforcement 4-Phase Ramp** — Set `ramp_up_days=100`. Test at day 10 (10%), 30 (30%), 60 (60%), 100 (100%). | Day 10: all→Info. Day 30: Error→Warning, Warning→Info. Day 60: Error stays, Warning→Warning. Day 100: full enforcement. New files always get full enforcement. | `progressive.rs` — 4-phase ramp: <25%, <50%, <75%, ≥100% |

---

## Category 7: BatchCommand Coverage & WriteStats Accuracy

33 data-carrying + 2 control = 35 total BatchCommand variants. Each must round-trip through the writer.

| ID | Test | Parameter | Source Verification |
|----|------|-----------|---------------------|
| T7-01 | **All 33 Data Commands Round-Trip** — Send one of each data-carrying BatchCommand variant through BatchWriter. Verify WriteStats counters. | Every `WriteStats` field must be >0 for its corresponding command type | `writer.rs:30-65` — 33 counter fields in WriteStats |
| T7-02 | **Flush + Shutdown Control Commands** — Send Flush followed by Shutdown. | `flushes` counter must increment on Flush; Shutdown must drain buffer and join thread | `writer.rs:132-138` — Flush calls `flush_buffer`; `writer.rs:104-113` — Shutdown joins handle |
| T7-03 | **Mixed Batch Transaction** — Send 500 diverse commands (mix of UpsertFileMetadata, InsertFunctions, InsertDetections). | All must be committed in a single transaction (one `tx.commit()` call); WriteStats must sum correctly | `writer.rs:141-142` — triggers flush at `buffer.len() >= BATCH_SIZE` |
| T7-04 | **Drop Without Shutdown** — Drop BatchWriter without calling `shutdown()`. | `Drop` impl must send Shutdown signal; thread must not leak | `writer.rs:116-121` — `Drop` sends `BatchCommand::Shutdown` |
| T7-05 | **13 Unwired Tables** — Verify that constraints, constraint_verifications, test_coverage, audit_snapshots, health_trends, feedback, policy_results, simulations, decisions, context_cache, migration_projects, migration_modules, migration_corrections can be written directly (not via BatchWriter). | Direct SQL INSERT via `with_writer()` must succeed for all 13 tables | DD-15 finding: 13 tables have no BatchCommand variant |

---

## Category 8: Migration & Schema Evolution

7 migration files (v001–v007), v006 has PART2 split.

| ID | Test | Parameter | Source Verification |
|----|------|-----------|---------------------|
| T8-01 | **Fresh DB — All 45 Tables Created** — Open a fresh database. | All 45 tables must exist with correct column counts matching DD-15 audit (398 total columns) | `migrations/mod.rs` — runs v001 through v007 in order |
| T8-02 | **Idempotent Re-Open** — Open, close, re-open the same database. | No "table already exists" errors; migration system must detect already-applied migrations | `migrations/mod.rs` — `CREATE TABLE IF NOT EXISTS` or version tracking |
| T8-03 | **v006 PART2 Execution** — Verify both `MIGRATION_SQL` and `MIGRATION_SQL_PART2` from v006 run. | Tables from Part 1 (violations, gate_results) AND Part 2 (audit_snapshots through degradation_alerts) must all exist | `migrations/mod.rs` — explicitly executes `v006_enforcement::MIGRATION_SQL_PART2` |
| T8-04 | **Foreign Key Integrity** — Insert into `constraint_verifications` with invalid `constraint_id`. | Must fail (FK constraint violation) if foreign keys are enabled | v005: `constraint_verifications.constraint_id` → `constraints(id)` |
| T8-05 | **FK Cascade — migration_modules** — Delete a `migration_projects` row. | `migration_modules` rows referencing it must be handled (CASCADE or error depending on DDL) | v007: `migration_modules.project_id` → `migration_projects(id)` |
| T8-06 | **WAL Mode Verification** — After fresh `DatabaseManager::open()`. | `PRAGMA journal_mode` must return `wal` | `pragmas.rs` — applies WAL mode pragma |

---

## Category 9: Incremental Scan Precision

Two-level detection (mtime → content hash) determines what gets re-analyzed.

| ID | Test | Parameter | Source Verification |
|----|------|-----------|---------------------|
| T9-01 | **mtime Fast Path Hit Rate** — Scan a 1,000-file repo, no changes, re-scan. | `cache_hit_rate` must be ~1.0; `hashing_ms` should be near zero (no content reads) | `scanner.rs:136-144` — computes cache_hit_rate from Unchanged count |
| T9-02 | **mtime Change + Same Content** — Touch a file's mtime without modifying content. | L1 (mtime) fails → L2 (content hash) kicks in → classified as `Unchanged` (not Modified) | `incremental.rs:46-84` — Level 2 compares xxh3 hash |
| T9-03 | **force_full_scan Bypass** — Set `force_full_scan=true`. Scan unchanged repo. | ALL files must be classified as Added or Modified (mtime check bypassed); `cache_hit_rate` ~0.0 | `incremental.rs:46` — `if !force_full` check |
| T9-04 | **Large File Skip** — Set `max_file_size` to 100 bytes. Include a 1MB file. | Large file must be excluded by walker (line 59: `max_filesize` override) | `walker.rs:59` — `builder.max_filesize(Some(max_file_size))` |
| T9-05 | **Symlink Following** — Create symlinks in scan directory with `follow_symlinks=true`. | Walker must follow symlinks and discover target files | `walker.rs:50` — `builder.follow_links(follow_links)` |
| T9-06 | **.driftignore Respect** — Create `.driftignore` with patterns. | Walker must skip matching files (line 58: custom ignore filename) | `walker.rs:58` — `.add_custom_ignore_filename(".driftignore")` |
| T9-07 | **18 Default Ignore Patterns** — Include directories matching all 18 `DEFAULT_IGNORES`. | All 18 must be skipped (node_modules, .git, dist, build, target, .next, etc.) | `walker.rs:16-35` — `DEFAULT_IGNORES` constant with 18 entries |
| T9-08 | **Cancellation Mid-Walk** — Cancel during Phase 1 (file discovery). | Must return `partial_diff` with empty entries but preserve `discovery_ms` | `scanner.rs:74-76` — returns `partial_diff` on cancellation after discovery |
| T9-09 | **Cancellation Mid-Hash** — Cancel during Phase 2 (par_iter hashing). | `par_iter` filter_map returns `None` on cancellation (line 94-96); partial results collected | `scanner.rs:94-96` — `if self.cancellation.is_cancelled() { return None; }` |
| T9-10 | **Event Emission Sequence** — Verify DriftEventHandler receives events in order. | `on_scan_started` → `on_scan_progress(0, total)` → `on_scan_progress(N, total)` → `on_scan_complete` | `scanner.rs:52-55, 79-82, 99-103, 164-170` — event emission points |

---

## Category 10: Reporter Format Correctness

8 report formats, each with format-specific correctness requirements.

| ID | Test | Parameter | Source Verification |
|----|------|-----------|---------------------|
| T10-01 | **SARIF Taxonomy Placement** — Generate SARIF report with CWE and OWASP violations. | Taxonomies must be in `runs[0].taxonomies` and relationships in `rules[0].relationships` — NOT in `results[0].taxa` | Bug fix: `critical_sarif_both_cwe_and_owasp` corrected the path |
| T10-02 | **JUnit Error/Failure Semantics** — Generate JUnit report with both errors and failures. | Errors = infrastructure problems; Failures = assertion violations. These must NOT be swapped. | Bug fix in Phase C: JUnit errors/failures semantics were swapped |
| T10-03 | **SonarQube Rules Array** — Generate SonarQube report. | Must include `rules` array (required since SonarQube 10.3), not just issues | Known gap: SonarQube reporter was missing rules array |
| T10-04 | **Console Report Readability** — Generate console report for 50+ violations. | Must include severity counts, file grouping, and quick-fix suggestions | Reporter trait interface verified |
| T10-05 | **JSON Report Schema Stability** — Generate JSON report across two versions. | Output structure must be stable; field names must not change between runs | Regression guard for CI consumers |
| T10-06 | **GitHub Annotations Format** — Generate GitHub report with Error, Warning, Info, and Hint violations. | Error→`failure`, Warning→`warning`, Info/Hint→`notice`. `raw_details` must contain CWE+OWASP. | `github.rs` — Code Quality annotation format |
| T10-07 | **GitLab Code Quality Fingerprints** — Generate GitLab report with 2 violations on the same file:line but different rule_ids. | Fingerprints must differ (hash includes rule_id + file + line). Categories must be inferred from rule_id prefix. | `gitlab.rs` — fingerprint = hash(rule_id + file + line) for dedup |
| T10-08 | **HTML Report Generation** — Generate HTML report with mixed severity violations. | Must produce valid HTML with embedded CSS styling. Must be viewable in a browser. | `html.rs` — full HTML report with styling |
| T10-09 | **All 8 Formats via driftReport()** — Call `driftReport(format)` for each of: sarif, json, console, html, junit, sonarqube, github, gitlab. | Each must return non-empty string and not error. Reporter name must match format string. | `enforcement.rs` — `drift_report()` dispatches to `Reporter` trait implementations |
| T10-10 | **SARIF isNew Property** — Generate SARIF with both new and baseline violations. | `properties.isNew` must be `true` for new violations, `false` for baseline matches. Quick fixes must appear as `fixes[0].description`. | `sarif.rs` — properties include isNew; quick fixes as SARIF fix objects |

---

## Category 11: Contract Extraction Precision

14 endpoint extractors, 5/19 breaking change types, field extraction currently empty.

| ID | Test | Parameter | Source Verification |
|----|------|-----------|---------------------|
| T11-01 | **Next.js Backend Classification** — Extract contracts from Next.js API routes (`pages/api/` or `app/api/`). | Must classify as backend (`paradigm: "rest"`), not frontend. Next.js is in `backend_frameworks` array. | Bug #1 fix: added "nextjs" to `backend_frameworks` in `analysis.rs` and `structural.rs` |
| T11-02 | **Paradigm Classification** — Extract from Express, tRPC, and frontend files. | Express → `"express"`, tRPC → `"rpc"`, Frontend → `"frontend"` (NOT all `"rest"`) | Bug #2 fix: paradigm derived from framework name, not hardcoded |
| T11-03 | **Confidence from Field Quality** — Extract contracts with and without request/response fields. | Fields extracted → confidence 0.9; No fields → confidence 0.6 (NOT hardcoded 0.8) | Bug #3 fix: confidence varies based on field extraction quality |
| T11-04 | **Contract Upsert Idempotency** — Insert same contract ID twice. | `INSERT OR REPLACE` semantics → 1 row in `contracts` table | CT-ADV-13: Contract upsert produces 1 row |
| T11-05 | **Mismatch Accumulation** — Insert same mismatch twice. | `INSERT` (not upsert) semantics → 2 rows in `contract_mismatches` table | CT-ADV-14: Mismatches accumulate |
| T11-06 | **Empty Batch Commands** — Send empty Vec to `InsertContracts` and `InsertContractMismatches`. | Must not crash; WriteStats counters remain 0 | CT-ADV-15: Empty batch safety |
| T11-07 | **Disjoint BE/FE Paths** — Backend endpoints at `/api/users`, frontend calls to `/api/orders`. | Matching must produce 0 mismatches (no false positives from partial path overlap) | CT-ADV-09: Disjoint paths = 0 matches |
| T11-08 | **Type Mismatch Detection** — Backend field `age: number`, frontend field `age: string`. | Must detect and report `TypeMismatch` in `contract_mismatches` table | CT-ADV-04: Type mismatch detection |

---

## Category 12: Event System & DriftEventHandler

24 event methods on the `DriftEventHandler` trait; `EventDispatcher` fans out to multiple handlers.

| ID | Test | Parameter | Source Verification |
|----|------|-----------|---------------------|
| T12-01 | **Full Event Sequence** — Run a complete scan→analyze→check pipeline. Record all events. | Must observe the complete event sequence without gaps or duplicates | `DriftEventHandler` trait — 24 event methods (DD01-O5) |
| T12-02 | **EventDispatcher Fan-Out** — Register 3 handlers. Emit one event. | All 3 handlers must receive the event; order must be registration order | `EventDispatcher::new()` in `runtime.rs:120` |
| T12-03 | **Progress Event Frequency** — Scan 10,000 files. Count `on_scan_progress` calls. | Must fire every 100 files (scanner.rs:99 — `if count % 100 == 0`) | `scanner.rs:99` — modulo 100 progress emission |
| T12-04 | **Error Event on Walker Failure** — Point scanner at nonexistent directory. | `on_scan_error` must fire with descriptive message before returning Err | `scanner.rs:66-69` — emits `ScanErrorEvent` then returns Err |

---

## Category 13: Retention & Data Lifecycle

4-tier retention system (Current/orphan, Short 30d, Medium 90d, Long 365d).

| ID | Test | Parameter | Source Verification |
|----|------|-----------|---------------------|
| T13-01 | **constraint_verifications Column Name** — Run retention cleanup on `constraint_verifications` table. | Must use `verified_at` column (NOT `created_at`) for age calculation | Bug found and fixed: `retention.rs` line 128 was using wrong column |
| T13-02 | **Orphan Cleanup Atomicity** — Delete 1000 orphaned entries. Crash mid-delete. | Transaction must roll back cleanly; no partial cleanup | Retention operates within transactions |
| T13-03 | **Self-Bounding Tables** — Insert into `reachability_cache` (composite PK: source_node + direction). | `INSERT OR REPLACE` semantics must prevent unbounded growth | Self-bounding via PK uniqueness constraints |
| T13-04 | **Tier Assignment Coverage** — Verify every one of the 45 tables is assigned to exactly one retention tier. | No table orphaned from retention policy | DD09-O2: Full tier mapping documented |

---

## Category 14: Configuration & Initialization

`DriftConfig` loading, `ScanConfig` defaults, TOML parsing.

| ID | Test | Parameter | Source Verification |
|----|------|-----------|---------------------|
| T14-01 | **Default ScanConfig Values** — Create `ScanConfig::default()`. | `max_file_size` = 1MB (1_048_576), `threads` = 0 (auto), `incremental` = true | `scan_config.rs:36-48` — verified defaults |
| T14-02 | **Config TOML Round-Trip** — Serialize and deserialize `DriftConfig`. | All fields must survive round-trip without data loss | `DriftConfig::from_toml()` + `serde` |
| T14-03 | **Project Root Fallback** — Initialize runtime with no explicit config. | Must load from `project_root` if available, then fall back to `DriftConfig::default()` | `runtime.rs:56-61` — `DriftConfig::load(root, None).unwrap_or_default()` |
| T14-04 | **extra_ignore Patterns** — Set `extra_ignore = ["*.generated.ts"]`. | Walker must skip matching files in addition to DEFAULT_IGNORES and .driftignore | `walker.rs:73-76` — iterates `config.extra_ignore` |

---

## Summary Matrix

| Category | Tests | Priority | Existing Coverage | Gap |
|----------|-------|----------|-------------------|-----|
| 1. NAPI Threading | 6 | P0 | Minimal (1 napi_test.rs) | **Critical — no concurrency tests** |
| 2. SQLite/WAL Concurrency | 10 | P0 | Partial (connection_test.rs, batch_test.rs) | **Channel backpressure, atomicity, poison** |
| 3. Intelligence Precision | 11 | P1 | Moderate (beta.rs unit tests, pipeline.rs) | **Feedback saturation, temporal decay, tier boundaries** |
| 4. Bridge Grounding | 6 | P1 | Good (13 bridge test files) | **Schema duplication verification** |
| 5. Analysis Pipeline | 8 | P1 | Moderate (e2e_full_pipeline_test.rs) | **Phase ordering, incremental skip, L2 hash** |
| 6. Enforcement Gates | 9 | P1 | Good (enforcement hardening tests) | **Timeout, progressive enforcement, baseline** |
| 7. BatchCommand Coverage | 5 | P1 | Partial (batch_writer_completeness_test.rs) | **13 unwired tables, Drop behavior** |
| 8. Migration/Schema | 6 | P2 | Basic (migration_test.rs) | **FK integrity, PART2, idempotent re-open** |
| 9. Incremental Scan | 10 | P1 | Basic (p0_stress_test.rs) | **L2 skip, cancellation timing, event sequence** |
| 10. Reporter Formats | 5 | P2 | Partial (enforcement SARIF/JUnit fixes) | **SonarQube rules, console readability** |
| 11. Contract Extraction | 8 | P1 | Good (132 e2e + 15 adversarial) | **Next.js, paradigm, field quality** |
| 12. Event System | 4 | P2 | None | **No event sequence tests exist** |
| 13. Retention | 4 | P2 | Partial (retention_integration_test.rs) | **Column name, tier assignment coverage** |
| 14. Configuration | 4 | P2 | Basic (config_test.rs) | **extra_ignore, TOML round-trip** |

**Total: 96 production tests across 14 categories.**

**Recommended implementation order:**
1. **Categories 1 + 2** (P0, 16 tests) — Threading and storage concurrency are production-critical
2. **Categories 5 + 9** (P1, 18 tests) — Pipeline and incremental scan correctness
3. **Categories 3 + 6** (P1, 20 tests) — Intelligence precision and enforcement gates
4. **Categories 7 + 11 + 4** (P1, 19 tests) — BatchCommand, contracts, bridge
5. **Categories 8 + 10 + 12 + 13 + 14** (P2, 23 tests) — Migration, reporters, events, retention, config
