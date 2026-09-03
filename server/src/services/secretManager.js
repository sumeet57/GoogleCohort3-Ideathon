import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { config } from '../config.js';

const client = new SecretManagerServiceClient();
let cachedApiKey = null;

export async function getGeminiApiKey() {
  if (cachedApiKey) return cachedApiKey;

  const name = `projects/${config.GOOGLE_CLOUD_PROJECT}/secrets/${config.GEMINI_API_KEY_SECRET_ID}/versions/${config.GEMINI_API_KEY_SECRET_VERSION}`;
  const [version] = await client.accessSecretVersion({ name });
  const key = version?.payload?.data?.toString('utf8')?.trim();

  if (!key) {
    throw new Error('Gemini API key secret is empty or unavailable.');
  }

  cachedApiKey = key;
  return cachedApiKey;
}
