import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { writeFileSync } from 'fs';
import { getAllArtifacts, getRun } from '../cloudflare/d1.js';

export const auditCommand = new Command('audit')
  .description('Generate hallucination audit prompt')
  .argument('<run-id>', 'Run ID to audit')
  .option('-o, --output <file>', 'Output file path (default: stdout)')
  .action(async (runId: string, options: { output?: string }) => {
    const spinner = ora('Preparing audit...').start();

    try {
      // Get run details
      const run = await getRun(runId);
      if (!run) {
        spinner.fail(chalk.red(`Run not found: ${runId}`));
        process.exit(1);
      }

      // Get all artifacts
      const artifacts = await getAllArtifacts(runId);

      if (artifacts.length === 0) {
        spinner.fail(chalk.red('No artifacts found to audit'));
        process.exit(1);
      }

      // Build audit prompt
      const artifactSummary: Record<string, unknown> = {};
      for (const artifact of artifacts) {
        try {
          artifactSummary[artifact.phase] = JSON.parse(artifact.content);
        } catch {
          artifactSummary[artifact.phase] = artifact.content;
        }
      }

      const auditPrompt = `# Planning Run Audit: ${runId}

## Instructions

You are auditing a planning run that was generated in a previous session.
You have NO memory of generating this content - review it as if seeing it for the first time.

Your task is to identify:
1. **Unsourced claims**: Statistics, market sizes, or facts without citations
2. **Internal contradictions**: Conflicts between different phase outputs
3. **Logical gaps**: Missing reasoning or unstated assumptions
4. **Hallucinations**: Claims that seem fabricated, unrealistic, or unlikely
5. **Outdated information**: References that may be out of date

## Run Details

**Run ID**: ${runId}
**Original Idea**: ${run.idea}
${run.refined_idea ? `**Refined Idea**: ${run.refined_idea}` : ''}
**Status**: ${run.status}
**Phases Completed**: ${artifacts.length}

## Artifacts to Audit

\`\`\`json
${JSON.stringify(artifactSummary, null, 2)}
\`\`\`

## Output Format

Provide your audit report as JSON:

\`\`\`json
{
  "summary": "Overall assessment (1-2 sentences)",
  "overallScore": 0-100,
  "issues": [
    {
      "phase": "phase name",
      "severity": "critical|high|medium|low",
      "type": "unsourced|contradiction|logical_gap|hallucination|outdated",
      "claim": "The specific claim that's problematic",
      "problem": "Why this is an issue",
      "suggestion": "How to fix it"
    }
  ],
  "strengths": [
    "What's done well"
  ],
  "recommendations": [
    "Overall recommendations for improvement"
  ]
}
\`\`\`

Begin your audit now.`;

      spinner.stop();

      if (options.output) {
        writeFileSync(options.output, auditPrompt);
        console.log(chalk.green(`✓ Audit prompt saved to ${options.output}`));
        console.log(
          chalk.dim('\nUsage: Paste this into a fresh Claude Code session after /clear')
        );
      } else {
        console.log(auditPrompt);
      }
    } catch (error) {
      spinner.fail(chalk.red('Failed to prepare audit'));
      console.error(chalk.red((error as Error).message));
      process.exit(1);
    }
  });
