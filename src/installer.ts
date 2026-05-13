import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "..");
const skillName = "excalidraw-diagram";
const sourceSkillDir = path.join(packageRoot, "skills", skillName);

export { sourceSkillDir, skillName };

export interface AssistantConfig {
  label: string;
  projectSkillsDir: string[];
  globalBaseEnv: string;
  globalBaseDir: string;
  agentConfigFile: string;
}

export const supportedAssistants: Record<string, AssistantConfig> = {
  claude: {
    label: "Claude Code",
    projectSkillsDir: [".claude", "skills"],
    globalBaseEnv: "CLAUDE_HOME",
    globalBaseDir: ".claude",
    agentConfigFile: "claude.yaml",
  },
  cursor: {
    label: "Cursor",
    projectSkillsDir: [".cursor", "skills"],
    globalBaseEnv: "CURSOR_HOME",
    globalBaseDir: ".cursor",
    agentConfigFile: "cursor.yaml",
  },
  windsurf: {
    label: "Windsurf",
    projectSkillsDir: [".windsurf", "skills"],
    globalBaseEnv: "WINDSURF_HOME",
    globalBaseDir: ".windsurf",
    agentConfigFile: "windsurf.yaml",
  },
  antigravity: {
    label: "Antigravity",
    projectSkillsDir: [".agents", "skills"],
    globalBaseEnv: "AGENTS_HOME",
    globalBaseDir: ".agents",
    agentConfigFile: "agent.yaml",
  },
  copilot: {
    label: "GitHub Copilot",
    projectSkillsDir: [".github", "prompts"],
    globalBaseEnv: "GITHUB_HOME",
    globalBaseDir: ".github",
    agentConfigFile: "copilot.yaml",
  },
  kiro: {
    label: "Kiro",
    projectSkillsDir: [".kiro", "steering"],
    globalBaseEnv: "KIRO_HOME",
    globalBaseDir: ".kiro",
    agentConfigFile: "kiro.yaml",
  },
  codex: {
    label: "Codex",
    projectSkillsDir: [".codex", "skills"],
    globalBaseEnv: "CODEX_HOME",
    globalBaseDir: ".codex",
    agentConfigFile: "openai.yaml",
  },
  roocode: {
    label: "Roo Code",
    projectSkillsDir: [".roo", "skills"],
    globalBaseEnv: "ROO_HOME",
    globalBaseDir: ".roo",
    agentConfigFile: "roocode.yaml",
  },
  qoder: {
    label: "Qoder",
    projectSkillsDir: [".qoder", "skills"],
    globalBaseEnv: "QODER_HOME",
    globalBaseDir: ".qoder",
    agentConfigFile: "qoder.yaml",
  },
  gemini: {
    label: "Gemini CLI",
    projectSkillsDir: [".gemini", "skills"],
    globalBaseEnv: "GEMINI_HOME",
    globalBaseDir: ".gemini",
    agentConfigFile: "gemini.yaml",
  },
  trae: {
    label: "Trae",
    projectSkillsDir: [".trae", "skills"],
    globalBaseEnv: "TRAE_HOME",
    globalBaseDir: ".trae",
    agentConfigFile: "trae.yaml",
  },
  opencode: {
    label: "OpenCode",
    projectSkillsDir: [".opencode", "skills"],
    globalBaseEnv: "OPENCODE_HOME",
    globalBaseDir: ".opencode",
    agentConfigFile: "opencode.yaml",
  },
  continue: {
    label: "Continue",
    projectSkillsDir: [".continue", "skills"],
    globalBaseEnv: "CONTINUE_HOME",
    globalBaseDir: ".continue",
    agentConfigFile: "continue.yaml",
  },
  codebuddy: {
    label: "CodeBuddy",
    projectSkillsDir: [".codebuddy", "skills"],
    globalBaseEnv: "CODEBUDDY_HOME",
    globalBaseDir: ".codebuddy",
    agentConfigFile: "codebuddy.yaml",
  },
  droid: {
    label: "Droid (Factory)",
    projectSkillsDir: [".factory", "skills"],
    globalBaseEnv: "FACTORY_HOME",
    globalBaseDir: ".factory",
    agentConfigFile: "droid.yaml",
  },
  kilocode: {
    label: "KiloCode",
    projectSkillsDir: [".kilocode", "skills"],
    globalBaseEnv: "KILOCODE_HOME",
    globalBaseDir: ".kilocode",
    agentConfigFile: "kilocode.yaml",
  },
  warp: {
    label: "Warp",
    projectSkillsDir: [".warp", "skills"],
    globalBaseEnv: "WARP_HOME",
    globalBaseDir: ".warp",
    agentConfigFile: "warp.yaml",
  },
  augment: {
    label: "Augment",
    projectSkillsDir: [".augment", "skills"],
    globalBaseEnv: "AUGMENT_HOME",
    globalBaseDir: ".augment",
    agentConfigFile: "augment.yaml",
  },
};

