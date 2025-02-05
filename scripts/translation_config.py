# Folders to ignore when processing translations
IGNORE_PATTERNS = [
    "venv",  # Remove trailing /* to match directory exactly
    ".venv",
    "node_modules",
    "cypress",
    "static",
    "media",
    ".git",
]

# Convert to command line format for Django makemessages
IGNORE_ARGS = [f"--ignore={pattern}" for pattern in IGNORE_PATTERNS]


def should_ignore_path(path):
    import os
    from pathlib import Path

    path = Path(path).resolve()
    path_str = str(path)

    # Directly check for site-packages and venv paths
    if any(segment in path_str for segment in ["site-packages", "venv", ".venv"]):
        return True

    project_root = Path.cwd().resolve()

    try:
        relative_path = str(path.relative_to(project_root))
        return any(pattern in relative_path.split(os.sep) for pattern in IGNORE_PATTERNS)
    except ValueError:
        return True
