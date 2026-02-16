import { cfFetch, getAccountId } from './client.js';
import { getConfig } from '../config.js';

interface R2Object {
  key: string;
  size: number;
  uploaded: string;
  etag: string;
  httpEtag: string;
  version: string;
}

interface R2ListResult {
  objects: R2Object[];
  truncated: boolean;
  cursor?: string;
}

export async function r2Upload(
  key: string,
  content: string | Buffer,
  contentType: string = 'application/json'
): Promise<void> {
  const accountId = getAccountId();
  const config = getConfig();
  const bucketName = config.bucketName;

  // Use the S3-compatible API for uploads
  // Note: This requires the R2 API token to have S3 API access
  await cfFetch<void>(
    `/accounts/${accountId}/r2/buckets/${bucketName}/objects/${encodeURIComponent(key)}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body: content,
    }
  );
}

export async function r2Download(key: string): Promise<string> {
  const accountId = getAccountId();
  const config = getConfig();
  const bucketName = config.bucketName;

  const result = await cfFetch<{ body: string }>(
    `/accounts/${accountId}/r2/buckets/${bucketName}/objects/${encodeURIComponent(key)}`,
    {
      method: 'GET',
    }
  );

  return result.body;
}

export async function r2List(prefix: string = ''): Promise<R2Object[]> {
  const accountId = getAccountId();
  const config = getConfig();
  const bucketName = config.bucketName;

  const params = new URLSearchParams();
  if (prefix) params.set('prefix', prefix);

  const result = await cfFetch<R2ListResult>(
    `/accounts/${accountId}/r2/buckets/${bucketName}/objects?${params.toString()}`
  );

  return result.objects;
}

export async function r2Delete(key: string): Promise<void> {
  const accountId = getAccountId();
  const config = getConfig();
  const bucketName = config.bucketName;

  await cfFetch<void>(
    `/accounts/${accountId}/r2/buckets/${bucketName}/objects/${encodeURIComponent(key)}`,
    {
      method: 'DELETE',
    }
  );
}

// Planning-specific R2 operations

export async function uploadPlanningPackage(
  runId: string,
  content: unknown
): Promise<string> {
  const key = `runs/${runId}/planning-package.json`;
  await r2Upload(key, JSON.stringify(content, null, 2), 'application/json');
  return key;
}

export async function downloadPlanningPackage(
  runId: string
): Promise<unknown | null> {
  try {
    const key = `runs/${runId}/planning-package.json`;
    const content = await r2Download(key);
    return JSON.parse(content);
  } catch {
    return null;
  }
}
