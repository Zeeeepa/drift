# Pattern Location Discovery - Implementation Plan

## Overview

Drift has 100+ detectors that find patterns in codebases. Currently, when a pattern is detected, we store WHAT was found but not WHERE. This feature adds location tracking so every detected pattern includes exact file locations with semantic information.

**Current State:** Detectors find patterns → stored as "pattern exists"
**Target State:** Detectors find patterns → stored with file, line range, class/function name, signature

**The Result:** One manifest file contains complete architectural understanding. AI agents read one file instead of exploring the entire codebase.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         drift scan                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  Structural  │    │     API      │    │    Auth      │  ...  │
│  │  Detectors   │    │  Detectors   │    │  Detectors   │       │
│  │  (8 types)   │    │  (7 types)   │    │  (6 types)   │       │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘       │
│         │                   │                   │                │
│         └───────────────────┼───────────────────┘                │
│                             ▼                                    │
│                   ┌─────────────────┐                            │
│                   │ Detection Result │                           │
│                   │ + Location Data  │  ◄── NEW                  │
│                   └────────┬────────┘                            │
│                            ▼                                     │
│                   ┌─────────────────┐                            │
│                   │    Manifest     │  ◄── NEW                   │
│                   │  manifest.json  │                            │
│                   └─────────────────┘                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tasks

### Phase 1: Location Data Model

- [ ] 1. Define location types
  - [ ] 1.1 Create `SemanticLocation` interface in `@drift/core`
    ```typescript
    interface SemanticLocation {
      file: string;           // Relative file path
      hash: string;           // Content hash for change detection
      range: {
        start: number;        // Start line
        end: number;          // End line
      };
      type: 'class' | 'function' | 'method' | 'variable' | 'block' | 'file';
      name: string;           // e.g., "AuthMiddleware", "authenticate"
      signature?: string;     // e.g., "class AuthMiddleware:", "async def authenticate(token: str)"
      confidence: number;     // 0.0 - 1.0
      members?: SemanticLocation[];  // Nested (methods in class)
    }
    ```
  - [ ] 1.2 Update `DetectionResult` to include locations
  - [ ] 1.3 Update `Pattern` type to store locations array
  - [ ] 1.4 Write unit tests for new types

- [ ] 2. Checkpoint - Types compile, existing tests pass

---

### Phase 2: Detector Location Extraction

- [ ] 3. Update base detector classes
  - [ ] 3.1 Update `BaseDetector` to return locations
  - [ ] 3.2 Update `ASTDetector` to extract semantic info from AST nodes
    - Class name, method names, signatures
    - Precise line ranges from AST positions
  - [ ] 3.3 Update `RegexDetector` to capture match locations
    - Line numbers from match indices
    - Context extraction around matches
  - [ ] 3.4 Update `StructuralDetector` to return file-level locations
  - [ ] 3.5 Write tests for location extraction

- [ ] 4. Verify existing detectors work with new interface
  - [ ] 4.1 Test structural detectors return locations
  - [ ] 4.2 Test API detectors return locations
  - [ ] 4.3 Test auth detectors return locations
  - [ ] 4.4 Spot check other categories

- [ ] 5. Checkpoint - Detectors return location data

---

### Phase 3: Manifest Storage

- [ ] 6. Create manifest system
  - [ ] 6.1 Define `Manifest` interface
    ```typescript
    interface Manifest {
      version: string;
      generated: string;          // ISO timestamp
      codebaseHash: string;       // Hash of all tracked files
      
      // Pattern → Locations (forward index)
      patterns: {
        [patternId: string]: {
          name: string;
          category: string;
          status: 'discovered' | 'approved' | 'ignored';
          locations: SemanticLocation[];
          confidence: number;
        };
      };
      
      // File → Patterns (reverse index)
      files: {
        [filePath: string]: {
          hash: string;
          patterns: string[];     // Pattern IDs found in this file
          lastScanned: string;
        };
      };
    }
    ```
  - [ ] 6.2 Create `ManifestStore` class in `@drift/core`
    - `load()` - Load from `.drift/index/manifest.json`
    - `save()` - Atomic write with temp file
    - `update(detectionResults)` - Merge new results
    - `getPatternLocations(patternId)` - Query locations
    - `getFilePatterns(filePath)` - Reverse lookup
  - [ ] 6.3 Implement content hashing for files
  - [ ] 6.4 Implement incremental updates
    - Compare file hashes
    - Only re-scan changed files
    - Preserve locations for unchanged files
  - [ ] 6.5 Write unit tests for ManifestStore

- [ ] 7. Checkpoint - Manifest saves/loads correctly

---

### Phase 4: Scan Integration

- [ ] 8. Update scan command
  - [ ] 8.1 After detection, collect all locations
  - [ ] 8.2 Build/update manifest with results
  - [ ] 8.3 Save manifest to `.drift/index/manifest.json`
  - [ ] 8.4 Add scan summary: "Found X patterns in Y files"
  - [ ] 8.5 Add `--no-manifest` flag to skip manifest generation

- [ ] 9. Implement incremental scanning
  - [ ] 9.1 On scan, load existing manifest
  - [ ] 9.2 Check file hashes against manifest
  - [ ] 9.3 Only scan files where hash changed
  - [ ] 9.4 Merge new results with existing manifest
  - [ ] 9.5 Add `--full` flag to force full rescan

