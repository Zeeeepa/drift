# 05 Analyzers — External Research

> Phase 3: Verifiable best practices from trusted sources, applied to Drift's analyzer system.

---

## R1: rust-analyzer Architecture — Incremental Semantic Analysis at Scale

**Source**: rust-analyzer Architecture Documentation
https://rust-analyzer.github.io/book/contributing/architecture.html
**Type**: Tier 1 (Authoritative — Official rust-analyzer documentation)
**Accessed**: 2026-02-06

**Source**: "The Heart of a Language Server" — rust-analyzer Blog
https://rust-analyzer.github.io/blog/2023/12/26/the-heart-of-a-language-server.html
**Type**: Tier 1 (Official blog)
**Accessed**: 2026-02-06

**Source**: "Durable Incrementality" — rust-analyzer Blog
https://rust-analyzer.github.io/blog/2023/07/24/durable-incrementality.html
**Type**: Tier 1 (Official blog)
**Accessed**: 2026-02-06

**Key Findings**:

1. **Layered Architecture with Clear Boundaries**: rust-analyzer separates concerns into distinct crates with explicit API boundaries:
   - `syntax` — Pure syntax tree, no semantic info, completely independent
   - `hir-def`, `hir-ty` — Low-level semantic analysis with ECS flavor
   - `hir` — High-level API boundary, OO-flavored facade
   - `ide` — IDE features built on semantic model, POD types only

2. **Salsa-Based Incremental Computation**: Uses the Salsa framework for on-demand, incrementalized computation. Key insight: "typing inside a function's body never invalidates global derived data." This is achieved through careful query design where function bodies are isolated from module-level analysis.

3. **Syntax Tree as Value Type**: "The tree is fully determined by the contents of its syntax nodes, it doesn't need global context (like an interner) and doesn't store semantic info." This enables parallel parsing and clean separation of concerns.

4. **Source-to-HIR Mapping Pattern**: A recursive pattern for resolving syntax to semantic elements: "We first resolve the parent syntax node to the parent hir element. Then we ask the hir parent what syntax children does it have. Then we look for our node in the set of children." This is described as an "uber-IDE pattern" present in Roslyn and Kotlin.

5. **Cancellation via Unwinding**: Long-running analyses can be cancelled by checking a global revision counter. If incremented, the analysis panics with a special `Cancelled` value, caught at the IDE boundary.

