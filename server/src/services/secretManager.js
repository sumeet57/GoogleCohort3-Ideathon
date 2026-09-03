import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { config } from "../config.js";

const isCloudRun = Boolean(process.env.K_SERVICE);

let client;

if (isCloudRun) {
  // Cloud Run uses its attached service account automatically.
  client = new SecretManagerServiceClient({
    projectId: config.GOOGLE_CLOUD_PROJECT,
  });
} else {
  // Local development uses the local service-account JSON.
  const { default: serviceAccount } = await import(
    "../../secret-local.json",
    {
      with: { type: "json" },
    }
  );

  client = new SecretManagerServiceClient({
    projectId: serviceAccount.project_id,
    credentials: {
      client_email: serviceAccount.client_email,
      private_key: serviceAccount.private_key,
    },
  });
}

let cachedApiKey = null;

export async function getGeminiApiKey() {
  if (cachedApiKey) {
    return cachedApiKey;
  }

  const name =
    `projects/${config.GOOGLE_CLOUD_PROJECT}` +
    `/secrets/${config.GEMINI_API_KEY_SECRET_ID}` +
    `/versions/${config.GEMINI_API_KEY_SECRET_VERSION}`;

  const [version] = await client.accessSecretVersion({
    name,
  });

  const key = version?.payload?.data
    ?.toString("utf8")
    ?.trim();

  if (!key) {
    throw new Error("Gemini API key secret is empty or unavailable.");
  }

  cachedApiKey = key;

  return cachedApiKey;
}