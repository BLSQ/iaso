# Folders to ignore when processing translations
IGNORE_PATTERNS = [
    "venv/*",
    "node_modules/*",
    "*/cypress/*",
    "static/*",
    "media/*",
    ".git/*",
    # Django and third-party package translations
    "site-packages/django/*",
    "site-packages/django_*/*",  # Catches django_celery_results, django_comments, etc.
    "site-packages/rest_framework/*",
    # Add specific third-party packages if needed
    "site-packages/celery/*",
    "site-packages/allauth/*",
    # Ignore all site-packages translations to be thorough
    "site-packages/*/locale/*",
]

# Convert to command line format for Django makemessages
IGNORE_ARGS = [f"--ignore={pattern}" for pattern in IGNORE_PATTERNS]


# Function to check if a path should be ignored
def should_ignore_path(path):
    from pathlib import Path

    path_str = str(Path(path))
    return any(pattern.replace("*", "") in path_str for pattern in IGNORE_PATTERNS)
