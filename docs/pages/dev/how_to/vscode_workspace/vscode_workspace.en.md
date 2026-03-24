# VS Code Workspace Setup for IASO

## Why use a multi-root workspace?

IASO plugins (e.g. `plugins/saas`, `plugins/snt_malaria`) are often in `.gitignore` or developed in separate repositories. When opened as a single folder, they may not appear in the VS Code explorer, and imports from the main IASO app (`iaso.*`, `plugins.*`) fail to resolve for Python and TypeScript.

Using `iaso.code-workspace` with multiple folders solves this:

- **Visibility**: Plugin folders appear in the explorer even when gitignored.
- **Import resolution**: Python (Pyright) and TypeScript correctly resolve `iaso.*` and `plugins.*` imports when each plugin is a workspace folder.
- **Shared config**: All folders use the same Python interpreter and analysis paths.

## Minimal configuration

Create or edit `iaso.code-workspace` at the project root with at least:

```json
{
  "folders": [
    { "path": ".", "name": "IASO" },
    { "path": "plugins/saas", "name": "Saas Plugin" },
    { "path": "plugins/snt_malaria", "name": "SNT Malaria Plugin" }
  ],
  "settings": {
    "explorer.excludeGitIgnore": false,
    "python.defaultInterpreterPath": "${workspaceFolder:IASO}/venv/bin/python",
    "python.analysis.extraPaths": ["${workspaceFolder:IASO}"],
    "python.analysis.autoSearchPaths": true
  }
}
```

### What each setting does

| Setting | Purpose |
|---------|---------|
| `folders` | Adds IASO root and each plugin as workspace roots so they appear in the explorer. |
| `explorer.excludeGitIgnore` | Ensures gitignored plugin folders are still visible. |
| `python.defaultInterpreterPath` | Uses the IASO venv for all folders (Python, Pyright). |
| `python.analysis.extraPaths` | Adds the IASO root to the import path so `iaso.*` and `plugins.*` resolve. |
| `python.analysis.autoSearchPaths` | Lets the Python extension discover project roots. |

### Adding a new plugin

Add a new folder entry for each plugin:

```json
{ "path": "plugins/<plugin_name>", "name": "<Plugin Display Name>" }
```

Each plugin must have its own `pyrightconfig.json` and `tsconfig.json` (created automatically by `manage.py startplugin`).

### Beyond the minimal config

Additional settings (format on save, Ruff, Prettier, django-html associations, etc.) are optional and often tied to local preferences. You can add them to the `settings` block as needed; the minimal config above is sufficient for import resolution and plugin visibility.

## Opening the workspace

1. Open VS Code.
2. **File → Open Workspace from File…**
3. Select `iaso.code-workspace`.

Or from the terminal:

```bash
code iaso.code-workspace
```

## Plugin-specific config

Each plugin folder needs:

- **`pyrightconfig.json`** – `{"extends": "../../pyrightconfig.json", "extraPaths": ["../.."]}` so Python imports resolve.
- **`tsconfig.json`** – Extends the root tsconfig with `baseUrl: "../.."` so the `Iaso/*` path alias works.

These are created by `manage.py startplugin` for new plugins.
