# 04 Call Graph — V2 Recommendations

## Summary

This document provides specific, actionable recommendations for improving Drift's Call Graph system in v2. Recommendations are prioritized by impact and effort, with full citations to external research and internal documentation.

---

## Recommendations

### R1: Implement Taint Analysis Layer

**Priority**: P0 (Critical)
**Effort**: High
**Impact**: Transforms reachability from structural analysis to security analysis

**Current State**:
Drift's reachability analysis tracks call paths from entry points to data accessors, but does not track data transformations along those paths. It cannot distinguish between:
- Data that flows directly to a sink (high risk)
- Data that is sanitized before reaching a sink (low risk)
- Data that is transformed/aggregated (medium risk)

**Proposed Change**:
Add a taint analysis layer on top of the existing call graph:

```typescript
interface TaintSource {
  functionId: string;
  parameterIndex: number;
  sourceType: 'user_input' | 'api_response' | 'file_read' | 'env_var';
}

interface TaintSink {
  functionId: string;
  parameterIndex: number;
  sinkType: 'sql_query' | 'file_write' | 'command_exec' | 'api_call';
}

interface TaintSanitizer {
  functionId: string;
  inputParam: number;
  outputParam: number;  // -1 for return value
  sanitizerType: 'escape' | 'validate' | 'encode' | 'hash';
}

interface TaintFlow {
  source: TaintSource;
  sink: TaintSink;
  path: CallPathNode[];
  sanitizers: TaintSanitizer[];  // Sanitizers along the path
  isSanitized: boolean;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
}
```

**Rationale**:
- Taint analysis is the industry standard for security vulnerability detection
- Drift already has the call graph infrastructure — taint is an incremental addition
- Enables detection of SQL injection, XSS, command injection, path traversal
- Differentiates Drift from tools that only do structural analysis

