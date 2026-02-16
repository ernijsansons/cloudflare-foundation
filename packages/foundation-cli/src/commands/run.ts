import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import {
  createRun,
  getRun,
  listRuns,
  getAllArtifacts,
  updateRunStatus,
  type PlanningRun,
} from '../cloudflare/d1.js';
import { downloadPlanningPackage } from '../cloudflare/r2.js';
import { writeFileSync } from 'fs';

function generateRunId(): string {
  // Use crypto for secure random ID generation instead of Math.random()
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const randomPart = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `run_${Date.now().toString(36)}_${randomPart}`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

function formatStatus(status: string): string {
  switch (status) {
    case 'running':
      return chalk.blue('● running');
    case 'completed':
      return chalk.green('✓ completed');
    case 'killed':
      return chalk.red('✗ killed');
    case 'paused':
      return chalk.yellow('◐ paused');
    default:
      return chalk.gray(status);
  }
}

export const runCommand = new Command('run').description(
  'Manage planning runs'
);

runCommand
  .command('create <idea>')
  .description('Create a new planning run')
  .option('-m, --mode <mode>', 'Run mode (local or cloud)', 'local')
  .action(async (idea: string, options: { mode: string }) => {
    const spinner = ora('Creating run...').start();

    try {
      const id = generateRunId();
      const mode = options.mode as 'local' | 'cloud';

      await createRun(id, idea, mode);

      spinner.succeed(chalk.green('Run created'));
      console.log('\n' + chalk.bold('Run ID: ') + chalk.cyan(id));
      console.log(chalk.bold('Idea: ') + idea);
      console.log(chalk.bold('Mode: ') + chalk.yellow(mode));
      console.log(
        '\n' + chalk.dim('Start planning with: foundation sync opportunity ' + id)
      );
    } catch (error) {
      spinner.fail(chalk.red('Failed to create run'));
      console.error(
        chalk.red((error as Error).message)
      );
      process.exit(1);
    }
  });

runCommand
  .command('status <run-id>')
  .description('Get status of a planning run')
  .action(async (runId: string) => {
    const spinner = ora('Fetching run status...').start();

    try {
      const run = await getRun(runId);

      if (!run) {
        spinner.fail(chalk.red('Run not found'));
        process.exit(1);
      }

      spinner.stop();

      console.log('\n' + chalk.bold('Planning Run Status'));
      console.log('─'.repeat(40));
      console.log(chalk.bold('ID:           ') + chalk.cyan(run.id));
      console.log(chalk.bold('Status:       ') + formatStatus(run.status));
      console.log(
        chalk.bold('Current Phase:') +
          ' ' +
          (run.current_phase ?? chalk.dim('none'))
      );
      console.log(chalk.bold('Mode:         ') + chalk.yellow(run.mode ?? 'cloud'));
      console.log(chalk.bold('Pivots:       ') + run.pivot_count);
      if (run.kill_verdict) {
        console.log(chalk.bold('Kill Verdict: ') + chalk.red(run.kill_verdict));
      }
      if (run.quality_score) {
        console.log(
          chalk.bold('Quality:      ') + chalk.green(run.quality_score.toFixed(1))
        );
      }
      console.log(chalk.bold('Created:      ') + formatDate(run.created_at));
      console.log(chalk.bold('Updated:      ') + formatDate(run.updated_at));
      console.log('\n' + chalk.bold('Idea:'));
      console.log('  ' + run.idea);
      if (run.refined_idea && run.refined_idea !== run.idea) {
        console.log(chalk.bold('\nRefined Idea:'));
        console.log('  ' + run.refined_idea);
      }
    } catch (error) {
      spinner.fail(chalk.red('Failed to fetch status'));
      console.error(chalk.red((error as Error).message));
      process.exit(1);
    }
  });

runCommand
  .command('list')
  .description('List all planning runs')
  .option('-s, --status <status>', 'Filter by status (running, completed, killed)')
  .option('-l, --limit <number>', 'Number of runs to show', '20')
  .option('-o, --offset <number>', 'Offset for pagination', '0')
  .action(
    async (options: { status?: string; limit: string; offset: string }) => {
      const spinner = ora('Fetching runs...').start();

      try {
        const { runs, total } = await listRuns({
          status: options.status,
          limit: parseInt(options.limit),
          offset: parseInt(options.offset),
        });

        spinner.stop();

        console.log(
          '\n' + chalk.bold(`Planning Runs (${runs.length} of ${total})`)
        );
        console.log('─'.repeat(80));

        if (runs.length === 0) {
          console.log(chalk.dim('No runs found.'));
          console.log(
            chalk.dim('Create one with: foundation run create "Your idea"')
          );
          return;
        }

        for (const run of runs) {
          const ideaPreview =
            run.idea.length > 50 ? run.idea.slice(0, 50) + '...' : run.idea;
          const mode = run.mode === 'local' ? chalk.yellow('[L]') : chalk.blue('[C]');

          console.log(
            `${formatStatus(run.status).padEnd(20)} ${mode} ${chalk.cyan(run.id.padEnd(25))} ${ideaPreview}`
          );
        }

        console.log('─'.repeat(80));
        console.log(chalk.dim('[L]=Local, [C]=Cloud'));
      } catch (error) {
        spinner.fail(chalk.red('Failed to fetch runs'));
        console.error(chalk.red((error as Error).message));
        process.exit(1);
      }
    }
  );

runCommand
  .command('artifacts <run-id>')
  .description('List all artifacts for a run')
  .option('--json', 'Output as JSON')
  .action(async (runId: string, options: { json?: boolean }) => {
    const spinner = ora('Fetching artifacts...').start();

    try {
      const artifacts = await getAllArtifacts(runId);

      spinner.stop();

      if (options.json) {
        const parsed = artifacts.map((a) => ({
          ...a,
          content: JSON.parse(a.content),
        }));
        console.log(JSON.stringify(parsed, null, 2));
        return;
      }

      console.log('\n' + chalk.bold(`Artifacts for ${runId}`));
      console.log('─'.repeat(60));

      if (artifacts.length === 0) {
        console.log(chalk.dim('No artifacts found.'));
        return;
      }

      for (const artifact of artifacts) {
        const score = artifact.overall_score
          ? chalk.green(artifact.overall_score.toFixed(1))
          : chalk.dim('-');
        const verdict = artifact.review_verdict
          ? chalk.cyan(artifact.review_verdict)
          : chalk.dim('-');

        console.log(
          `  ${artifact.phase.padEnd(20)} v${artifact.version}  Score: ${score}  Verdict: ${verdict}`
        );
      }
    } catch (error) {
      spinner.fail(chalk.red('Failed to fetch artifacts'));
      console.error(chalk.red((error as Error).message));
      process.exit(1);
    }
  });

runCommand
  .command('package <run-id>')
  .description('Download the full planning package')
  .option('-o, --output <file>', 'Output file path', 'planning-package.json')
  .action(async (runId: string, options: { output: string }) => {
    const spinner = ora('Downloading package...').start();

    try {
      const pkg = await downloadPlanningPackage(runId);

      if (!pkg) {
        spinner.fail(chalk.red('Package not found. Run may not be completed.'));
        process.exit(1);
      }

      writeFileSync(options.output, JSON.stringify(pkg, null, 2));

      spinner.succeed(chalk.green(`Package saved to ${options.output}`));
    } catch (error) {
      spinner.fail(chalk.red('Failed to download package'));
      console.error(chalk.red((error as Error).message));
      process.exit(1);
    }
  });

runCommand
  .command('complete <run-id>')
  .description('Mark a run as completed')
  .action(async (runId: string) => {
    const spinner = ora('Marking run as completed...').start();

    try {
      await updateRunStatus(runId, 'completed');
      spinner.succeed(chalk.green('Run marked as completed'));
    } catch (error) {
      spinner.fail(chalk.red('Failed to update run'));
      console.error(chalk.red((error as Error).message));
      process.exit(1);
    }
  });
