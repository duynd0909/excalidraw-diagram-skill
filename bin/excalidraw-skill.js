#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function isInteractive(argv) {
  return (
    argv.length === 0 ||
    (argv.length === 1 && (argv[0] === "install" || argv[0] === "init"))
  );
}

function parseArgs(argv) {
  const args = [...argv];
  const options = {
    command: "install",
    ai: "codex",
    global: false,
    force: false,
    dryRun: false,
    setupRenderer: false,
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
      case "--setup-renderer":
        options.setupRenderer = true;
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

const argv = process.argv.slice(2);

// Interactive mode: no args or bare "install"
if (isInteractive(argv)) {
  if (!process.stdout.isTTY) {
    console.log(
      "Non-interactive terminal detected. Use flags: --ai <name> [--global] [--setup-renderer]"
    );
    console.log("Example: npx excalidraw-skill install --ai claude");
    process.exit(1);
  }

  import("../dist/cli.js").then((mod) => {
    mod.run();
  }).catch((err) => {
    console.error("Failed to start interactive mode:", err.message);
    console.error("Run with --help for non-interactive usage.");
    process.exit(1);
  });
} else {
  // Flag-based mode: import the installer and run directly
  import("../dist/installer.js").then((mod) => {
    if (argv.includes("-h") || argv.includes("--help")) {
      mod.printHelp();
      process.exit(0);
    }

    const options = parseArgs(argv);

    if (options.help || options.command === "help") {
      mod.printHelp();
      process.exit(0);
    }

    if (options.command !== "install" && options.command !== "init") {
      throw new Error(`Unknown command: ${options.command}`);
    }

    // Resolve aliases (e.g. gemni -> gemini, openai -> codex)
    if (options.ai) {
      options.ai = mod.resolveAlias(options.ai);
    }

    mod.install(options);
  }).catch((err) => {
    console.error(`Error: ${err.message}`);
    console.error("Run with --help for usage.");
    process.exit(1);
  });
}
