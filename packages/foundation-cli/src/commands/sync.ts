import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { readFileSync } from 'fs';
import { storeArtifact, updateRunPhase, getRun } from '../cloudflare/d1.js';
import { storeVector } from '../cloudflare/vectorize.js';

const PHASES = [
  'opportunity',
  'customer-intel',
  'market-research',
  'competitive-intel',
  'kill-test',
  'revenue-expansion',
  'strategy',
  'business-model',
  'product-design',
  'gtm-marketing',
  'content-engine',
  'tech-arch',
  'analytics',
  'launch-execution',
  'synthesis',
] as const;

type Phase = (typeof PHASES)[number];

function isValidPhase(phase: string): phase is Phase {
  return PHASES.includes(phase as Phase);
}

function generateArtifactId(): string {
  // Use crypto for secure random ID generation instead of Math.random()
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const randomPart = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `art_${Date.now().toString(36)}_${randomPart}`;
}

async function readInput(
  options: { file?: string; stdin?: boolean }
): Promise<string> {
  if (options.file) {
    return readFileSync(options.file, 'utf-8');
  }

  if (options.stdin) {
    // Read from stdin
    return new Promise((resolve, reject) => {
      let data = '';
      process.stdin.setEncoding('utf8');
      process.stdin.on('readable', () => {
        let chunk;
        while ((chunk = process.stdin.read()) !== null) {
          data += chunk;
        }
      });
      process.stdin.on('end', () => resolve(data));
      process.stdin.on('error', reject);
    });
  }

  throw new Error('Either --file or --stdin must be provided');
}

export const syncCommand = new Command('sync')
  .description('Sync phase output to Cloudflare')
  .argument('<phase>', `Phase name (${PHASES.slice(0, 3).join(', ')}, ...)`)
  .argument('<run-id>', 'Run ID')
  .option('-f, --file <path>', 'Read content from file')
  .option('--stdin', 'Read content from stdin')
  .option('--no-embed', 'Skip embedding generation')
  .action(
    async (
      phase: string,
      runId: string,
      options: { file?: string; stdin?: boolean; embed?: boolean }
    ) => {
      // Validate phase
      if (!isValidPhase(phase)) {
        console.error(
          chalk.red(`Invalid phase: ${phase}\n\nValid phases: ${PHASES.join(', ')}`)
        );
        process.exit(1);
      }

      // Validate run exists
      const spinner = ora(`Syncing ${phase}...`).start();

      try {
        const run = await getRun(runId);
        if (!run) {
          spinner.fail(chalk.red(`Run not found: ${runId}`));
          process.exit(1);
        }

        // Read content
        const content = await readInput(options);

        // Parse JSON to validate
        let parsed: unknown;
        try {
          parsed = JSON.parse(content);
        } catch {
          spinner.fail(chalk.red('Invalid JSON content'));
          process.exit(1);
        }

        // Store artifact in D1
        const artifactId = generateArtifactId();
        await storeArtifact(artifactId, runId, phase, parsed);

        // Update current phase
        await updateRunPhase(runId, phase);

        // Generate embedding and store in Vectorize (unless --no-embed)
        if (options.embed !== false) {
          spinner.text = `Syncing ${phase} (generating embedding)...`;
          try {
            await storeVector(runId, phase, content);
          } catch (embedError) {
            // Don't fail if embedding fails - just warn
            spinner.warn(
              chalk.yellow(
                `Synced ${phase} (embedding failed: ${(embedError as Error).message})`
              )
            );
            return;
          }
        }

        spinner.succeed(chalk.green(`Synced ${phase} to run ${runId}`));

        // Show next phase if applicable
        const currentIndex = PHASES.indexOf(phase);
        if (currentIndex < PHASES.length - 1) {
          const nextPhase = PHASES[currentIndex + 1];
          console.log(chalk.dim(`\nNext phase: ${nextPhase}`));
          console.log(
            chalk.dim(`  foundation sync ${nextPhase} ${runId} --file <output.json>`)
          );
        } else {
          console.log(chalk.green('\n✓ All phases complete!'));
          console.log(chalk.dim(`  Mark as done: foundation run complete ${runId}`));
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to sync'));
        console.error(chalk.red((error as Error).message));
        process.exit(1);
      }
    }
  );

// Also export a helper command to show phase list
export const phasesCommand = new Command('phases')
  .description('List all planning phases')
  .action(() => {
    console.log(chalk.bold('\nPlanning Phases (in order):\n'));

    const stages = [
      { name: 'Discovery', phases: PHASES.slice(0, 5) },
      { name: 'Validation', phases: [PHASES[4]] },
      { name: 'Strategy', phases: PHASES.slice(5, 8) },
      { name: 'Design', phases: PHASES.slice(8, 11) },
      { name: 'Execution', phases: PHASES.slice(11, 15) },
    ];

    let index = 1;
    for (const stage of stages) {
      console.log(chalk.bold.cyan(`${stage.name}:`));
      for (const phase of stage.phases) {
        if (PHASES.includes(phase as Phase)) {
          console.log(`  ${String(index++).padStart(2)}. ${phase}`);
        }
      }
      console.log();
    }
  });
