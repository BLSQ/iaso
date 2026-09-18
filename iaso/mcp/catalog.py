from __future__ import annotations

from urllib.error import URLError
from urllib.request import urlopen


DESIGN_SYSTEM_RAW = "https://raw.githubusercontent.com/BLSQ/iaso-design-system/main/"
IASO_DOCS_RAW = "https://raw.githubusercontent.com/BLSQ/iaso/main/"

# Topic -> (repo-relative path, one-line blurb). Paths under docs/ are BLSQ/iaso.
CATALOG_DOCS: dict[str, tuple[str, str]] = {
    "claude": (
        "CLAUDE.md",
        "Agent rules: stack, catalog-first answers, IASO vocabulary (design-system CLAUDE.md).",
    ),
    "index": (
        "catalog/README.md",
        "Mandatory domain index (Forms, Org units, Data Sources, Entities, …).",
    ),
    "docs": (
        "docs/index.en.md",
        "Official IASO product / developer docs home (BLSQ/iaso).",
    ),
    "projects": (
        "catalog/projects-domain.md",
        "Projects: App ID, QR, feature flags.",
    ),
    "datasources": (
        "catalog/datasources-domain.md",
        "Data sources: versions, compare/sync, DHIS2/geopackage.",
    ),
    "forms": (
        "catalog/forms-domain.md",
        "Forms and submissions (instances).",
    ),
    "form-ai": (
        "catalog/form-ai-domain.md",
        "Form AI: natural-language form authoring.",
    ),
    "orgunits": (
        "catalog/orgunits-domain.md",
        "Org units list / map / detail.",
    ),
    "orgunits-config": (
        "catalog/orgunits-config-domain.md",
        "Org unit types, groups, and group sets.",
    ),
    "entities": (
        "catalog/entities-domain.md",
        "Entities: reference form, workflows, duplicates.",
    ),
    "planning": (
        "catalog/planning-domain.md",
        "Planning, missions, assignments, sampling.",
    ),
    "users": (
        "catalog/users-domain.md",
        "Users, roles, teams, history.",
    ),
    "accounts": (
        "catalog/accounts-domain.md",
        "Accounts / tenancy and TopBar switch.",
    ),
    "tasks": (
        "catalog/tasks-domain.md",
        "Global async jobs.",
    ),
    "pipelines": (
        "catalog/pipelines-domain.md",
        "IASO Admin → Pipelines (OpenHEXA).",
    ),
    "apiimport": (
        "catalog/apiimport-domain.md",
        "API import logs and TopBar notifications.",
    ),
    "devices": (
        "catalog/devices-domain.md",
        "Devices (legacy; skip for new work).",
    ),
    "my-profile": (
        "catalog/my-profile-domain.md",
        "My profile / account usage (not built).",
    ),
    "navigation": (
        "catalog/navigation.md",
        "Sidebar information architecture.",
    ),
    "screen-patterns": (
        "catalog/screen-patterns.md",
        "Screen-by-screen UI patterns.",
    ),
    "components": (
        "catalog/component-inventory.md",
        "Component reuse map.",
    ),
    "gaps": (
        "catalog/gaps-and-decisions.md",
        "G01–G46 product backlog and decisions.",
    ),
    "roadmap": (
        "catalog/ux-coherence-roadmap.md",
        "UX coherence, SaaS, notifications, filter drawers.",
    ),
    "principles": (
        "design-system/00-principles.md",
        "Design-system principles.",
    ),
    "foundations": (
        "design-system/01-foundations.md",
        "Foundations: type, color, spacing, tokens.",
    ),
    "ds-components": (
        "design-system/02-components.md",
        "Design-system components.",
    ),
    "layouts": (
        "design-system/03-layouts.md",
        "Layout patterns.",
    ),
    "ux-rules": (
        "design-system/04-ux-rules.md",
        "UX rules.",
    ),
    "accessibility": (
        "design-system/05-accessibility.md",
        "Accessibility guidance.",
    ),
    "content-i18n": (
        "design-system/06-content-and-i18n.md",
        "Content and i18n.",
    ),
    "data-maps": (
        "design-system/07-data-and-maps.md",
        "Data tables and maps.",
    ),
    "states": (
        "design-system/08-states-and-feedback.md",
        "Loading, empty, error, and feedback states.",
    ),
}


def fetch_design_system_doc(path: str) -> str:
    base = IASO_DOCS_RAW if path.startswith("docs/") else DESIGN_SYSTEM_RAW
    url = base + path
    try:
        with urlopen(url, timeout=10) as response:  # noqa: S310
            return response.read().decode("utf-8")
    except (URLError, TimeoutError, OSError) as exc:
        return f"Could not fetch {url} ({exc}). Open the file in BLSQ/iaso-design-system or BLSQ/iaso locally."
