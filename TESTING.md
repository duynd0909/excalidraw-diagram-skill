# Testing the Excalidraw Diagram Skill

## Prerequisites

- Node.js >= 18
- Python >= 3.8 (for rendering)
- A supported AI assistant: Claude Code, Codex, or Gemini CLI

## Build

Before testing, compile the TypeScript source:

```bash
npm run build
```

This compiles `src/` to `dist/`. Run this after any changes to `src/installer.ts` or `src/cli.tsx`.

## 1. Test the interactive TUI

Run the CLI with no arguments to launch the interactive Ink TUI:

```bash
node bin/excalidraw-skill.js
```

You should see an interactive menu to:
1. Select AI assistant (arrow keys + Enter)
2. Choose project or global install
3. Optionally set up the Python renderer
4. Confirm and install

Press Escape at any step to cancel.

To test non-TTY fallback:

```bash
echo "" | node bin/excalidraw-skill.js
```

Should print a message about using flags instead.

## 2. Test the flag-based installer

From the repo root, run a dry-run to verify the installer works without copying files:

```bash
npm test
```

This validates install for Codex, Claude, and Gemini in dry-run mode.

To test a specific platform:

```bash
node bin/excalidraw-skill.js install --ai claude --dry-run
node bin/excalidraw-skill.js install --ai codex --dry-run
node bin/excalidraw-skill.js install --ai gemini --dry-run
```

## 2. Install the skill locally

Install into the current project so Claude Code picks it up:

```bash
node bin/excalidraw-skill.js install --ai claude
```

For global availability across all projects:

```bash
node bin/excalidraw-skill.js install --ai claude --global
```

To reinstall after changes, add `--force`:

```bash
node bin/excalidraw-skill.js install --ai claude --force
```

Verify the files landed:

```bash
ls .claude/skills/excalidraw-diagram/
```

You should see: `SKILL.md`, `references/`, `scripts/`, `agents/`.

## 3. Test the rendering pipeline

A sample diagram is provided at `test/test-diagram.excalidraw`. Use it to verify the renderer works.

Install renderer dependencies (can also be done during skill install with `--setup-renderer`):

```bash
node bin/excalidraw-skill.js install --ai claude --setup-renderer
```

Or install manually:

```bash
cd skills/excalidraw-diagram/scripts
pip install -r requirements.txt
python -m playwright install chromium
cd ../../..
```

Then render the test diagram:

```bash
python skills/excalidraw-diagram/scripts/render_excalidraw.py test/test-diagram.excalidraw
```

This generates `test/test-diagram.png`. Open it to verify a three-step CI/CD pipeline (git commit -> Build -> Deploy) rendered correctly.

## 4. Test with the AI assistant

After installing the skill, restart Claude Code (or your chosen assistant). Then invoke the skill:

```
/excalidraw-diagram Draw a simple request flow from client to API to database
```

The assistant should:

1. Read the skill references (`color-palette.md`, `element-templates.md`, `json-schema.md`)
2. Generate a `.excalidraw` JSON file
3. Optionally render it to PNG using the renderer script

Check the generated `.excalidraw` file for:

- Valid JSON structure with `type`, `version`, `source`, `elements`, `appState`, `files`
- Colors from the palette in `references/color-palette.md`
- `fontFamily: 3`, `roughness: 0`, `opacity: 100` on elements
- Proper arrow bindings with `startBinding` and `endBinding`

## 5. Re-test after changes

If you edit the skill source under `skills/excalidraw-diagram/`:

```bash
node bin/excalidraw-skill.js install --ai claude --force
```

Then restart the assistant to pick up the updated skill files.
