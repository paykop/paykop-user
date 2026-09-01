/**
 * Build-time environment validation. Run via `npm run validate-env`.
 * Skipped in development; enforced when NODE_ENV=production.
 */

const isProduction = process.env.NODE_ENV === "production";

function fail(message: string): never {
  console.error(`[validate-env] ${message}`);
  process.exit(1);
}

function warn(message: string): void {
  console.warn(`[validate-env] WARNING: ${message}`);
}

if (isProduction) {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (!wsUrl) {
    fail("NEXT_PUBLIC_WS_URL is required in production (must use wss://)");
  }
  if (!wsUrl.startsWith("wss://")) {
    fail(`NEXT_PUBLIC_WS_URL must use wss:// in production (got: ${wsUrl})`);
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiUrl) {
    warn("NEXT_PUBLIC_API_BASE_URL is not set; build will use localhost default");
  }
} else {
  console.log("[validate-env] Skipping production checks (NODE_ENV !== production)");
}

// Validate image hosts if set
const imageHosts = process.env.NEXT_PUBLIC_IMAGE_HOSTS;
if (imageHosts) {
  for (const host of imageHosts.split(",").map((h) => h.trim()).filter(Boolean)) {
    if (host === "**") {
      warn(`Rejecting dangerous image host pattern: "${host}"`);
    }
  }
}

console.log("[validate-env] OK");
