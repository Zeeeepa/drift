/**
 * drift_cloud_sync — Trigger cloud sync.
 */

import type { CortexClient } from "../../bridge/client.js";
import type { McpToolDefinition } from "../../bridge/types.js";

export function driftCloudSync(client: CortexClient): McpToolDefinition {
  return {
    name: "drift_cloud_sync",
    description:
      "Trigger a cloud sync — push local changes and pull remote updates. " +
      "Returns counts of pushed, pulled, and conflicting memories.",
    inputSchema: {
      type: "object",
      properties: {},
    },
    handler: async () => {
      return client.cloudSync();
    },
  };
}
