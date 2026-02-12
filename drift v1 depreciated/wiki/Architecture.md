# Architecture

How Drift works under the hood.

## Overview

Drift is a **codebase intelligence platform** that learns patterns from your code and provides that knowledge to AI agents. It combines static analysis, call graph construction, and pattern detection into a unified system.

**As of v1.0.0, Drift's core analysis engine is written in Rust** for maximum performance and memory efficiency. The Rust core handles parsing, call graph construction, and all heavy analysis, while TypeScript provides the CLI, MCP server, and pattern detection layers.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Your Codebase                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Drift Rust Core (Native)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Tree-sitter │  │ Call Graph  │  │  Analysis   │              │
│  │   Parsers   │──│   Builder   │──│   Engines   │              │
│  │  (9 langs)  │  │  (SQLite)   │  │ (12 modules)│              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│         │                │                │                      │
│         ▼                ▼                ▼                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              SQLite Data Lake (.drift/)                      ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌─────────┐     ┌─────────┐     ┌─────────┐
        │   CLI   │     │   MCP   │     │   LSP   │
        │(TypeScript)   │  Server │     │  Server │
        └─────────┘     └─────────┘     └─────────┘
```

---

## Rust Core Architecture

The Rust core (`drift-core` crate) provides 12 native analysis modules:

| Module | Purpose | Performance |
|--------|---------|-------------|
| **Scanner** | Parallel file discovery with rayon | 10K files in <1s |
| **Parsers** | Tree-sitter AST parsing for 9 languages | Native bindings, no WASM |
| **Call Graph** | Function call mapping with SQLite storage | 10K files in 2.3s |
| **Boundaries** | Data access and sensitive field detection | AST-first + regex fallback |
| **Coupling** | Module dependency analysis (Tarjan's algorithm) | O(V+E) cycle detection |
| **Test Topology** | Test-to-code mapping | 30+ test frameworks |
| **Error Handling** | Error boundary and gap detection | Multi-language support |
| **Reachability** | Forward/inverse data flow queries | O(1) memory via SQLite |
| **Constants** | Constant extraction and secret detection | AST-based |
| **Environment** | Env var access pattern detection | 9 languages |
| **Wrappers** | Framework wrapper pattern detection | Transitive analysis |
| **Unified Analyzer** | Combined pattern detection | String interning for 60-80% memory reduction |

### NAPI Bindings

The Rust core is exposed to Node.js via NAPI bindings (`drift-napi` crate):

```typescript
// Native functions available from @drift/native
import {
  scan,
  parse,
  buildCallGraph,
  scanBoundaries,
  analyzeCoupling,
  analyzeTestTopology,
  analyzeErrorHandling,
  analyzeReachabilitySqlite,
  analyzeInverseReachabilitySqlite,
  analyzeConstants,
  analyzeEnvironment,
  analyzeWrappers,
} from '@drift/native';
```

### Automatic Fallback

If native modules are unavailable (rare), Drift automatically falls back to TypeScript implementations:

```typescript
// Native-first with TypeScript fallback
const result = await analyzeTestTopologyWithFallback(rootDir, files);
// Uses native if available, TypeScript otherwise
```

---

## Data Storage (.drift/)

All Drift data is stored in the `.drift/` directory at your project root.

```
.drift/
├── config.json              # Project configuration
├── manifest.json            # Scan metadata
├── indexes/
│   ├── by-category.json     # Patterns indexed by category
│   └── by-file.json         # Patterns indexed by file
├── patterns/
│   ├── approved/            # Approved patterns
│   ├── discovered/          # Newly discovered patterns
│   ├── ignored/             # Ignored patterns
│   └── variants/            # Pattern variants
├── lake/
│   ├── callgraph/
│   │   └── callgraph.db     # SQLite call graph database (NEW in v1.0)
│   ├── examples/            # Code examples
│   │   └── patterns/        # Examples by pattern
│   ├── patterns/            # Pattern definitions
│   └── security/            # Security analysis
│       └── tables/          # Data access tables
├── contracts/
│   ├── discovered/          # Discovered API contracts
│   ├── verified/            # Verified contracts
│   ├── mismatch/            # Mismatched contracts
│   └── ignored/             # Ignored contracts
├── constraints/
│   ├── approved/            # Approved constraints
│   ├── discovered/          # Discovered constraints
│   └── custom/              # Custom constraints
├── boundaries/
│   └── access-map.json      # Data access boundaries
├── history/
│   └── snapshots/           # Historical snapshots
├── views/
│   ├── pattern-index.json   # Pattern index view
│   └── status.json          # Status view
└── reports/                 # Generated reports
```

### SQLite Call Graph Storage (v1.0+)

The call graph is now stored in SQLite (`callgraph.db`) instead of JSON shards:

- **WAL mode** — Concurrent reads during writes
- **MPSC pattern** — Parallel parsing, single-threaded writes
- **Batched inserts** — 100 files per transaction
- **SQL-based resolution** — Single JOIN query instead of O(n²) file I/O

This enables:
- **8x faster builds** — 10K files in 2.3s vs 19.5s
- **O(1) memory queries** — No need to load entire graph
- **Concurrent access** — Multiple tools can query simultaneously

---

## Pattern System

### Pattern Lifecycle

```
Source Code
    │
    ▼
