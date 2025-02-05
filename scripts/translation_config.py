# Folders to scan for translations
TRANSLATION_PATHS = [
    "hat",
    "iaso",
    "plugins",
]


def should_ignore_path(path):
    """Simplified path checking - only allow paths under hat/, iaso/, and plugins/*/locale/"""
    import os
    from pathlib import Path

    path = Path(path).resolve()
    path_parts = path.parts

    # Only process .po files in specific directories
    if any(part in path_parts for part in ["hat", "iaso"]):
        return "locale" not in path_parts
    elif "plugins" in path_parts:
        # For plugins, ensure we're in a locale directory under a plugin
        try:
            plugins_index = path_parts.index("plugins")
            return "locale" not in path_parts[plugins_index:]
        except ValueError:
            return True
    return True
