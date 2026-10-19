import importlib.util
import re

from pathlib import Path

from django.conf import settings
from django.test import SimpleTestCase


INSTALL_SCRIPT = Path(settings.BASE_DIR) / "scripts" / "install_duckdb_extensions.py"
INSTALL_STATEMENT = re.compile(r"\bINSTALL (\w+)")


def load_install_script():
    spec = importlib.util.spec_from_file_location("install_duckdb_extensions", INSTALL_SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def extensions_installed_by_the_code():
    """{extension: files} for every `INSTALL <extension>` outside the tests"""
    found = {}
    for package in ("iaso", "plugins", "hat"):
        for path in (Path(settings.BASE_DIR) / package).rglob("*.py"):
            if "tests" in path.parts:
                continue
            for extension in INSTALL_STATEMENT.findall(path.read_text()):
                found.setdefault(extension, []).append(str(path.relative_to(settings.BASE_DIR)))
    return found


class DuckdbExtensionsTestCase(SimpleTestCase):
    def test_install_script_lists_the_extensions_used_by_the_code(self):
        """The Docker images preinstall the script's extensions: one missing would be downloaded at runtime"""
        used = extensions_installed_by_the_code()
        listed = load_install_script().EXTENSIONS

        self.assertEqual(
            sorted(listed),
            sorted(used),
            f"scripts/install_duckdb_extensions.py EXTENSIONS must match the extensions INSTALLed by the code: {used}",
        )
