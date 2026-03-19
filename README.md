# Enhancement Suite

A modular Obsidian plugin that bundles four productivity enhancements into one lightweight, independently configurable package.

Each module can be toggled on or off from the settings panel. The plugin automatically switches between English and Simplified Chinese based on your Obsidian language setting.

---

## Features

### Table Enhancement

- Sort any table column ascending or descending via command palette
- Row filtering support (toggle in settings)

### YAML / Frontmatter

- **Real-time validation** — highlights YAML syntax errors in the frontmatter as you type (300 ms debounce), with an actionable error message
- **Frontmatter summary** — command that shows field count, key names, and any validation errors for the active note
- **JSON Property Viewer** — in Reading View, object and array typed properties get a right-click copy menu and a click-to-open tree viewer modal (collapsible nodes, one-click JSON copy)

### Export

- Export the active note to **clean Markdown** (strips Obsidian-specific syntax such as wikilinks and callouts)
- Export to **standalone HTML** (inline styles, no external dependencies — share a single file)
- Trigger Obsidian's built-in **PDF export** directly from the command palette
- Output files are saved to the vault root; filename collisions are avoided automatically by appending a timestamp

### Find & Replace

- Full-featured search dialog with **case-sensitive** and **regex** toggles
- Live preview of up to 50 matches with highlighted terms and line numbers
- **Replace** (first match) or **Replace All** — replacements use the editor's native `replaceRange` API so they are fully undoable

---

## Installation

### Community Plugin (recommended)

1. Open **Settings → Community plugins → Browse**
2. Search for **Enhancement Suite**
3. Click **Install**, then **Enable**

### Manual

Copy `main.js`, `manifest.json`, and `styles.css` to:

```
<Vault>/.obsidian/plugins/enhancement-suite/
```

Reload Obsidian and enable the plugin under **Settings → Community plugins**.

---

## Requirements

- Obsidian **0.15.0** or later
- Works on desktop and mobile

---

## Development

```bash
npm install
npm run dev     # watch mode (esbuild)
npm run build   # production build (tsc type-check + esbuild)
npm run lint    # ESLint
```

The compiled `main.js` is **not** committed to this repository. Download it from the [Releases](../../releases) page or build it locally.

---

## License

[MIT](LICENSE)
