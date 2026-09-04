import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import fs from 'fs';
import path from 'path';

// In-memory cache for resolved secrets to avoid duplicate network roundtrips
const secretCache = new Map<string, { value: string; fetchedAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

let client: SecretManagerServiceClient | null = null;

function getSecretClient(): SecretManagerServiceClient {
  if (!client) {
    client = new SecretManagerServiceClient();
  }
  return client;
}

/**
 * Reads a value directly from .env.local if present on disk.
 * Overrides stale OS-level system environment variables in local development.
 */
function getEnvLocalValue(key: string): string | undefined {
  try {
    const envLocalPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envLocalPath)) {
      const content = fs.readFileSync(envLocalPath, 'utf-8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const idx = trimmed.indexOf('=');
        if (idx !== -1 && trimmed.slice(0, idx).trim() === key) {
          let val = trimmed.slice(idx + 1).trim();
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            val = val.slice(1, -1).trim();
          }
          if (val) return val;
        }
      }
    }
  } catch {
    // Fall back to process.env
  }
  return undefined;
}

/**
 * Retrieves a secret value securely.
 * Priority:
 * 1. Cache if still valid
 * 2. Google Cloud Secret Manager (for Cloud Run production)
 * 3. Local environment variable fallback (for local development)
 * 
 * Never hardcodes or commits secrets.
 */
export async function getSecret(
  secretName: string,
  fallbackEnvVar?: string
): Promise<string> {
  const cached = secretCache.get(secretName);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.value;
  }

  // 1. In local development, prefer explicit .env.local on disk first to override any stale parent OS-level variables
  if (process.env.NODE_ENV !== 'production') {
    if (fallbackEnvVar) {
      const diskVal = getEnvLocalValue(fallbackEnvVar);
      if (diskVal) {
        secretCache.set(secretName, { value: diskVal, fetchedAt: Date.now() });
        return diskVal;
      }
    }
    const diskSecretVal = getEnvLocalValue(secretName);
    if (diskSecretVal) {
      secretCache.set(secretName, { value: diskSecretVal, fetchedAt: Date.now() });
      return diskSecretVal;
    }

    if (fallbackEnvVar && process.env[fallbackEnvVar]) {
      const envValue = process.env[fallbackEnvVar]!.trim();
      secretCache.set(secretName, { value: envValue, fetchedAt: Date.now() });
      return envValue;
    }
    if (process.env[secretName]) {
      const envValue = process.env[secretName]!.trim();
      secretCache.set(secretName, { value: envValue, fetchedAt: Date.now() });
      return envValue;
    }
  }

  // 2. Try Google Cloud Secret Manager if project ID is available (Production on Cloud Run)
  const projectId = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
  if (projectId) {
    try {
      const secretClient = getSecretClient();
      const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
      const [version] = await secretClient.accessSecretVersion({ name });
      const payload = version.payload?.data?.toString();
      if (payload) {
        secretCache.set(secretName, { value: payload, fetchedAt: Date.now() });
        return payload;
      }
    } catch (err: any) {
      // In local development or if permission missing, log non-sensitive warning and fall back
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[SecretManager] Could not access secret '${secretName}' via Secret Manager. Falling back to local env.`);
      }
    }
  }

  // 2. Fall back to local environment variable
  if (fallbackEnvVar && process.env[fallbackEnvVar]) {
    const envValue = process.env[fallbackEnvVar]!;
    secretCache.set(secretName, { value: envValue, fetchedAt: Date.now() });
    return envValue;
  }

  // Also check if the secretName directly matches an env var
  if (process.env[secretName]) {
    const envValue = process.env[secretName]!;
    secretCache.set(secretName, { value: envValue, fetchedAt: Date.now() });
    return envValue;
  }

  throw new Error(`Secret '${secretName}' (fallback '${fallbackEnvVar}') is not configured.`);
}

/**
 * Convenience helper to resolve the server-side Gemini API key.
 */
export async function getGeminiApiKey(): Promise<string> {
  return getSecret(
    process.env.SECRET_NAME_GEMINI_API_KEY || 'MINDVAULT_GEMINI_API_KEY',
    'GEMINI_API_KEY'
  );
}
