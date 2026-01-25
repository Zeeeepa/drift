# Call Graph Memory Optimization

## Problem

The current call graph builder hits `RangeError: Invalid string length` on large codebases because:

1. **Single-file storage**: The entire call graph is serialized to one `graph.json` file
2. **In-memory accumulation**: All functions are accumulated in a `Map<string, FunctionNode>` before serialization
3. **No streaming**: `JSON.stringify()` is called on the entire graph at once

For the drift codebase itself (~1800 files), this exceeds Node.js string limits.

## Solution: Sharded Storage

Use the existing `CallGraphShardStore` in `packages/core/src/lake/callgraph-shard-store.ts` which already implements:

### Storage Structure
```
.drift/lake/callgraph/
├── index.json           # Summary index with file list
├── entry-points.json    # API entry points (separate file)
└── files/
    ├── {file-hash}.json # Functions per source file
    └── ...
```

### Key Changes Required

#### 1. Update `CallGraphAnalyzer.scan()` to stream results

```typescript
// Instead of accumulating all functions:
const functions = new Map<string, FunctionNode>();

// Stream to shard store as we scan each file:
for (const file of files) {
  const fileFunctions = await this.scanFile(file);
  await shardStore.saveShard(file, fileFunctions);
}
```

#### 2. Update CLI `callgraph build` command

```typescript
// Use CallGraphShardStore instead of direct JSON.stringify
import { CallGraphShardStore } from 'driftdetect-core';

const shardStore = new CallGraphShardStore({ rootDir });
await shardStore.initialize();

// Scan incrementally
for (const file of files) {
  const shard = await analyzer.scanFile(file);
  await shardStore.saveShard(shard);
}

// Build index at the end
await shardStore.buildIndex();
```

#### 3. Update `CallGraphStore` to use shards

The existing `CallGraphStore` should delegate to `CallGraphShardStore` for large graphs:

```typescript
async save(graph: CallGraph): Promise<void> {
  if (graph.functions.size > SHARD_THRESHOLD) {
    // Use sharded storage
    await this.saveSharded(graph);
  } else {
    // Use single file for small graphs
    await this.saveSingleFile(graph);
  }
}
```

#### 4. Lazy loading for queries

```typescript
// Don't load entire graph into memory
getFunction(id: string): Promise<FunctionNode | undefined> {
  const fileHash = this.getFileHashFromId(id);
  const shard = await this.loadShard(fileHash);
  return shard.functions.find(f => f.id === id);
}
```

## Implementation Steps

1. [ ] Add `scanFile()` method to `CallGraphAnalyzer` for per-file scanning
2. [ ] Update `CallGraphShardStore` to support incremental saves
3. [ ] Update CLI `callgraph build` to use streaming approach
4. [ ] Update `CallGraphStore` to use shards for large graphs
5. [ ] Update MCP tools to use lazy loading from shards
6. [ ] Add tests for large codebase scenarios

## Memory Budget

Target: Build call graph for 10,000+ file codebase with < 512MB memory

- Per-file shard: ~10-50KB (depending on function count)
- Index file: ~1MB for 10,000 files
- In-memory during build: Only current file + index

## Backward Compatibility

- Keep supporting single `graph.json` for small codebases
- Auto-detect format on load (sharded vs single file)
- Migration path: Re-run `drift callgraph build` to convert
