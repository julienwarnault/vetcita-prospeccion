import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { parseArgs } from "node:util";
import { z } from "zod";

const { values } = parseArgs({
  options: {
    email: { type: "string" },
    states: { type: "string", default: "" },
    remote: { type: "boolean", default: false },
  },
});
const email = z.string().trim().toLowerCase().email().parse(values.email);
let hidden = false;
const output = new Writable({
  write(chunk, _encoding, done) {
    if (!hidden) process.stdout.write(chunk);
    done();
  },
});
const prompt = createInterface({
  input: process.stdin,
  output,
  terminal: !!process.stdin.isTTY,
});
process.stdout.write(`Mot de passe pour ${email} : `);
hidden = true;
let password: string;
try {
  password = await prompt.question("");
} finally {
  hidden = false;
  prompt.close();
  process.stdout.write("\n");
}
if (!password || password.length > 1024)
  throw new Error("Le mot de passe doit contenir de 1 à 1024 caractères.");
const quote = (value: string) => `'${value.replaceAll("'", "''")}'`;
const directory = await mkdtemp(join(tmpdir(), "vetcita-user-"));
try {
  const file = join(directory, "user.sql");
  await writeFile(
    file,
    `INSERT INTO users (id, email, password, states) VALUES (${quote(crypto.randomUUID())}, ${quote(email)}, ${quote(password)}, ${quote(values.states ?? "")});`,
    { mode: 0o600 },
  );
  const result = spawnSync(
    "npx",
    [
      "wrangler",
      "d1",
      "execute",
      "DB",
      "--config",
      "wrangler.jsonc",
      values.remote ? "--remote" : "--local",
      ...(!values.remote ? ["--persist-to", ".wrangler/state"] : []),
      "--file",
      file,
    ],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        WRANGLER_SEND_METRICS: "false",
        WRANGLER_WRITE_LOGS: "false",
      },
    },
  );
  if (result.status !== 0) process.exitCode = 1;
} finally {
  await rm(directory, { recursive: true, force: true });
}
