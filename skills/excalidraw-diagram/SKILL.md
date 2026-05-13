---
name: excalidraw-diagram
description: Create, edit, render, and validate Excalidraw `.excalidraw` JSON diagrams that explain workflows, architectures, systems, protocols, concepts, or visual arguments. Use when the user asks for an Excalidraw file, diagram JSON, architecture/workflow visualization, concept map, process diagram, or a rendered diagram preview.
---

# Excalidraw Diagram

Create `.excalidraw` JSON diagrams that argue visually, not just display labeled boxes.

Always read `references/color-palette.md` before creating or editing a diagram. Use it as the single source of truth for shape fills, strokes, text colors, evidence artifact backgrounds, and canvas background.

Read `references/element-templates.md` when you need copyable JSON templates. Read `references/json-schema.md` when you need Excalidraw element/property details.

## Workflow

1. Assess the diagram depth.
   - Use a simple/conceptual diagram for mental models, abstract concepts, or quick overviews.
   - Use a comprehensive/technical diagram for real systems, protocols, architecture, tutorials, or educational content.

2. Research before drawing technical diagrams.
   - Look up actual specs, payloads, event names, endpoints, APIs, and method names.
   - Prefer primary sources such as official docs and source repositories.
   - Use real terminology and examples instead of generic placeholders.

3. Plan the visual argument.
   - Ask what each concept does, how concepts relate, and what transformation or flow needs to be seen.
   - Apply the isomorphism test: if all text vanished, the structure should still communicate the idea.
   - Use evidence artifacts for technical diagrams: code snippets, JSON/data payloads, event sequences, UI mockups, real inputs/outputs, or actual API names.

4. Build the `.excalidraw` JSON.
   - Use the standard Excalidraw wrapper with `type`, `version`, `source`, `elements`, `appState`, and `files`.
   - Use descriptive string IDs such as `router_decision`, `state_delta_event`, or `summary_flow_arrow`.
   - Use stable seeds and namespace them by section for large diagrams.
   - Keep `text` and `originalText` as readable words only.

5. Render, inspect, and fix.
   - Run the renderer in `scripts/render_excalidraw.py`.
   - View the generated PNG with Codex image inspection tools.
   - Fix layout issues and re-render until the diagram is presentable.

## Visual Method

Default to visual structure over decoration. Shape should carry meaning.

- Fan-out: one source spawning many outputs.
- Convergence: many inputs combining into one result.
- Tree: hierarchy or nested ownership, usually with lines and free-floating labels.
- Timeline: sequences, lifecycles, event streams, or step order.
- Cycle: loops, feedback, iteration, or continuous improvement.
- Cloud: fuzzy context, memory, state, or abstraction.
- Assembly line: input transforms through processing into output.
- Side-by-side: comparison, before/after, alternatives, or tradeoffs.
- Gap/break: phase changes, boundaries, resets, or context separation.

Use a different visual pattern for each major concept in multi-concept diagrams. Avoid uniform card grids unless the subject itself is a uniform grid.

## Containers And Text

Default to free-floating text. Add a container only when it creates grouping, carries semantic meaning, anchors arrows, or represents a distinct system object.

Use containers for focal system objects, decisions, processes, inputs/outputs, or grouped artifacts. Use typography alone for section titles, annotations, labels, metadata, and supporting explanation.

Aim for fewer than 30 percent of text elements to be inside containers. Timelines and trees should usually be built from lines, marker dots, and free-floating text rather than boxed labels.

Use `fontFamily: 3`, clean readable font sizes, `roughness: 0` for professional diagrams, and `opacity: 100` for all elements.

## Technical Diagrams

For comprehensive technical diagrams, include multiple zoom levels:

- Summary flow: a quick overview of the whole pipeline or process.
- Section boundaries: labeled regions that group related responsibilities or phases.
- Detail inside sections: evidence artifacts that show what the real data, API calls, UI, or events look like.

Evidence artifacts should teach. Show sample payloads, real method names, concrete event names, or representative input/output content. Do not label a box "JSON" when the viewer needs to see the actual JSON shape.

## Large Diagrams

Build large diagrams section by section.

1. Create the base file with the JSON wrapper and first section.
2. Add one natural visual section per edit.
3. Use descriptive IDs and section-based seed ranges.
4. Update arrow bindings on both connected elements when crossing sections.
5. Review the full JSON for missing references, broken bindings, cramped sections, and imbalanced whitespace.
6. Render and iterate.

Avoid generating a very large diagram in one pass. Section-based construction produces fewer truncation, binding, and layout mistakes.

## Rendering

The renderer lives in `scripts/render_excalidraw.py` and writes a PNG beside the `.excalidraw` file unless `--output` is provided.

From the skill directory:

```powershell
python -m pip install -r scripts\requirements.txt
python -m playwright install chromium
python scripts\render_excalidraw.py <path-to-file.excalidraw>
```

If `uv` is available:

```powershell
cd scripts
uv sync
uv run python render_excalidraw.py <path-to-file.excalidraw>
```

The HTML renderer imports Excalidraw's browser bundle, so first-time rendering can require network access.

After rendering, inspect the PNG. Check for clipped text, overlaps, arrows crossing through elements, ambiguous labels, uneven spacing, unreadably small text, and lopsided composition. Fix the JSON and repeat until the result matches the plan and can be shown without caveats.

## Quality Checklist

- Depth is appropriate: simple/conceptual or comprehensive/technical.
- Technical diagrams use researched real terms, examples, payloads, or API names.
- The diagram makes a visual argument that words alone would not make as clearly.
- Major concepts use distinct visual patterns.
- Containers are meaningful and not used as default decoration.
- Lines, marker dots, and typography carry structure where possible.
- Every real relationship has an arrow or structural line.
- Text fits, is readable, and uses `fontFamily: 3`.
- Colors come from `references/color-palette.md`.
- Modern diagrams use `roughness: 0` and `opacity: 100`.
- Rendered PNG has been inspected and corrected.