export const AI_ALIASES: Record<string, string> = {
  gemni: "gemini",
  gemimi: "gemini",
  openai: "codex",
  roo: "roocode",
  "roo-code": "roocode",
  "github-copilot": "copilot",
  "kilo-code": "kilocode",
  "code-buddy": "codebuddy",
};

export function resolveAlias(ai: string): string {
  const lower = ai.toLowerCase().trim();
  return AI_ALIASES[lower] ?? lower;
}

export interface InstallOptions {
  ai: string;
  global: boolean;
  force: boolean;
  dryRun: boolean;
  setupRenderer: boolean;
  target: string | null;
}

export interface InstallResult {
  assistant: string;
  label: string;
  skillsDir: string;
  destSkillDir: string;
}

export function expandHome(inputPath: string): string {
  if (!inputPath) return inputPath;
  if (inputPath === "~") return os.homedir();
  if (inputPath.startsWith("~/") || inputPath.startsWith("~\\")) {
    return path.join(os.homedir(), inputPath.slice(2));
  }
  return inputPath;
}

export function getAssistants(ai: string): string[] {
  if (!ai || ai === "all") return Object.keys(supportedAssistants);
  const resolved = resolveAlias(ai);
  if (!supportedAssistants[resolved]) {
    const validList = [...Object.keys(supportedAssistants), "all"].join(", ");
    throw new Error(
      `Unsupported assistant "${ai}". Supported values: ${validList}.`
    );
  }
  return [resolved];
}

export function getSkillsDir(
  options: InstallOptions,
  assistant: string
): string {
  if (options.target) {
    return path.resolve(expandHome(options.target));
  }

  const config = supportedAssistants[assistant];

  if (options.global) {
    const globalBase = process.env[config.globalBaseEnv]
      ? path.resolve(expandHome(process.env[config.globalBaseEnv]!))
      : path.join(os.homedir(), config.globalBaseDir);
    return path.join(globalBase, "skills");
  }

  return path.join(process.cwd(), ...config.projectSkillsDir);
}

function copyDirFiltered(
  src: string,
  dest: string,
  excludeDir: string | null
): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === "__pycache__" || entry.name === ".DS_Store") continue;
    if (excludeDir && entry.isDirectory() && entry.name === excludeDir) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirFiltered(srcPath, destPath, null);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export function checkExisting(results: InstallResult[]): string | null {
  for (const item of results) {
    if (fs.existsSync(item.destSkillDir)) {
      return item.destSkillDir;
    }
  }
  return null;
}

export function planInstalls(options: InstallOptions): InstallResult[] {
  const assistants = getAssistants(options.ai);
  if (options.target && assistants.length > 1) {
    throw new Error("--target can only be used with a single --ai value.");
  }

  return assistants.map((assistant) => {
    const skillsDir = getSkillsDir(options, assistant);
    return {
      assistant,
      label: supportedAssistants[assistant].label,
      skillsDir,
      destSkillDir: path.join(skillsDir, skillName),
    };
  });
}

