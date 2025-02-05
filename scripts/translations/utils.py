from scripts.translations.config import TRANSLATION_PATHS


def find_translation_files(project_root, file_pattern):
    """Find translation files (*.po or *.mo) in specified paths

    Args:
        project_root: Path object for project root
        file_pattern: String pattern to match ('django.po' or 'django.mo')
    """
    files = []
    for base_path in TRANSLATION_PATHS:
        base_dir = project_root / base_path
        if base_path == "plugins":
            # For plugins, look in each plugin's locale directory
            for plugin_dir in base_dir.glob("*"):
                if plugin_dir.is_dir():
                    files.extend(plugin_dir.glob(f"**/{file_pattern}"))
        else:
            # For hat and iaso, look in their locale directories
            files.extend(base_dir.glob(f"**/{file_pattern}"))
    return files
