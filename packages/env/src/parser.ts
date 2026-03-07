import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Parse .env file format: KEY=VALUE
 * Supports: comments (#), quoted values (single/double), multiline (backslash continuation)
 */
export function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = content.split(/\r?\n/);
  let i = 0;

  while (i < lines.length) {
    let line = lines[i] ?? "";

    // Line continuation: lines ending with \
    while (line.endsWith("\\") && i + 1 < lines.length) {
      const next = lines[++i];
      line = `${line.slice(0, -1).trimEnd()}\n${next ?? ""}`;
    }

    line = line.trim();
    if (!line || line.startsWith("#")) {
      i++;
      continue;
    }

    // export KEY=value (bash compatibility)
    if (line.startsWith("export ")) {
      line = line.slice(7).trim();
    }

    const eqIndex = line.indexOf("=");
    if (eqIndex <= 0) {
      i++;
      continue;
    }

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    if (value.startsWith('"')) {
      value = parseDoubleQuoted(value);
    } else if (value.startsWith("'")) {
      value = parseSingleQuoted(value);
    }

    // Remove inline comment (unquoted values only)
    const hashIdx = value.indexOf("#");
    if (hashIdx >= 0 && !value.startsWith('"') && !value.startsWith("'")) {
      value = value.slice(0, hashIdx).trim();
    }

    result[key] = value;
    i++;
  }

  return result;
}

function parseDoubleQuoted(str: string): string {
  if (!str.startsWith('"')) return str;
  let result = "";
  let i = 1;
  while (i < str.length) {
    const c = str[i];
    if (c === '"') return result;
    if (c === "\\") {
      i++;
      const next = str[i];
      if (next === "n") result += "\n";
      else if (next === "r") result += "\r";
      else if (next === "t") result += "\t";
      else if (next === '"') result += '"';
      else if (next === "\\") result += "\\";
      else result += next ?? "";
    } else {
      result += c;
    }
    i++;
  }
  return result;
}

function parseSingleQuoted(str: string): string {
  if (!str.startsWith("'")) return str;
  let result = "";
  let i = 1;
  while (i < str.length) {
    const c = str[i];
    if (c === "'") return result;
    result += c;
    i++;
  }
  return result;
}

export function loadEnvFile(filePath: string, cwd: string): Record<string, string> {
  const fullPath = join(cwd, filePath);
  if (!existsSync(fullPath)) return {};
  try {
    const content = readFileSync(fullPath, "utf-8");
    return parseEnvFile(content);
  } catch {
    return {};
  }
}
