#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "..");
const skillName = "excalidraw-diagram";
const sourceSkillDir = path.join(packageRoot, "skills", skillName);

function printHelp() {
  console.log(`Excalidraw Diagram Skill installer

Usage:
  excalidraw-diagram-skill install [options]
  excalidraw-skill install [options]

Options:
  --ai codex        Target assistant. Only "codex" is supported in this package. Default: codex
  --global          Install to CODEX_HOME/skills or ~/.codex/skills instead of this project
  --target <dir>    Install into a custom skills directory
  --force           Overwrite an existing excalidraw-diagram skill
  --dry-run         Show what would happen without copying files
  -h, --help        Show this help

Examples:
  npx excalidraw-diagram-skill install
  npx excalidraw-diagram-skill install --global
  npx excalidraw-diagram-skill install --target ~/.codex/skills --force
`);
}

function parseArgs(argv) {
  const args = [...argv];
  const options = {
    command: "install",
    ai: "codex",
    global: false,
    force: false,
    dryRun: false,
    target: null,
    help: false,
  };

  if (args[0] && !args[0].startsWith("-")) {
    options.command = args.shift();
  }

  while (args.length) {
    const arg = args.shift();
    switch (arg) {
      case "--ai":
        options.ai = args.shift();
        break;
      case "--global":
        options.global = true;
        break;
      case "--target":
        options.target = args.shift();
        break;
      case "--force":
        options.force = true;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "-h":
      case "--help":
        options.help = true;
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

function expandHome(inputPath) {
  if (!inputPath) return inputPath;
  if (inputPath === "~") return os.homedir();
  if (inputPath.startsWith("~/") || inputPath.startsWith("~\\")) {
    return path.join(os.homedir(), inputPath.slice(2));
  }
  return inputPath;
}

function getSkillsDir(options) {
  if (options.target) {
    return path.resolve(expandHome(options.target));
  }

  if (options.global) {
    const codexHome = process.env.CODEX_HOME
      ? path.resolve(expandHome(process.env.CODEX_HOME))
      : path.join(os.homedir(), ".codex");
    return path.join(codexHome, "skills");
  }

  return path.join(process.cwd(), ".codex", "skills");
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === "__pycache__" || entry.name === ".DS_Store") continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function install(options) {
  if (options.ai !== "codex") {
    throw new Error(`Unsupported assistant "${options.ai}". This package currently installs the Codex skill only.`);
  }

  if (!fs.existsSync(sourceSkillDir)) {
    throw new Error(`Bundled skill not found: ${sourceSkillDir}`);
  }

  const skillsDir = getSkillsDir(options);
  const destSkillDir = path.join(skillsDir, skillName);

  console.log(`Source:      ${sourceSkillDir}`);
  console.log(`Destination: ${destSkillDir}`);

  if (options.dryRun) {
    console.log("Dry run complete. No files were copied.");
    return;
  }

  if (fs.existsSync(destSkillDir)) {
    if (!options.force) {
      throw new Error(`Skill already exists at ${destSkillDir}. Re-run with --force to overwrite.`);
    }
    fs.rmSync(destSkillDir, { recursive: true, force: true });
  }

  fs.mkdirSync(skillsDir, { recursive: true });
  copyDir(sourceSkillDir, destSkillDir);

  console.log("");
  console.log("Installed Excalidraw Diagram skill for Codex.");
  console.log("");
  console.log("Optional renderer setup:");
  console.log(`  python -m pip install -r "${path.join(destSkillDir, "scripts", "requirements.txt")}"`);
  console.log("  python -m playwright install chromium");
}

try {
  const options = parseArgs(process.argv.slice(2));
  if (options.help || options.command === "help") {
    printHelp();
    process.exit(0);
  }
  if (options.command !== "install" && options.command !== "init") {
    throw new Error(`Unknown command: ${options.command}`);
  }
  install(options);
} catch (error) {
  console.error(`Error: ${error.message}`);
  console.error("Run with --help for usage.");
  process.exit(1);
}
