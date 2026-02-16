#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { configCommand } from './commands/config.js';
import { runCommand } from './commands/run.js';
import { syncCommand, phasesCommand } from './commands/sync.js';
import { contextCommand } from './commands/context.js';
import { auditCommand } from './commands/audit.js';

const program = new Command();

program
  .name('foundation')
  .description('CLI for local planning runs synced to Cloudflare')
  .version('0.1.0');

// Add commands
program.addCommand(configCommand);
program.addCommand(runCommand);
program.addCommand(syncCommand);
program.addCommand(phasesCommand);
program.addCommand(contextCommand);
program.addCommand(auditCommand);

// Help text with examples
program.on('--help', () => {
  console.log('');
  console.log(chalk.bold('Quick Start:'));
  console.log('');
  console.log('  1. Configure Cloudflare credentials:');
  console.log(
    chalk.cyan(
      '     foundation config set --account-id <id> --api-token <token> --database-id <id>'
    )
  );
  console.log('');
  console.log('  2. Create a new run:');
  console.log(chalk.cyan('     foundation run create "My SaaS idea"'));
  console.log('');
  console.log('  3. Sync phase outputs (after generating with Claude Code):');
  console.log(
    chalk.cyan('     echo \'{"verdict":"CONTINUE"}\' | foundation sync opportunity <run-id> --stdin')
  );
  console.log('');
  console.log('  4. Get context for next phase:');
  console.log(
    chalk.cyan('     foundation context <run-id> --phase customer-intel --json')
  );
  console.log('');
  console.log('  5. Audit for hallucinations (after /clear):');
  console.log(chalk.cyan('     foundation audit <run-id>'));
  console.log('');
  console.log(chalk.bold('Planning Phases:'));
  console.log(chalk.dim('  Run "foundation phases" to see all 15 phases'));
  console.log('');
});

// Parse arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
