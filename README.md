# Excalidraw Diagram Skill

Codex skill for creating `.excalidraw` JSON diagrams that make visual arguments for workflows, architectures, systems, protocols, and concepts.

The skill includes:

- Excalidraw diagram design methodology
- Semantic color palette
- JSON element templates
- Excalidraw schema notes
- Playwright-based renderer for PNG previews

## Install With npm

```bash
npm install -g excalidraw-diagram-skill
excalidraw-diagram-skill install
```

Or run it without a global install:

```bash
npx excalidraw-diagram-skill install
```

By default this installs to the current project:

```text
.codex/skills/excalidraw-diagram
```

Global install:

```bash
excalidraw-diagram-skill install --global
```

Custom skills directory:

```bash
excalidraw-diagram-skill install --target ~/.codex/skills --force
```

## Usage

After installation, ask Codex for an Excalidraw diagram:

```text
Use $excalidraw-diagram to create an Excalidraw architecture diagram for my data pipeline.
```

The skill guides Codex to plan the visual argument, create `.excalidraw` JSON, render a PNG preview, inspect it, and iterate.

## Renderer Setup

The skill can render `.excalidraw` files to PNG using Playwright and Chromium:

```bash
python -m pip install -r .codex/skills/excalidraw-diagram/scripts/requirements.txt
python -m playwright install chromium
```

Then render:

```bash
python .codex/skills/excalidraw-diagram/scripts/render_excalidraw.py path/to/diagram.excalidraw
```

The renderer imports Excalidraw's browser bundle, so first-time rendering may require network access.

## Repository Layout

```text
skills/excalidraw-diagram/     # Bundled Codex skill
bin/excalidraw-diagram-skill.js # npm installer CLI
skill.json                     # Skill metadata
package.json                   # npm package metadata
```

## Publishing

1. Replace `YOUR_GITHUB_USERNAME` in `package.json` and `skill.json`.
2. Create a public GitHub repository named `excalidraw-diagram-skill`.
3. Push this folder.
4. Publish the npm package:

```bash
npm login
npm publish --access public
```

## License

MIT
