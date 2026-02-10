/**
 * drift_cloud_status — Get cloud sync status.
 */

import type { CortexClient } from "../../bridge/client.js";
import type { McpToolDefinition } from "../../bridge/types.js";

export function driftCloudStatus(client: CortexClient): McpToolDefinition {
  return {
    name: "drift_cloud_status",
    description:
      "Get cloud sync status — online/offline, queue length.",
    inputSchema: {
      type: "object",
      properties: {},
    },
    handler: async () => {
      return client.cloudStatus();
    },
  };
}
