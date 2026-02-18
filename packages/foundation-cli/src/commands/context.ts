import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { queryVectorize } from '../cloudflare/vectorize.js';
import { getAllArtifacts, getRun } from '../cloudflare/d1.js';

export const contextCommand = new Command('context')
  .description('Get RAG context for a phase')
  .argument('<run-id>', 'Run ID')
  .option('-p, --phase <phase>', 'Current phase (for context relevance)')
  .option('-q, --query <query>', 'Custom query for semantic search')
  .option('-k, --top-k <number>', 'Number of results to return', '5')
  .option('--json', 'Output as JSON')
  .option('--prior-only', 'Only return prior phase outputs (no RAG)')
  .action(
    async (
      runId: string,
      options: {
        phase?: string;
        query?: string;
        topK: string;
        json?: boolean;
        priorOnly?: boolean;
      }
    ) => {
      const spinner = ora('Fetching context...').start();

      try {
        // Verify run exists
        const run = await getRun(runId);
        if (!run) {
          spinner.fail(chalk.red(`Run not found: ${runId}`));
          process.exit(1);
        }

        // Get all prior artifacts
        const artifacts = await getAllArtifacts(runId);

        // Build prior outputs context
        const priorOutputs: Record<string, unknown> = {};
        for (const artifact of artifacts) {
          try {
            priorOutputs[artifact.phase] = JSON.parse(artifact.content);
          } catch {
            priorOutputs[artifact.phase] = artifact.content;
          }
        }

        let ragResults: Array<{ phase: string; content: string; score: number }> =
          [];

        // Get RAG context if not prior-only
        if (!options.priorOnly && (options.query || options.phase)) {
          const query =
            options.query ??
            `Context relevant to ${options.phase} phase based on prior research`;

          try {
            ragResults = await queryVectorize(
              query,
              runId,
              parseInt(options.topK)
            );
          } catch (ragError) {
            // RAG may not be available in local dev
            spinner.warn(
              chalk.yellow(
                `RAG unavailable: ${(ragError as Error).message}. Using prior outputs only.`
              )
            );
          }
        }

        spinner.stop();

        if (options.json) {
          console.log(
            JSON.stringify(
              {
                runId,
                idea: run.idea,
                refinedIdea: run.refined_idea,
                priorOutputs,
                ragResults,
              },
              null,
              2
            )
          );
          return;
        }

        // Human-readable output
        console.log('\n' + chalk.bold('Context for Planning Phase'));
        console.log('─'.repeat(60));
        console.log(chalk.bold('Run ID: ') + chalk.cyan(runId));
        console.log(chalk.bold('Idea: ') + run.idea);
        if (run.refined_idea && run.refined_idea !== run.idea) {
          console.log(chalk.bold('Refined: ') + run.refined_idea);
        }

        // Show prior phases completed
        console.log('\n' + chalk.bold('Prior Phase Outputs:'));
        const phases = Object.keys(priorOutputs);
        if (phases.length === 0) {
          console.log(chalk.dim('  No prior outputs yet.'));
        } else {
          for (const phase of phases) {
            const output = priorOutputs[phase];
            const preview =
              typeof output === 'object'
                ? JSON.stringify(output).slice(0, 100) + '...'
                : String(output).slice(0, 100);
            console.log(`  ${chalk.cyan(phase)}: ${chalk.dim(preview)}`);
          }
        }

        // Show RAG results
        if (ragResults.length > 0) {
          console.log('\n' + chalk.bold('RAG Context (Semantic Search):'));
          for (const result of ragResults) {
            console.log(
              `  [${chalk.yellow(result.score.toFixed(2))}] ${chalk.cyan(result.phase)}`
            );
            console.log(
              `    ${chalk.dim(result.content.slice(0, 150))}${result.content.length > 150 ? '...' : ''}`
            );
          }
        }

        console.log('\n' + chalk.dim('Use --json for full output'));
      } catch (error) {
        spinner.fail(chalk.red('Failed to fetch context'));
        console.error(chalk.red((error as Error).message));
        process.exit(1);
      }
    }
  );
