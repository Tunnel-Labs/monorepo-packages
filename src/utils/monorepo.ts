import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

export function getMonorepoDirpath(
  curDirectory: string = process.cwd()
): string | undefined {
  curDirectory = curDirectory.startsWith("file://")
    ? fileURLToPath(curDirectory)
    : curDirectory;

  if (fs.statSync(curDirectory).isFile()) {
    curDirectory = path.dirname(curDirectory);
  }

  let maybeRoot: string | undefined;
  while (curDirectory !== "/") {
    const pnpmWorkspaceExists = fs.existsSync(
      path.join(curDirectory, "pnpm-workspace.yaml")
    );
    const pnpmLockExists = fs.existsSync(
      path.join(curDirectory, "pnpm-lock.yaml")
    );

    if (pnpmLockExists) {
      maybeRoot = curDirectory;
    }

    if (pnpmWorkspaceExists) {
      return curDirectory;
    }

    curDirectory = path.dirname(curDirectory);
  }

  return maybeRoot;
}