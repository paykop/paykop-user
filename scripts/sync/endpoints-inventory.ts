/**
 * Dry inventory of user-web API paths from src/lib/api/endpoints.ts.
 * Usage: npx tsx scripts/sync/endpoints-inventory.ts
 */

import { readFileSync } from "fs";
import { join } from "path";

const root = join(__dirname, "..", "..");
const endpointsFile = join(root, "src", "lib", "api", "endpoints.ts");
const source = readFileSync(endpointsFile, "utf-8");

const paths = new Set<string>();
const re = /apiClient<[^>]*>\(\s*`([^`]+)`|apiClient<[^>]*>\(\s*"([^"]+)"/g;
let m: RegExpExecArray | null;
while ((m = re.exec(source)) !== null) {
  const p = m[1] || m[2];
  if (p) paths.add(p.split("?")[0]);
}

const sorted = [...paths].sort();
console.log(`\nUser web API paths (${sorted.length}):\n`);
sorted.forEach((p) => console.log(`  ${p}`));
