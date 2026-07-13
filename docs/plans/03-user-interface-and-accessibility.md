# User interface and accessibility

## Visual direction

The interface follows GitHub's functional design language:

- System typography and GitHub-like density.
- Primer controls, tokens, spacing, borders, radii, and focus treatment.
- Octicons for familiar issue, repository, branch, export, and layout actions.
- Neutral canvas and panel surfaces in light and dark modes.
- Blue for selection/readiness, green for open work, purple for closed work, and attention tones for cycles or upstream context.

The application should feel adjacent to GitHub Issues without reproducing GitHub's global navigation. The graph is the distinctive product surface.

## Desktop shell

```text
┌──────────────────────────────── application header ────────────────────────────────┐
├──────────────────────────────── graph summary ─────────────────────────────────────┤
│ issue list + filters │ dependency graph canvas │ selected issue inspector          │
│ independently scroll │ pan / zoom / focus       │ independently scroll              │
└────────────────────────────────────────────────────────────────────────────────────┘
```

The application occupies one viewport. The graph canvas receives the remaining height after header, summary, and toolbar rows. The issue list and inspector scroll independently so a long issue set or Markdown body cannot expand the canvas off screen.

## Header and summary

The header contains:

- Product identity.
- Current `owner/repository` and demo/live source state.
- JSON export.
- Automatic system light/dark mode.
- Repository/token dialog trigger.

The summary shows open, ready, blocked, and layer counts, plus cycles when present. Counts remain compact enough to scan at narrow widths.

## Issue navigation

The left rail contains:

- Result count.
- Search input.
- State and readiness selectors.
- Expandable label checkboxes.
- Cross-repository visibility control.
- Clear-filter action.
- Keyboard-operable issue buttons sorted with ready work first.

Rows show state, title, repository when external, issue number, direct blocker count, and up to two labels. The selected row uses both background and inset emphasis, not color alone.

## Graph canvas

The graph toolbar contains a compact legend, direction controls, fit, and PNG export. On phones it also exposes explicit Issues and Details actions.

Node text includes issue number and title. The initial view centers the selected ready issue at a readable zoom rather than shrinking a deep graph until labels disappear. Fit remains available for structural overview.

Selecting a node updates the shared selection. Upstream, downstream, and unrelated states remain visually distinguishable in both color modes. Canvas interaction must not be the only way to select an issue.

## Issue inspector

The inspector shows:

- Open/closed state and canonical issue identity.
- Title, layer, readiness, author, milestone, and labels.
- Direct blockers and directly blocked issues with state and source links.
- GitHub-flavored Markdown description.
- Open-on-GitHub action.

Bulk repository load excludes bodies. The inspector owns the visible loading state for a lazy issue-body request.

## Responsive behavior

### Tablet

- Preserve issue rail and graph where space allows.
- Move the inspector to a right-side overlay.
- Hide secondary button labels and lower-priority legend items.
- Provide an explicit close control in the inspector.

### Phone

- Give the graph the viewport after compact header and summary rows.
- Move the issue rail to a left overlay.
- Move the inspector to a bottom sheet.
- Expose Issues and Details buttons in the graph toolbar.
- Preserve explicit close controls and prevent background panes from forcing document growth.

## Color modes

Follow `prefers-color-scheme` continuously. Primer ThemeProvider and Cytoscape receive the same effective mode without an application-level override. Exported PNG background follows the effective graph mode.

Do not use color alone for state. Issue icons, border style, line style, labels, and text provide redundant cues.

## Accessibility contract

- Every control has a visible label or accessible name.
- Repository dialog uses native modal semantics, labeled heading, required controls, and cancel behavior.
- Issue rows are native buttons with visible focus and current selection state.
- Filter controls use native inputs/selects or Primer controls with associated labels.
- The graph container has an accessible summary, while the issue list and inspector expose the complete operable alternative.
- Selection changes are announced through a polite live region.
- External links identify their destination through surrounding issue context.
- Reduced-motion preference disables non-essential animation and smooth scrolling.
- Text, controls, graph states, focus rings, and warning surfaces target WCAG 2.2 AA contrast.

## UI acceptance criteria

- Desktop, tablet, and phone layouts expose search, graph, selection, and details.
- No pane grows the document beyond the viewport during normal use.
- The default graph view has readable selected-path labels; full fit remains one action away.
- Light and dark modes preserve semantic distinctions and focus visibility.
- A keyboard-only user can open a repository, filter issues, select an issue, inspect relationships, and open GitHub.
- A screen-reader user can complete the core workflow without interpreting the canvas.