- [ ] 10. Checkpoint - `drift scan` generates manifest with locations

---

### Phase 5: Export Command

- [ ] 11. Create export command
  - [ ] 11.1 `drift export` - Export manifest data
  - [ ] 11.2 `--format json` (default) - Full manifest as JSON
  - [ ] 11.3 `--format ai-context` - Optimized markdown for LLMs
  - [ ] 11.4 `--format summary` - Human-readable summary
  - [ ] 11.5 `--output <file>` - Write to file instead of stdout
  - [ ] 11.6 `--compact` - Minimal output (no snippets)

- [ ] 12. Implement AI context format
  - [ ] 12.1 Markdown structure optimized for LLM consumption
    ```markdown
    # Architecture Manifest
    Generated: 2026-01-19 | Patterns: 47 | Files: 103
    
    ## Auth (2 patterns)
    - **middleware-pattern** → `src/auth/middleware.py:15-67`
      - Class: `AuthMiddleware`
      - Methods: `__call__`, `authenticate`
    
    ## API (3 patterns)
    - **response-envelope** → `src/api/responses.py:1-45`
      - Functions: `success_response`, `error_response`
    
    ## File Index
    | File | Patterns |
    |------|----------|
    | src/auth/middleware.py | middleware-pattern |
    | src/api/responses.py | response-envelope |
    ```
  - [ ] 12.2 Token estimation (warn if >8k, >32k, >128k)
  - [ ] 12.3 `--max-tokens` flag to limit output size

- [ ] 13. Checkpoint - Export command works

---

### Phase 6: Query Commands

- [ ] 14. Implement where command
  - [ ] 14.1 `drift where <pattern>` - Find pattern locations
  - [ ] 14.2 Support partial matching ("auth" matches "auth-middleware")
  - [ ] 14.3 Output: file path, line range, signature, snippet
  - [ ] 14.4 `--json` flag for machine-readable output

- [ ] 15. Implement files command
  - [ ] 15.1 `drift files <path>` - Show patterns in a file
  - [ ] 15.2 Support glob patterns
  - [ ] 15.3 Output: patterns found, line ranges

- [ ] 16. Checkpoint - Query commands work

---

### Phase 7: Polish

- [ ] 17. Performance optimization
  - [ ] 17.1 Parallel file scanning
  - [ ] 17.2 AST parsing cache
  - [ ] 17.3 Target: 1000 files in <5 seconds

- [ ] 18. Documentation
  - [ ] 18.1 Update README with new features
  - [ ] 18.2 Document manifest format
  - [ ] 18.3 Document AI context format
  - [ ] 18.4 Add usage examples

- [ ] 19. Final checkpoint
  - All tests pass
  - Performance targets met
  - Documentation complete

---

## Success Criteria

After implementation:

```bash
# Scan codebase - detects patterns AND their locations
drift scan
# → Scanning 103 files...
# → Found 47 patterns across 15 categories
# → Manifest saved to .drift/index/manifest.json

# Export for AI consumption
drift export --format ai-context > architecture.md
# → 12KB file with complete architectural map

# Quick lookup
drift where "middleware"
# → auth-middleware: src/auth/middleware.py:15-67 (class AuthMiddleware)
# → logging-middleware: src/observability/middleware.py:1-34 (class LoggingMiddleware)

# What patterns are in this file?
drift files src/exceptions.py
# → exception-hierarchy: lines 1-120 (class AppError + 12 subclasses)
# → error-codes: lines 5-25 (class ErrorCode)
```

---

## Example Manifest Output

```json
{
  "version": "2.0.0",
  "generated": "2026-01-19T12:00:00Z",
  "codebaseHash": "abc123def456",
  "patterns": {
    "auth-middleware": {
      "name": "Auth Middleware Pattern",
      "category": "auth",
      "status": "discovered",
      "confidence": 0.92,
      "locations": [
        {
          "file": "src/auth/middleware.py",
          "hash": "789xyz",
          "range": { "start": 15, "end": 67 },
          "type": "class",
          "name": "AuthMiddleware",
          "signature": "class AuthMiddleware:",
          "confidence": 0.95,
          "members": [
            {
              "file": "src/auth/middleware.py",
              "hash": "789xyz",
              "range": { "start": 20, "end": 35 },
              "type": "method",
              "name": "__call__",
              "signature": "async def __call__(self, request, call_next):",
              "confidence": 0.95
            }
          ]
        }
      ]
    }
  },
  "files": {
    "src/auth/middleware.py": {
      "hash": "789xyz",
      "patterns": ["auth-middleware"],
      "lastScanned": "2026-01-19T12:00:00Z"
    }
  }
}
```

---

## Timeline Estimate

- Phase 1: Location Data Model (1-2 hours)
- Phase 2: Detector Updates (2-3 hours)
- Phase 3: Manifest Storage (2-3 hours)
- Phase 4: Scan Integration (2 hours)
- Phase 5: Export Command (2 hours)
- Phase 6: Query Commands (1-2 hours)
- Phase 7: Polish (1-2 hours)

**Total: ~12-15 hours**

---

## Notes

- Drift is standalone - works on ANY codebase
- 100+ detectors across 15 categories already exist
- This feature adds WHERE to the existing WHAT
- Presets (like Cheatcode2026) are optional conveniences, not dependencies
- Manifest enables AI agents to understand architecture without exploration
