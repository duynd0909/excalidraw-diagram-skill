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
const supportedAssistants = {
  codex: {
    label: "Codex",
    projectSkillsDir: [".codex", "skills"],
    globalBaseEnv: "CODEX_HOME",
    globalBaseDir: ".codex",
  },
  claude: {
    label: "Claude Code",
    projectSkillsDir: [".claude", "skills"],
    globalBaseEnv: "CLAUDE_HOME",
    globalBaseDir: ".claude",
  },
  gemini: {
    label: "Gemini CLI",
    projectSkillsDir: [".gemini", "skills"],
    globalBaseEnv: "GEMINI_HOME",
    globalBaseDir: ".gemini",
  },
};

function printHelp() {
  console.log(`Excalidraw Diagram Skill installer

Usage:
  excalidraw-diagram-skill install [options]
  excalidraw-skill install [options]

Options:
  --ai <name>       Target assistant: codex, claude, gemini, or all. Default: codex
  --global          Install to the assistant's global skills directory
  --target <dir>    Install into a custom skills directory. Not valid with --ai all
  --force           Overwrite an existing excalidraw-diagram skill
  --dry-run         Show what would happen without copying files
  -h, --help        Show this help

Examples:
  npx excalidraw-diagram-skill install
  npx excalidraw-diagram-skill install --ai claude
  npx excalidraw-diagram-skill install --ai gemini
  npx excalidraw-diagram-skill install --ai all
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

function getAssistants(ai) {
  if (!ai || ai === "all") return Object.keys(supportedAssistants);
  if (!supportedAssistants[ai]) {
    throw new Error(`Unsupported assistant "${ai}". Supported values: codex, claude, gemini, all.`);
  }
  return [ai];
}

function getSkillsDir(options, assistant) {
  if (options.target) {
    return path.resolve(expandHome(options.target));
  }

  const config = supportedAssistants[assistant];

  if (options.global) {
    const globalBase = process.env[config.globalBaseEnv]
      ? path.resolve(expandHome(process.env[config.globalBaseEnv]))
      : path.join(os.homedir(), config.globalBaseDir);
    return path.join(globalBase, "skills");
  }

  return path.join(process.cwd(), ...config.projectSkillsDir);
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
  if (!fs.existsSync(sourceSkillDir)) {
    throw new Error(`Bundled skill not found: ${sourceSkillDir}`);
  }

  const assistants = getAssistants(options.ai);
  if (options.target && assistants.length > 1) {
    throw new Error("--target can only be used with a single --ai value.");
  }

  const installs = assistants.map((assistant) => {
    const skillsDir = getSkillsDir(options, assistant);
    return {
      assistant,
      label: supportedAssistants[assistant].label,
      skillsDir,
      destSkillDir: path.join(skillsDir, skillName),
    };
  });

  console.log(`Source: ${sourceSkillDir}`);
  for (const item of installs) {
    console.log(`${item.label}: ${item.destSkillDir}`);
  }

  if (options.dryRun) {
    console.log("Dry run complete. No files were copied.");
    return;
  }

  if (!options.force) {
    for (const item of installs) {
      if (fs.existsSync(item.destSkillDir)) {
        throw new Error(`Skill already exists at ${item.destSkillDir}. Re-run with --force to overwrite.`);
      }
    }
  }

  for (const item of installs) {
    if (fs.existsSync(item.destSkillDir)) {
      fs.rmSync(item.destSkillDir, { recursive: true, force: true });
    }
    fs.mkdirSync(item.skillsDir, { recursive: true });
    copyDir(sourceSkillDir, item.destSkillDir);
  }

  console.log("");
  console.log(`Installed Excalidraw Diagram skill for ${installs.map((item) => item.label).join(", ")}.`);
  console.log("");
  console.log("Optional renderer setup:");
  console.log(`  python -m pip install -r "<installed-skill-dir>/scripts/requirements.txt"`);
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
