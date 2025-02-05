#!/usr/bin/env python
import os
import sys
from pathlib import Path

from translation_config import should_ignore_path


# ANSI escape codes for colors
class Colors:
    HEADER = "\033[95m"
    BLUE = "\033[94m"
    GREEN = "\033[92m"
    WARNING = "\033[93m"
    FAIL = "\033[91m"
    ENDC = "\033[0m"
    BOLD = "\033[1m"


def format_path(path):
    """Format a file path to be relative to the project root"""
    try:
        return str(Path(path).relative_to(Path.cwd()))
    except ValueError:
        return path


def check_po_file(po_path):
    """Check a single .po file for missing translations"""
    print(f"\n{Colors.BLUE}Checking{Colors.ENDC} {Colors.BOLD}{format_path(po_path)}{Colors.ENDC}")
    missing = []

    with open(po_path, "r", encoding="utf-8") as f:
        content = f.read()

    current_msgid = []
    current_msgstr = []
    in_msgid = False
    in_msgstr = False

    for line in content.split("\n"):
        line = line.strip()

        if line.startswith("#") or not line:
            continue

        if line.startswith('msgid "'):
            if current_msgid:
                full_msgid = "".join(current_msgid)
                full_msgstr = "".join(current_msgstr)
                if full_msgid and not full_msgstr:
                    missing.append(full_msgid)

            in_msgid = True
            in_msgstr = False
            current_msgid = [line[7:-1]]
            current_msgstr = []
        elif line.startswith('msgstr "'):
            in_msgid = False
            in_msgstr = True
            current_msgstr = [line[8:-1]]
        elif line.startswith('"') and (in_msgid or in_msgstr):
            content = line[1:-1]
            if in_msgid:
                current_msgid.append(content)
            else:
                current_msgstr.append(content)

    # Process the last entry
    if current_msgid:
        full_msgid = "".join(current_msgid)
        full_msgstr = "".join(current_msgstr)
        if full_msgid and not full_msgstr:
            missing.append(full_msgid)

    return missing


def main():
    project_root = Path(__file__).parent.parent
    po_files = []
    for root, _, files in os.walk(project_root):
        if should_ignore_path(root) or "site-packages" in str(root):
            continue
        for file in files:
            if file == "django.po":
                po_files.append(os.path.join(root, file))

    all_missing = []
    files_with_missing = 0

    print(f"\n{Colors.HEADER}🔍 Checking translations in {len(po_files)} files...{Colors.ENDC}")

    for po_file in po_files:
        missing = check_po_file(po_file)
        if missing:
            files_with_missing += 1
            print(f"\n{Colors.FAIL}❌ Missing translations in {Colors.BOLD}{format_path(po_file)}{Colors.ENDC}")
            for msg in missing:
                print(f"  {Colors.WARNING}▶ {msg}{Colors.ENDC}")
            all_missing.extend(missing)

    print("\n" + "=" * 80)
    if all_missing:
        print(
            f"{Colors.FAIL}❌ Found {len(all_missing)} missing translations in {files_with_missing} files{Colors.ENDC}"
        )
        sys.exit(1)
    else:
        print(f"{Colors.GREEN}✅ All translations are complete! 🎉{Colors.ENDC}")
        sys.exit(0)


if __name__ == "__main__":
    main()
