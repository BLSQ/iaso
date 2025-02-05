# Folders to ignore when processing translations
IGNORE_PATTERNS = [
    "venv/*",
    "node_modules/*",
    "*/cypress/*",
    "static/*",
    "media/*",
    ".git/*",
]

# Convert to command line format for Django makemessages
IGNORE_ARGS = [f"--ignore={pattern}" for pattern in IGNORE_PATTERNS]


# Function to check if a path should be ignored
def should_ignore_path(path):
    from pathlib import Path

    path_str = str(Path(path))

    # Directly check for site-packages in path
    if "site-packages" in path_str:
        return True

    # Check other ignore patterns
    return any(pattern.replace("*", "") in path_str for pattern in IGNORE_PATTERNS)
