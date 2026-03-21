import { spawn } from "node:child_process";

const [, , nodeEnv, command, ...args] = process.argv;

if (!nodeEnv || !command) {
  console.error("Usage: node scripts/run-with-env.mjs <NODE_ENV> <command> [...args]");
  process.exit(1);
}

const child = spawn(command, args, {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: nodeEnv,
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
