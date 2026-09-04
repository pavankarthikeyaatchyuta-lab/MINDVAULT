import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

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

  // 1. In local development, prefer local environment variable if present to avoid 5-second Secret Manager timeouts
  if (process.env.NODE_ENV !== 'production') {
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
