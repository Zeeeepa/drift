/**
 * drift context — intent-weighted deep dive context generation.
 */

import type { Command } from 'commander';
import { loadNapi } from '../napi.js';
import { formatOutput, type OutputFormat } from '../output/index.js';

const VALID_INTENTS = [
  'fix_bug', 'add_feature', 'understand_code', 'security_audit', 'generate_spec',
] as const;

const VALID_DEPTHS = ['overview', 'standard', 'deep'] as const;

export function registerContextCommand(program: Command): void {
  program
    .command('context <intent>')
    .description('Generate intent-weighted context for a task')
    .option('-d, --depth <depth>', `Context depth: ${VALID_DEPTHS.join(', ')}`, 'standard')
    .option('--data <json>', 'Additional data as JSON string', '{}')
    .option('-f, --format <format>', 'Output format: table, json, sarif', 'json')
    .option('-q, --quiet', 'Suppress all output except errors')
    .action(async (intent: string, opts: { depth: string; data: string; format: OutputFormat; quiet?: boolean }) => {
      const napi = loadNapi();
      try {
        if (!VALID_INTENTS.includes(intent as typeof VALID_INTENTS[number])) {
          process.stderr.write(`Invalid intent '${intent}'. Valid: ${VALID_INTENTS.join(', ')}\n`);
          process.exitCode = 2;
          return;
        }
        if (!VALID_DEPTHS.includes(opts.depth as typeof VALID_DEPTHS[number])) {
          process.stderr.write(`Invalid depth '${opts.depth}'. Valid: ${VALID_DEPTHS.join(', ')}\n`);
          process.exitCode = 2;
          return;
        }
        const result = await napi.driftContext(intent, opts.depth, opts.data);
        if (!opts.quiet) {
          process.stdout.write(formatOutput(result, opts.format));
        }
      } catch (err) {
        process.stderr.write(`Error: ${err instanceof Error ? err.message : err}\n`);
        process.exitCode = 2;
      }
    });
}
