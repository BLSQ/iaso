import re

from django.conf import settings

__all__ = ("load_config",)

DEFAULT_CONFIG = {
    "DEFAULT": {
        "CACHE": not settings.DEBUG,
        "BUNDLE_DIR_NAME": "",
        "STATS_FILE": "bundle-stats.json",
        "POLL_INTERVAL": 0.1,
        "TIMEOUT": None,
        "IGNORE": [r".+\.hot-update\.js", r".+\.map"],
        "LOADER_CLASS": "hat.frontend_bundles.loader.FrontendBundleLoader",
    }
}

_user_config = getattr(settings, "FRONTEND_BUNDLE_LOADER", DEFAULT_CONFIG)

user_config = {name: dict(DEFAULT_CONFIG["DEFAULT"], **cfg) for name, cfg in _user_config.items()}

for entry in user_config.values():
    entry["ignores"] = [re.compile(pattern) for pattern in entry["IGNORE"]]


def load_config(name):
    return user_config[name]