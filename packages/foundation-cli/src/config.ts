import Conf from 'conf';

export interface FoundationConfig {
  accountId: string;
  apiToken: string;
  databaseId: string;
  bucketName: string;
  vectorIndexName: string;
}

const config = new Conf<FoundationConfig>({
  projectName: 'foundation-cli',
  schema: {
    accountId: {
      type: 'string',
      default: '',
    },
    apiToken: {
      type: 'string',
      default: '',
    },
    databaseId: {
      type: 'string',
      default: '',
    },
    bucketName: {
      type: 'string',
      default: 'planning-files',
    },
    vectorIndexName: {
      type: 'string',
      default: 'planning-embeddings',
    },
  },
});

export function getConfig(): FoundationConfig {
  return {
    accountId: config.get('accountId'),
    apiToken: config.get('apiToken'),
    databaseId: config.get('databaseId'),
    bucketName: config.get('bucketName'),
    vectorIndexName: config.get('vectorIndexName'),
  };
}

export function setConfig(key: keyof FoundationConfig, value: string): void {
  config.set(key, value);
}

export function isConfigured(): boolean {
  const cfg = getConfig();
  return !!(cfg.accountId && cfg.apiToken && cfg.databaseId);
}

export function getConfigPath(): string {
  return config.path;
}
