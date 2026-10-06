import { generateKeyPairSync } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
const { privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const jwk = privateKey.export({ format: "jwk" });
const publicKey = Buffer.concat([
  Buffer.from([4]),
  Buffer.from(jwk.x, "base64url"),
  Buffer.from(jwk.y, "base64url"),
]).toString("base64url");
await mkdir(".secrets", { recursive: true, mode: 0o700 });
await writeFile(
  ".secrets/push-secrets.json",
  JSON.stringify({ VAPID_PUBLIC_KEY: publicKey, VAPID_PRIVATE_KEY: jwk.d }),
  { mode: 0o600, flag: "wx" },
);
console.log(
  "VAPID keys saved to .secrets/push-secrets.json (excluded from Git). Existing keys are never overwritten.",
);
