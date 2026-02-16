import { Command } from 'commander';
import chalk from 'chalk';
import { setConfig, getConfig, getConfigPath, isConfigured } from '../config.js';

export const configCommand = new Command('config')
  .description('Configure Cloudflare credentials');

configCommand
  .command('set')
  .description('Set configuration values')
  .option('--account-id <id>', 'Cloudflare account ID')
  .option('--api-token <token>', 'Cloudflare API token')
  .option('--database-id <id>', 'D1 database ID for planning-primary')
  .option('--bucket-name <name>', 'R2 bucket name (default: planning-files)')
  .option('--vector-index <name>', 'Vectorize index name (default: planning-embeddings)')
  .action((options) => {
    let updated = false;

    if (options.accountId) {
      setConfig('accountId', options.accountId);
      console.log(chalk.green('✓') + ' Account ID set');
      updated = true;
    }

    if (options.apiToken) {
      setConfig('apiToken', options.apiToken);
      console.log(chalk.green('✓') + ' API token set');
      updated = true;
    }

    if (options.databaseId) {
      setConfig('databaseId', options.databaseId);
      console.log(chalk.green('✓') + ' Database ID set');
      updated = true;
    }

    if (options.bucketName) {
      setConfig('bucketName', options.bucketName);
      console.log(chalk.green('✓') + ' Bucket name set');
      updated = true;
    }

    if (options.vectorIndex) {
      setConfig('vectorIndexName', options.vectorIndex);
      console.log(chalk.green('✓') + ' Vector index name set');
      updated = true;
    }

    if (!updated) {
      console.log(chalk.yellow('No configuration options provided.'));
      console.log('\nUsage: foundation config set [options]\n');
      console.log('Options:');
      console.log('  --account-id <id>      Cloudflare account ID');
      console.log('  --api-token <token>    Cloudflare API token');
      console.log('  --database-id <id>     D1 database ID');
      console.log('  --bucket-name <name>   R2 bucket name');
      console.log('  --vector-index <name>  Vectorize index name');
    } else {
      console.log(chalk.dim(`\nConfig stored at: ${getConfigPath()}`));
    }
  });

configCommand
  .command('show')
  .description('Show current configuration')
  .action(() => {
    const config = getConfig();

    console.log(chalk.bold('\nCurrent Configuration:\n'));

    console.log(`  Account ID:     ${config.accountId ? chalk.green(config.accountId) : chalk.red('not set')}`);
    console.log(`  API Token:      ${config.apiToken ? chalk.green('[set]') : chalk.red('not set')}`);
    console.log(`  Database ID:    ${config.databaseId ? chalk.green(config.databaseId) : chalk.red('not set')}`);
    console.log(`  Bucket Name:    ${chalk.cyan(config.bucketName)}`);
    console.log(`  Vector Index:   ${chalk.cyan(config.vectorIndexName)}`);

    console.log(chalk.dim(`\nConfig file: ${getConfigPath()}`));

    if (!isConfigured()) {
      console.log(chalk.yellow('\n⚠ Configuration incomplete. Run:'));
      console.log(chalk.cyan('  foundation config set --account-id <id> --api-token <token> --database-id <id>'));
    }
  });

configCommand
  .command('path')
  .description('Show config file path')
  .action(() => {
    console.log(getConfigPath());
  });