**Evidence**:
- JetBrains: "Taint analysis traces the flow of untrusted data through your application" ([source](https://www.jetbrains.com/pages/static-code-analysis-guide/what-is-taint-analysis/))
- SonarSource: "Taint analysis is a deep security scan that tracks user-controllable data through your entire application" ([source](https://www.sonarsource.com/solutions/taint-analysis/))
- PyCG paper validates that call graph is prerequisite for taint analysis

**Implementation Notes**:
1. Define source/sink/sanitizer registries per language
2. Extend reachability BFS to track taint labels along paths
3. Add sanitizer detection to data access extractors
4. Expose via MCP tool: `drift_taint_analysis`

**Risks**:
- False positives from imprecise sanitizer detection
- Performance overhead for large codebases
- Complexity of cross-language taint tracking

**Dependencies**:
- Requires accurate call graph (R2, R3)
- Benefits from data access extractors (existing)

---

### R2: Port Per-Language Hybrid Extractors to Rust

**Priority**: P0 (Critical)
**Effort**: High
**Impact**: 10-50x performance improvement, feature parity with TypeScript

**Current State**:
- TypeScript: 8 languages × 3 variants (standard, hybrid, data-access) = 24 extractors
- Rust: 1 universal extractor (language-agnostic)

The Rust UniversalExtractor lacks:
- Per-language specialization (DI patterns, framework decorators)
- Hybrid fallback (tree-sitter + regex)
- ORM-aware data access detection (28+ ORMs in TS)

**Proposed Change**:
Implement per-language hybrid extractors in Rust matching TypeScript feature depth:

```rust
pub trait HybridExtractor: Send + Sync {
    fn language(&self) -> Language;
    fn extract_ast(&self, tree: &Tree, source: &str) -> ExtractionResult;
    fn extract_regex(&self, source: &str) -> ExtractionResult;
    fn extract(&self, tree: Option<&Tree>, source: &str) -> ExtractionResult {
        match tree {
            Some(t) => {
                let ast_result = self.extract_ast(t, source);
                if ast_result.is_complete() {
                    ast_result
                } else {
                    self.merge(ast_result, self.extract_regex(source))
                }
            }
            None => self.extract_regex(source),
        }
    }
    fn merge(&self, ast: ExtractionResult, regex: ExtractionResult) -> ExtractionResult;
}

// Per-language implementations
pub struct TypeScriptHybridExtractor { /* ... */ }
pub struct PythonHybridExtractor { /* ... */ }
pub struct JavaHybridExtractor { /* ... */ }
// ... 8 languages total
```

**Rationale**:
- Hybrid extraction is Drift's key innovation for robustness
- Per-language specialization is required for framework detection
- Rust implementation enables 10-50x speedup over TypeScript
- Unifies extraction logic in single codebase

**Evidence**:
- PyCG achieves 99.2% precision with language-specific analysis ([source](https://ar5iv.labs.arxiv.org/html/2103.00587))
- "Apps built around external frameworks challenge static analyzers" — 61% of methods missed without framework awareness ([source](https://homes.cs.washington.edu/~mernst/pubs/callgraph-soundness-issta2024-abstract.html))
- Drift internal: TypeScript extractors have 8 languages × 3 variants; Rust has 1

**Implementation Notes**:
1. Start with TypeScript/JavaScript (most common)
2. Port Python next (FastAPI, Django, SQLAlchemy)
3. Port Java (Spring Boot patterns)
4. Port remaining languages incrementally

**Risks**:
- Large implementation effort (24 extractors)
- Maintaining parity with TypeScript during migration
- Framework patterns evolve — need update mechanism

**Dependencies**:
- Requires tree-sitter grammars (existing)
- Benefits from R3 (resolution algorithm)

---

### R3: Unify Call Resolution Algorithm (6 Strategies in Rust)

**Priority**: P0 (Critical)
**Effort**: Medium
**Impact**: Improves resolution rate from ~60% to ~80%

**Current State**:
- TypeScript: 6 resolution strategies (same-file, method, DI, import, export, fuzzy)
- Rust: 3 resolution strategies (local, import, export)

Missing in Rust:
- Method resolution via class/receiver type
- DI injection resolution (FastAPI Depends, Spring @Autowired, NestJS @Inject)
- Fuzzy matching for dynamic calls

**Proposed Change**:
Implement full 6-strategy resolution in Rust:

```rust
pub enum ResolutionStrategy {
    SameFile,      // Function defined in same file (highest confidence)
    MethodCall,    // Resolved via class/receiver type
    DIInjection,   // Framework-specific DI patterns
    ImportBased,   // Follow import chains
    ExportBased,   // Match exported names
    Fuzzy,         // Name similarity (lowest confidence)
}

pub struct ResolutionResult {
    target_id: Option<String>,
    strategy: ResolutionStrategy,
    confidence: f32,
    candidates: Vec<String>,  // For polymorphism
}

impl CallResolver {
    pub fn resolve(&self, call: &CallEntry, context: &ResolutionContext) -> ResolutionResult {
        // Try strategies in order, return first match above confidence threshold
        self.try_same_file(call, context)
            .or_else(|| self.try_method_call(call, context))
            .or_else(|| self.try_di_injection(call, context))
            .or_else(|| self.try_import_based(call, context))
            .or_else(|| self.try_export_based(call, context))
            .or_else(|| self.try_fuzzy(call, context))
            .unwrap_or(ResolutionResult::unresolved())
    }
}
```

**Rationale**:
- Resolution rate directly impacts all downstream analysis
- DI injection is critical for modern frameworks (FastAPI, Spring, NestJS)
- Method resolution is required for OOP languages
- Unified algorithm ensures consistency between TS and Rust

**Evidence**:
- PyCG: "We compute all assignment relations between program identifiers... through an inter-procedural analysis" ([source](https://ar5iv.labs.arxiv.org/html/2103.00587))
- Drift internal: TypeScript achieves 60-85% resolution; Rust achieves ~50%

**Implementation Notes**:
1. Port method resolution first (highest impact)
2. Add DI injection patterns per framework
3. Implement fuzzy matching with configurable threshold
4. Add `resolvedCandidates` for polymorphism support

**Risks**:
- Fuzzy matching can introduce false positives
- DI patterns are framework-specific — need registry
- Performance impact of additional strategies

**Dependencies**:
- Requires R2 (per-language extractors for DI detection)
- Benefits from class hierarchy tracking (existing)

---

### R4: Implement Namespace-Based Attribute Resolution

**Priority**: P1 (Important)
**Effort**: Medium
**Impact**: Reduces false positives by 10-20%

**Current State**:
Drift partially implements namespace-based resolution in TypeScript extractors, but Rust uses a simpler approach that can conflate attributes with the same name from different classes.

**Proposed Change**:
Implement full namespace-based attribute resolution following PyCG's approach:

```rust
// Current (field-based): obj.method() → looks up "method" globally
// Proposed (namespace-based): obj.method() → looks up "method" in obj's class hierarchy

pub struct AttributeAccess {
    receiver_type: Option<String>,  // Class/module where attribute is defined
    attribute_name: String,
    namespace: Vec<Definition>,     // Full namespace path
}

impl AttributeResolver {
    pub fn resolve(&self, access: &AttributeAccess, hierarchy: &ClassHierarchy) -> Option<String> {
        // Walk class hierarchy in MRO order
        for class in hierarchy.mro(&access.receiver_type) {
            if let Some(attr) = self.lookup_in_class(&class, &access.attribute_name) {
                return Some(attr);
            }
        }
        None
    }
}
```

**Rationale**:
- PyCG achieves 99.2% precision specifically because of namespace-based resolution
- Duck typing in Python/JavaScript requires distinguishing attributes by namespace
- Reduces false positives from same-named methods in different classes

**Evidence**:
- PyCG: "In Python where duck typing is extensively used, it is important to separate attribute accesses based on the namespace where each attribute is defined" ([source](https://ar5iv.labs.arxiv.org/html/2103.00587))
- PyCG: "Field-based approaches will fail to treat the two invocations as different, causing imprecision"

**Implementation Notes**:
1. Track receiver type during call extraction
2. Build class hierarchy with Method Resolution Order (MRO)
3. Resolve attributes by walking MRO
4. Handle duck typing with fallback to fuzzy matching

**Risks**:
- Requires accurate type inference for receivers
- MRO computation adds complexity
- May reduce recall slightly (stricter matching)

**Dependencies**:
- Requires class hierarchy tracking (existing in Rust)
- Benefits from R2 (per-language extractors)

---

### R5: Add Incremental Call Graph Updates

**Priority**: P1 (Important)
**Effort**: High
**Impact**: 10-100x faster for incremental changes

**Current State**:
Drift rebuilds the entire call graph on every scan. For a 100k LoC codebase, this takes 30-60 seconds even with Rust parallelism.

**Proposed Change**:
Implement incremental updates that only re-process changed files:

```rust
pub struct IncrementalBuilder {
    db: CallGraphDb,
    file_hashes: HashMap<PathBuf, u64>,  // xxhash of file content
}

impl IncrementalBuilder {
    pub fn update(&mut self, changed_files: &[PathBuf]) -> BuildResult {
        // 1. Identify affected functions
        let affected = self.get_affected_functions(changed_files);
        
        // 2. Remove stale data
        self.db.remove_functions_in_files(changed_files);
        
        // 3. Re-extract changed files
        let new_functions = self.extract_files(changed_files);
        
        // 4. Insert new data
        self.db.insert_batch(&new_functions);
        
        // 5. Re-resolve affected calls
        self.resolve_affected_calls(&affected);
        
        // 6. Update indexes
        self.db.rebuild_indexes();
        
        BuildResult { /* ... */ }
    }
}
```

**Rationale**:
- IDE integration requires sub-second response times
- Most changes affect <1% of files
- Incremental updates are standard in modern static analysis tools

**Evidence**:
- Tree-sitter: "Tree-sitter is an incremental parsing library, designed to efficiently update the tree without throwing away work already done" ([source](https://tomassetti.me/incremental-parsing-using-tree-sitter/))
- Demand-driven analysis: "Instead of building complete call graph upfront, build on-demand for specific queries" ([source](https://arxiv.org/html/2305.05949v3))

**Implementation Notes**:
1. Track file content hashes in metadata table
2. Identify changed files via hash comparison
3. Compute affected functions (callers of changed functions)
4. Use SQLite transactions for atomic updates
5. Consider WAL mode for concurrent read/write

**Risks**:
- Complexity of tracking affected functions
- Risk of stale data if update logic has bugs
- May need periodic full rebuild for consistency

**Dependencies**:
- Requires SQLite storage (existing)
- Benefits from file hash tracking (add to metadata)

---

### R6: Implement Impact Analysis in Rust

**Priority**: P1 (Important)
**Effort**: Medium
**Impact**: Enables Rust-native impact queries, 10x faster

**Current State**:
Impact analysis exists only in TypeScript (`impact-analyzer.ts`). Rust has reachability but not impact analysis.

**Proposed Change**:
Port impact analysis to Rust:

```rust
pub struct ImpactAnalyzer {
    db: CallGraphDb,
}

pub struct ImpactResult {
    changed_function: String,
    affected_functions: Vec<String>,
    affected_entry_points: Vec<String>,
    affected_data_paths: Vec<DataPath>,
    risk: RiskLevel,
    blast_radius: BlastRadius,
}

pub struct BlastRadius {
    direct_callers: usize,
    transitive_callers: usize,
    affected_entry_points: usize,
    affected_sensitive_data: usize,
}

impl ImpactAnalyzer {
    pub fn analyze(&self, function_id: &str) -> ImpactResult {
        // 1. Reverse BFS from changed function
        let affected = self.reverse_bfs(function_id);
        
        // 2. Identify affected entry points
        let entry_points = affected.iter()
            .filter(|f| self.is_entry_point(f))
            .collect();
        
        // 3. Identify affected data paths
        let data_paths = self.get_data_paths_through(&affected);
        
        // 4. Calculate risk
        let risk = self.calculate_risk(&affected, &entry_points, &data_paths);
        
        ImpactResult { /* ... */ }
    }
}
```

**Rationale**:
- Impact analysis is graph traversal — ideal for Rust
- Enables native MCP queries without TypeScript overhead
- Consistent with Rust-first v2 architecture

**Evidence**:
- Industry: "Impact analysis is a systematic technique to identify potential consequences of proposed changes" ([source](https://www.gurusoftware.com/the-critical-role-of-impact-analysis-in-software-testing/))
- Drift internal: Impact analysis is CPU-intensive graph traversal

**Implementation Notes**:
1. Implement reverse BFS (similar to inverse reachability)
2. Add entry point and data accessor flags to query
3. Calculate risk based on affected count, entry points, sensitive data
4. Expose via N-API: `analyze_impact(function_id)`

**Risks**:
- Risk calculation heuristics may need tuning
- Large blast radius can be slow to compute
- Need to handle cycles in call graph

**Dependencies**:
- Requires call graph with reverse edges (existing)
- Benefits from entry point detection (existing)

---

### R7: Add Dead Code Detection in Rust

**Priority**: P1 (Important)
**Effort**: Low
**Impact**: Enables Rust-native dead code queries

**Current State**:
Dead code detection exists only in TypeScript (`dead-code-detector.ts`).

**Proposed Change**:
Port dead code detection to Rust:

```rust
pub struct DeadCodeDetector {
    db: CallGraphDb,
}

pub struct DeadCodeCandidate {
    function_id: String,
    confidence: DeadCodeConfidence,
    false_positive_reasons: Vec<FalsePositiveReason>,
}

pub enum FalsePositiveReason {
    EntryPoint,
    FrameworkHook,
    DynamicDispatch,
    EventHandler,
    Exported,
    TestFunction,
}

impl DeadCodeDetector {
    pub fn detect(&self) -> Vec<DeadCodeCandidate> {
        self.db.get_all_functions()
            .filter(|f| f.called_by.is_empty())
            .filter(|f| !self.is_entry_point(f))
            .map(|f| DeadCodeCandidate {
                function_id: f.id,
                confidence: self.calculate_confidence(f),
                false_positive_reasons: self.get_false_positive_reasons(f),
            })
            .collect()
    }
}
```

**Rationale**:
- Dead code detection is set operations — trivial in Rust
- Enables native MCP queries
- Completes the analysis engine migration

**Evidence**:
- Axivion: "Finds dead functions by means of a reachability analysis on the call relation" ([source](https://www.qt.io/product/quality-assurance/axivion/dead-code-analysis))
- Drift internal: Dead code detection is O(V) — single pass through functions

**Implementation Notes**:
1. Query functions with empty `called_by`
2. Filter out entry points, framework hooks, exports
3. Add confidence based on false positive likelihood
4. Expose via N-API: `detect_dead_code()`

**Risks**:
- False positives from dynamic dispatch, reflection
- Framework hooks vary by framework — need registry
- May flag test utilities as dead code

**Dependencies**:
- Requires call graph with reverse edges (existing)
- Benefits from entry point detection (existing)

---

### R8: Implement SQLite Recursive CTEs for Reachability

**Priority**: P2 (Nice to have)
**Effort**: Medium
**Impact**: 2-5x faster for deep reachability queries

**Current State**:
Drift's SQLite reachability engine uses BFS with multiple queries. Each hop requires a separate SQL query.

**Proposed Change**:
Use recursive CTEs for single-query reachability:

```sql
WITH RECURSIVE reachable AS (
    -- Base case: starting function
    SELECT id, name, file, 0 as depth
    FROM functions
    WHERE id = ?
    
    UNION ALL
    
    -- Recursive case: follow call edges
    SELECT f.id, f.name, f.file, r.depth + 1
    FROM functions f
    JOIN call_edges e ON e.callee_id = f.id
    JOIN reachable r ON e.caller_id = r.id
    WHERE r.depth < ?  -- max depth
    AND f.id NOT IN (SELECT id FROM reachable)  -- avoid cycles
)
SELECT DISTINCT * FROM reachable;
```

**Rationale**:
- Single query vs N queries for N-hop reachability
- SQLite optimizes recursive CTEs internally
- Reduces round-trip overhead

**Evidence**:
- SQLite forum: "Use EXCEPT or NOT IN to avoid revisiting nodes in recursive CTEs" ([source](https://www.sqlite.org/forum/info/1887d3c885ef7284))
- Drift internal: Current BFS requires O(depth) queries

**Implementation Notes**:
1. Benchmark CTE vs BFS for various depths
2. Add cycle detection via `NOT IN` clause
3. Consider materialized path for very deep queries
4. Keep BFS as fallback for complex filters

**Risks**:
- CTE performance varies by query complexity
- Cycle detection adds overhead
- May not be faster for shallow queries

**Dependencies**:
- Requires SQLite storage (existing)
- Independent of other recommendations

---

### R9: Add Cross-Service Reachability

**Priority**: P2 (Nice to have)
**Effort**: High
**Impact**: Enables microservice architecture analysis

**Current State**:
Drift analyzes single services. API calls to other services are treated as external calls with no further analysis.

**Proposed Change**:
Track API calls between services and link call graphs:

```typescript
interface ServiceEndpoint {
  serviceId: string;
  method: HttpMethod;
  path: string;
  functionId: string;  // Handler function
}

interface CrossServiceCall {
  callerServiceId: string;
  callerFunctionId: string;
  targetServiceId: string;
  targetEndpoint: ServiceEndpoint;
  confidence: number;
}

interface CrossServiceReachability {
  origin: CodeLocation;
  servicePath: ServiceHop[];  // Service A → Service B → Service C
  finalDataAccess: DataAccessPoint[];
}
```

**Rationale**:
- Modern applications are microservices
- Security vulnerabilities can span services
- Data flows across service boundaries

**Evidence**:
- Oligo: "Internet reachability prioritizes vulnerabilities based on exposure to internet-facing systems" ([source](https://www.oligo.security/academy/reachability-analysis-5-techniques-and-5-critical-best-practices))
- Drift internal: No cross-service analysis currently

**Implementation Notes**:
1. Detect API client calls (fetch, axios, http)
2. Match calls to known service endpoints
3. Link call graphs across services
4. Extend reachability to cross service boundaries

**Risks**:
- Requires service discovery/configuration
- API paths may be dynamic
- Significant complexity increase

**Dependencies**:
- Requires contract detection (existing)
- Benefits from endpoint extraction (existing)

---

### R10: Add Reachability Result Caching

**Priority**: P2 (Nice to have)
**Effort**: Low
**Impact**: 10x faster for repeated queries

**Current State**:
Reachability queries are computed fresh each time. No caching of results.

**Proposed Change**:
Add LRU cache for reachability results:

```rust
pub struct CachedReachabilityEngine {
    engine: ReachabilityEngine,
    cache: LruCache<ReachabilityKey, ReachabilityResult>,
}

#[derive(Hash, Eq, PartialEq)]
struct ReachabilityKey {
    origin: String,
    max_depth: u32,
    sensitive_only: bool,
    tables: Vec<String>,
}

impl CachedReachabilityEngine {
    pub fn get_reachable_data(&mut self, options: &ReachabilityOptions) -> ReachabilityResult {
        let key = ReachabilityKey::from(options);
        
        if let Some(cached) = self.cache.get(&key) {
            return cached.clone();
        }
        
        let result = self.engine.get_reachable_data(options);
        self.cache.put(key, result.clone());
        result
    }
}
```

**Rationale**:
- MCP queries often repeat similar reachability requests
- Reachability is expensive (O(V+E) per query)
- Cache invalidation is simple (invalidate on call graph rebuild)

**Evidence**:
- Drift internal: UnifiedCallGraphProvider has LRU cache for function lookups
- Same pattern should apply to reachability

**Implementation Notes**:
1. Add LRU cache with configurable size (default 100)
2. Key on origin + options
3. Invalidate on call graph rebuild
4. Consider TTL for long-running processes

**Risks**:
- Memory overhead for cached results
- Stale results if call graph changes
- Cache key complexity

**Dependencies**:
- Independent of other recommendations

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)
- R3: Unify call resolution algorithm (6 strategies)
- R4: Implement namespace-based attribute resolution
- R7: Add dead code detection in Rust

### Phase 2: Performance (Weeks 5-8)
- R5: Add incremental call graph updates
- R8: Implement SQLite recursive CTEs
- R10: Add reachability result caching

### Phase 3: Feature Parity (Weeks 9-16)
- R2: Port per-language hybrid extractors to Rust
- R6: Implement impact analysis in Rust

### Phase 4: Advanced (Weeks 17-24)
- R1: Implement taint analysis layer
- R9: Add cross-service reachability

---

## Quality Checklist

- [x] Each recommendation has clear rationale
- [x] Evidence is cited for each recommendation (7 external sources)
- [x] Priority and effort are assessed
- [x] Risks are identified
- [x] Dependencies are noted
- [x] Implementation is actionable with code examples
- [x] Roadmap provides phased approach
