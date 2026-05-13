# Excalidraw Skill MCP App Plan

## Summary
Build a separate npm package, `excalidraw-skill-mcp`, as a local MCP App server that lets an AI create interactive Excalidraw diagrams inside MCP-App-capable hosts, then export the result as `.excalidraw`, PNG, or SVG. Implement it in a new `mcp/` package inside this repo, without converting the current installer package into a workspace yet.

Use the official Excalidraw MCP App as the compatibility/behavior reference, and follow MCP Apps’ official pattern: a tool declares `_meta.ui.resourceUri`, the server serves a bundled `ui://` HTML resource, and the iframe UI receives tool results.

## Key Changes
- Add a new standalone package under `mcp/` with its own `package.json`, TypeScript config, Vite build, server entrypoint, and README.
- Use stable MCP dependencies: `@modelcontextprotocol/sdk`, `@modelcontextprotocol/ext-apps`, plus `@excalidraw/excalidraw`, React, Vite, and `vite-plugin-singlefile`.
- Expose a local server command:
  - `npx excalidraw-skill-mcp`
  - default URL: `http://localhost:3001/mcp`
  - optional flags: `--port <number>`, `--host <host>`, `--stdio`
- MCP tools:
  - `read_me`: returns concise Excalidraw scene guidance adapted from this repo’s skill methodology.
  - `create_view`: accepts scene-level Excalidraw JSON or an ordered element stream, opens the interactive Excalidraw MCP App view, and returns a `checkpointId`.
- Scene input should support:
  - normal `.excalidraw` shape: `{ type: "excalidraw", elements, appState?, files? }`
  - element-stream shape: `{ elements: [...] }`
  - pseudo-elements compatible with the official approach: `cameraUpdate`, `delete`, `restoreCheckpoint`
- UI behavior:
  - Render an embedded Excalidraw canvas.
  - Apply AI-created scene data immediately.
  - Keep edits interactive inside the iframe.
  - Provide export actions for `.excalidraw`, PNG, and SVG.
  - If host download is blocked, show copyable JSON as a fallback.
- Persistence:
  - Use in-memory checkpoint storage only for continuing a diagram during the current local server session.
  - Do not add durable server storage in v1.

## Implementation Notes
- Keep the current root `excalidraw-skill` package untouched except for optional README cross-linking.
- Do not vendor large official Excalidraw MCP source wholesale. Reuse ideas and tool compatibility; copy code only if necessary and preserve MIT attribution.
- Bundle the UI into one HTML file so the MCP App resource has a simple sandbox/CSP story.
- Validate incoming scene data before rendering:
  - require non-empty elements
  - reject malformed JSON
  - enforce max payload size, default 5 MB
  - return clear tool errors instead of crashing the server
- Keep exports browser-side in v1; the server should not write user diagrams to disk unless a later feature explicitly adds storage.

## Test Plan
- `mcp/npm run build` compiles server and bundles the app.
- Unit tests cover scene normalization, pseudo-element handling, checkpoint restore/delete behavior, and invalid input errors.
- Smoke test local server:
  - start `excalidraw-skill-mcp --port 3001`
  - call `read_me`
  - call `create_view` with a small two-box diagram
  - verify the MCP result includes app UI metadata and a checkpoint id
- UI test with the MCP Apps basic host:
  - render the iframe
  - verify the Excalidraw canvas is non-empty
  - verify `.excalidraw`, PNG, and SVG export controls are present
- Manual acceptance:
  - connect from one MCP-App-capable client
  - prompt: “Draw an architecture diagram for a user, API, worker, and database”
  - confirm the diagram appears interactively and exports correctly.

## Assumptions
- “Integrate with official one” means compatibility/reference integration, not making the official remote server a dependency.
- Package name default is `excalidraw-skill-mcp`; npm lookup currently shows it as unpublished.
- Local npm server is the v1 delivery path; hosted deployment and MCPB packaging are later additions.
- References used for the plan: MCP Apps docs https://modelcontextprotocol.io/extensions/apps/overview, MCP App build guide https://modelcontextprotocol.io/extensions/apps/build, official Excalidraw MCP repo https://github.com/excalidraw/excalidraw-mcp.
