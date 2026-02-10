/**
 * cloud — Cloud sync subcommands.
 */

import type { CortexClient } from "../bridge/client.js";

export async function cloudCommand(
  client: CortexClient,
  sub: string,
  flags: Record<string, string>,
): Promise<void> {
  switch (sub) {
    case "sync": {
      const result = await client.cloudSync();
      console.log(JSON.stringify(result, null, 2));
      break;
    }
    case "status": {
      const result = await client.cloudStatus();
      console.log(JSON.stringify(result, null, 2));
      break;
    }
    case "resolve": {
      const memoryId = flags.memory;
      const resolution = flags.resolution;
      if (!memoryId || !resolution) {
        console.error("  Error: cloud resolve requires --memory <id> --resolution <strategy>");
        process.exit(1);
      }
      const result = await client.cloudResolveConflict(memoryId, resolution);
      console.log(JSON.stringify(result, null, 2));
      break;
    }
    default:
      console.error(`  Unknown cloud subcommand: ${sub}. Valid: sync, status, resolve`);
      process.exit(1);
  }
}
