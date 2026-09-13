"""Filesystem jail for MCP workbooks and reports (MEDIA_ROOT/mcp + packaged samples)."""

from __future__ import annotations

from pathlib import Path


def mcp_media_root() -> Path:
    from django.conf import settings

    root = Path(getattr(settings, "MEDIA_ROOT", ".")) / "mcp"
    root.mkdir(parents=True, exist_ok=True)
    return root


def recipe_fill_account_dir() -> Path:
    return Path(__file__).resolve().parent / "recipes" / "fill_account"


def is_inside(path: Path, root: Path) -> bool:
    try:
        resolved = path.resolve()
        root_resolved = root.resolve()
    except OSError:
        return False
    return resolved == root_resolved or root_resolved in resolved.parents


def recipe_create_pyramid_dir() -> Path:
    return Path(__file__).resolve().parent / "recipes" / "create_pyramid"


def allowed_xlsx_roots() -> tuple[Path, ...]:
    return (recipe_fill_account_dir(), recipe_create_pyramid_dir(), mcp_media_root())