export function runInstall(
  options: InstallOptions,
  installs: InstallResult[]
): void {
  const agentsSrcDir = path.join(sourceSkillDir, "agents");

  for (const item of installs) {
    if (fs.existsSync(item.destSkillDir)) {
      fs.rmSync(item.destSkillDir, { recursive: true, force: true });
    }
    fs.mkdirSync(item.skillsDir, { recursive: true });

    // Copy everything except agents/ directory
    copyDirFiltered(sourceSkillDir, item.destSkillDir, "agents");

    // Copy the relevant agent config file(s)
    const agentsDestDir = path.join(item.destSkillDir, "agents");
    fs.mkdirSync(agentsDestDir, { recursive: true });

    if (options.ai === "all") {
      for (const entry of fs.readdirSync(agentsSrcDir)) {
        const srcPath = path.join(agentsSrcDir, entry);
        if (fs.statSync(srcPath).isFile()) {
          fs.copyFileSync(srcPath, path.join(agentsDestDir, entry));
        }
      }
    } else {
      const config = supportedAssistants[item.assistant];
      const agentSrcFile = path.join(agentsSrcDir, config.agentConfigFile);
      if (fs.existsSync(agentSrcFile)) {
        fs.copyFileSync(agentSrcFile, path.join(agentsDestDir, config.agentConfigFile));
      }
    }
  }
}

export function setupRenderer(scriptsDir: string): void {
  const reqFile = path.join(scriptsDir, "requirements.txt");
  if (!fs.existsSync(reqFile)) {
    throw new Error(`requirements.txt not found at ${reqFile}`);
  }

  execSync("python -m pip install -r " + JSON.stringify(reqFile), {
    stdio: "pipe",
  });
  execSync("python -m playwright install chromium", { stdio: "pipe" });
}

export function install(options: InstallOptions): InstallResult[] {
  if (!fs.existsSync(sourceSkillDir)) {
    throw new Error(`Bundled skill not found: ${sourceSkillDir}`);
  }

  const installs = planInstalls(options);

  console.log(`Source: ${sourceSkillDir}`);
  for (const item of installs) {
    console.log(`${item.label}: ${item.destSkillDir}`);
  }

  if (options.dryRun) {
    console.log("Dry run complete. No files were copied.");
    return installs;
  }

  if (!options.force) {
    const existing = checkExisting(installs);
    if (existing) {
      throw new Error(
        `Skill already exists at ${existing}. Re-run with --force to overwrite.`
      );
    }
  }

  runInstall(options, installs);

  console.log("");
  console.log(
    `Installed Excalidraw Diagram skill for ${installs.map((item) => item.label).join(", ")}.`
  );

  if (options.setupRenderer) {
    const scriptsDir = path.join(installs[0].destSkillDir, "scripts");
    try {
      setupRenderer(scriptsDir);
      console.log("Renderer setup complete.");
    } catch {
      console.error("\nWarning: Renderer setup failed. You can run it manually later.");
    }
  } else {
    console.log("");
    console.log(
      "Optional: add --setup-renderer to install Python renderer dependencies automatically,"
    );
    console.log("or run manually:");
    console.log(
      `  python -m pip install -r "${installs[0].destSkillDir}/scripts/requirements.txt"`
    );
    console.log("  python -m playwright install chromium");
  }

  return installs;
}

export function printHelp(): void {
  console.log(`Excalidraw Diagram Skill installer

Usage:
  excalidraw-skill install [options]

Options:
  --ai <name>       Target assistant: claude, cursor, windsurf, antigravity,
                    copilot, kiro, codex, roocode, qoder, gemini, trae,
                    opencode, continue, codebuddy, droid, kilocode, warp,
                    augment, or all. Default: codex
  --global          Install to the assistant's global skills directory
  --target <dir>    Install into a custom skills directory. Not valid with --ai all
  --force           Overwrite an existing excalidraw-diagram skill
  --setup-renderer  Install Python renderer dependencies (pip + playwright)
  --dry-run         Show what would happen without copying files
  -h, --help        Show this help

Aliases:
  openai → codex, gemni/gemimi → gemini, roo/roo-code → roocode,
  github-copilot → copilot, kilo-code → kilocode, code-buddy → codebuddy

Examples:
  npx excalidraw-skill install
  npx excalidraw-skill install --ai claude
  npx excalidraw-skill install --ai gemini
  npx excalidraw-skill install --ai cursor
  npx excalidraw-skill install --ai copilot
  npx excalidraw-skill install --ai all
  npx excalidraw-skill install --global
  npx excalidraw-skill install --global --setup-renderer
  npx excalidraw-skill install --target ~/.codex/skills --force
`);
}
