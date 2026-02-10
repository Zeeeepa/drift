/**
 * drift report — generate reports from stored violations in 8 formats.
 */

import type { Command } from 'commander';
import { loadNapi } from '../napi.js';

const VALID_FORMATS = [
  'sarif', 'json', 'html', 'junit', 'sonarqube', 'console', 'github', 'gitlab',
] as const;

export function registerReportCommand(program: Command): void {
  program
    .command('report')
    .description('Generate a report from stored violations')
    .option('-r, --report-format <format>', `Report format: ${VALID_FORMATS.join(', ')}`, 'console')
    .option('-o, --output <file>', 'Write output to file instead of stdout')
    .option('-q, --quiet', 'Suppress all output except errors')
    .action(async (opts: { reportFormat: string; output?: string; quiet?: boolean }) => {
      const napi = loadNapi();
      try {
        if (!VALID_FORMATS.includes(opts.reportFormat as typeof VALID_FORMATS[number])) {
          process.stderr.write(`Invalid format '${opts.reportFormat}'. Valid: ${VALID_FORMATS.join(', ')}\n`);
          process.exitCode = 2;
          return;
        }
        const result = napi.driftReport(opts.reportFormat);
        if (opts.output) {
          const fs = await import('fs');
          fs.writeFileSync(opts.output, result, 'utf-8');
          if (!opts.quiet) {
            process.stdout.write(`Report written to ${opts.output}\n`);
          }
        } else if (!opts.quiet) {
          process.stdout.write(result);
          process.stdout.write('\n');
        }
      } catch (err) {
        process.stderr.write(`Error: ${err instanceof Error ? err.message : err}\n`);
        process.exitCode = 2;
      }
    });
}
