# How to run this site locally

- Clone the [repository](https://github.com/BLSQ/iaso)
- Install [uv](https://docs.astral.sh/uv/getting-started/installation/)
- From the root folder of iaso, start the local server:

```bash
uv run --only-group docs mkdocs serve
```

This installs the `docs` dependency group from `pyproject.toml` if needed, then runs mkdocs.
The rest of Iaso's dependencies aren't needed: `mkdocstrings` reads the Python code without importing it.
