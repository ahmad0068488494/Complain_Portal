import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const frontendDir = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(frontendDir, "../../backend");
const isWindows = process.platform === "win32";

const processes = [
  {
    name: "Backend",
    cwd: backendDir,
    args: ["run", "dev"],
  },
  {
    name: "Frontend",
    cwd: frontendDir,
    args: ["run", "dev"],
  },
];

const children = processes.map(({ name, cwd, args }) => {
  const child = spawn("npm", args, {
    cwd,
    stdio: "inherit",
    shell: isWindows,
  });

  child.on("error", (error) => {
    console.error(`[${name}] Could not start: ${error.message}`);
    shutdown(1);
  });

  child.on("exit", (code) => {
    if (code !== null && code !== 0) {
      console.error(`[${name}] stopped with exit code ${code}`);
      shutdown(code);
    }
  });

  return child;
});

let stopping = false;

function shutdown(exitCode = 0) {
  if (stopping) return;
  stopping = true;

  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }

  process.exitCode = exitCode;
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log("Starting Complaint Portal frontend and backend...");
console.log("Frontend: http://localhost:5173");
console.log("Backend:  http://127.0.0.1:5000/api/health");