┌─────────────────┐
│   Discovery     │ ← Drift finds patterns in your code
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Discovered    │ ← New patterns await review
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────┐
│Approved│ │Ignored│ ← You decide what matters
└───┬───┘ └───────┘
    │
    ▼
┌─────────────────┐
│   Enforcement   │ ← Drift detects outliers
└─────────────────┘
```

### Pattern Categories

Drift detects 15 categories of patterns:

| Category | Description | Examples |
|----------|-------------|----------|
| `api` | REST endpoints, GraphQL | Route handlers, resolvers |
| `auth` | Authentication | Login, JWT, sessions |
| `security` | Security patterns | Validation, sanitization |
| `errors` | Error handling | Try/catch, Result types |
| `logging` | Observability | Structured logging |
| `data-access` | Database queries | ORM patterns, raw SQL |
| `config` | Configuration | Env vars, settings |
| `testing` | Test patterns | Mocks, fixtures |
| `performance` | Optimization | Caching, memoization |
| `components` | UI components | React, Vue, Angular |
| `styling` | CSS patterns | Tailwind, CSS-in-JS |
| `structural` | Code organization | Modules, exports |
| `types` | Type definitions | Interfaces, schemas |
| `accessibility` | A11y patterns | ARIA, semantic HTML |
| `documentation` | Doc patterns | JSDoc, docstrings |

### Pattern Confidence

Each pattern has a confidence score (0.0-1.0):

- **0.9-1.0** — High confidence, consistent pattern
- **0.7-0.9** — Good confidence, some variation
- **0.5-0.7** — Moderate confidence, review recommended
- **<0.5** — Low confidence, may be noise

---

## Call Graph

The call graph maps function calls across your codebase. **In v1.0+, this is built entirely in Rust with SQLite storage.**

### Building the Call Graph

```
Source Files
    │
    ▼
┌─────────────────┐
│  Rust Scanner   │ ← Parallel file discovery (rayon)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Tree-sitter    │ ← Native Rust bindings (no WASM)
│    Parsing      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Extraction    │ ← Functions, calls, data access
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Resolution    │ ← Cross-file call target resolution
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  SQLite Storage │ ← WAL mode, batched inserts
└─────────────────┘
```

### Performance (v1.0 Rust Core)

| Files | Before (TypeScript) | After (Rust + SQLite) | Improvement |
|-------|---------------------|----------------------|-------------|
| 5,000 | 4.86s | 1.11s | **4.4x** |
| 10,000 | OOM crash | 2.34s | **∞** |
| 50,000 | N/A | ~12s | Works |

### Key Optimizations

1. **Thread-local parsers** — Avoid re-initializing tree-sitter per file
2. **MPSC channel pattern** — Parallel parsing, single-threaded writes
3. **Batched inserts** — 100 files per transaction
4. **SQL-based resolution** — Single JOIN query instead of O(n²) file I/O
5. **SQLite WAL mode** — Concurrent reads during writes

### Unified Provider

The Unified Provider combines multiple extraction strategies:

1. **Tree-sitter AST** — Primary, high accuracy
2. **Regex fallback** — Secondary, for edge cases
3. **Framework-specific** — ORM, middleware detection

### Data Flow Analysis

Drift tracks data flow through your code:

- **Forward reachability** — "What data can this code access?"
- **Inverse reachability** — "Who can access this data?"
- **Sensitive data tracking** — PII, credentials, financial

---

## Framework Detection

Drift detects framework-specific patterns:

### Web Frameworks

| Framework | Detection |
|-----------|-----------|
| Express | Middleware chains, route handlers |
| NestJS | Decorators, modules, DI |
| Django | Views, models, middleware |
| FastAPI | Routes, dependencies |
| Spring Boot | Annotations, beans |
| ASP.NET Core | Controllers, middleware |
| Laravel | Controllers, Eloquent |
| Gin/Echo/Fiber | Handlers, middleware |
| Actix/Axum | Routes, extractors |

### ORM Detection

| ORM | Detection |
|-----|-----------|
| Prisma | Schema, queries |
| TypeORM | Entities, repositories |
| SQLAlchemy | Models, sessions |
| Hibernate | Entities, JPQL |
| Entity Framework | DbContext, LINQ |
| Eloquent | Models, relationships |
| GORM | Models, queries |
| SQLx | Queries, compile-time |
| Diesel | Schema, queries |

---

## Analysis Engines

### Test Topology

Maps tests to source code:

```bash
drift test-topology build
```

- **Coverage mapping** — Which tests cover which code
- **Affected tests** — Minimum test set for changes
- **Mock analysis** — Mock patterns and usage
- **Quality metrics** — Test quality scores

### Module Coupling

Analyzes dependencies:

```bash
drift coupling status
```

- **Dependency cycles** — Circular dependencies
- **Hotspots** — Highly coupled modules
- **Unused exports** — Dead code
- **Refactor impact** — Change blast radius

### Error Handling

Analyzes error patterns:

```bash
drift error-handling status
```

- **Error boundaries** — Where errors are caught
- **Unhandled paths** — Missing error handling
- **Gaps** — Inconsistent patterns
- **Swallowed exceptions** — Silent failures

---

## MCP Server

The MCP server exposes Drift to AI agents:

```
AI Agent (Claude, Cursor, etc.)
         │
         ▼
┌─────────────────┐
│   MCP Protocol  │ ← JSON-RPC over stdio
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Drift MCP      │ ← 45+ tools
│    Server       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Drift Core     │ ← Analysis engine
└─────────────────┘
```

### Tool Layers

Tools are organized for efficient token usage:

1. **Orchestration** — High-level, curated context
2. **Discovery** — Quick overview
3. **Surgical** — Precise, single-purpose
4. **Exploration** — Browse and filter
5. **Detail** — Deep dives
6. **Analysis** — Health metrics
7. **Generation** — AI-assisted changes

---

## CLI Architecture

```
drift <command> [options]
         │
         ▼
┌─────────────────┐
│  Command Parser │ ← Parse args
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Command Handler│ ← Execute command
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Drift Core     │ ← Analysis engine
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Output       │ ← Format results
└─────────────────┘
```

---

## Incremental Analysis

Drift supports incremental analysis for fast updates:

1. **File hashing** — Track file changes
2. **Dependency tracking** — Know what to re-analyze
3. **Partial updates** — Only update changed data
4. **Cache invalidation** — Smart cache management

```bash
# Full scan
drift scan

# Incremental scan (default)
drift scan --incremental

# Force full rescan
drift scan --force
```

---

## Performance

### Rust Core Performance (v1.0+)

The Rust core provides dramatic performance improvements:

| Operation | TypeScript (pre-v1.0) | Rust (v1.0+) | Improvement |
|-----------|----------------------|--------------|-------------|
| Call graph (5K files) | 4.86s | 1.11s | **4.4x** |
| Call graph (10K files) | OOM crash | 2.34s | **∞** |
| Reachability query | Load entire graph | O(1) memory | **Constant** |
| Parsing (per file) | ~5ms | ~0.5ms | **10x** |

### Memory Optimization

- **SQLite-backed queries** — No need to load entire call graph into memory
- **String interning** — 60-80% memory reduction in unified analyzer
- **Streaming parsing** — Process files without loading all into memory
- **Thread-local parsers** — Reuse tree-sitter instances

### Speed Optimization

- **Parallel parsing** — Multi-threaded file processing with rayon
- **Batched writes** — 100 files per SQLite transaction
- **Incremental updates** — Only re-analyze changed files
- **Pre-compiled queries** — Cached tree-sitter queries

### Typical Performance (v1.0+)

| Codebase Size | Initial Scan | Incremental | Call Graph |
|---------------|--------------|-------------|------------|
| Small (<10K LOC) | <3s | <1s | <1s |
| Medium (10-100K) | 5-15s | 1-3s | 1-3s |
| Large (100K-1M) | 30s-2min | 5-15s | 5-15s |
| Enterprise (>1M) | 2-10min | 15s-1min | 30s-2min |
