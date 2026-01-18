import base64
import json
import os

from urlparse import urlparse


CURRENT_DIR_PATH = os.path.abspath(os.path.dirname(__file__))
PROJECT_ROOT_PATH = os.path.abspath(os.path.join(CURRENT_DIR_PATH, "../.."))


def to_host(url):
    parsed_url = urlparse(url)
    return parsed_url.hostname


def get_or_create_encryption_key():
    """
    Automate the inconvenient task of generating and maintaining a consistent
    encryption key.
    """
    # Attempt to get the key from an environment variable.
    encryption_key = os.environ.get("ENKETO_ENCRYPTION_KEY")

    # If the key wasn't in the environment, attempt to get it from disk.
    secrets_dir_path = os.path.join(CURRENT_DIR_PATH, "secrets/")
    encryption_key_file_path = os.path.join(secrets_dir_path, "enketo_encryption_key.txt")
    if not encryption_key and os.path.isfile(encryption_key_file_path):
        with open(encryption_key_file_path) as encryption_key_file:
            encryption_key = encryption_key_file.read().strip()
    # If the key couldn't be retrieved from disk, generate and store a new one.
    elif not encryption_key:
        encryption_key = base64.b64encode(os.urandom(256))
        if not os.path.isdir(secrets_dir_path):
            os.mkdir(secrets_dir_path)
        with open(encryption_key_file_path, "w") as encryption_key_file:
            encryption_key_file.write(encryption_key)

    return encryption_key


def create_config():
    CONFIG_FILE_PATH = os.path.join(PROJECT_ROOT_PATH, "config/config.json")

    config = {
        "encryption key": get_or_create_encryption_key(),
        "app name": os.environ.get("ENKETO_APP_NAME", "Enketo for Iaso"),
        "default theme": os.environ.get("ENKETO_DEFAULT_THEME", "grid"),
        "logo": {
            "source": os.environ.get(
                "ENKETO_LOGO_SOURCE",
                "https://i1.wp.com/bluesquarehub.com/wp-content/uploads/2019/11/Bluesquare-horizontal-white.png?w=200&ssl=1",
            ),
        },
        "ip filtering": {
            "allowIPAddressList": [],
            "allowMetaIPAddress": False,
            "allowPrivateIPAddress": True,
            "comment": "modification necessary for attachment download",
            "denyAddressList": [],
        },
        "linked form and data server": {
            "api key": os.environ.get("ENKETO_API_KEY"),
            "server url": os.environ.get("ENKETO_LINKED_FORM_AND_DATA_SERVER_SERVER_URL"),
            "name": os.environ.get("ENKETO_LINKED_FORM_AND_DATA_SERVER_NAME", "Iaso"),
        },
        "redis": {
            "main": {"host": to_host(os.getenv("ENKETO_REDIS_MAIN_URL", "redis_main")), "port": 6379},
            "cache": {"host": to_host(os.getenv("ENKETO_REDIS_CACHE_URL", "redis_cache")), "port": 6379},
        },
    }

    # Ensure an API key was set, retrieving it from the environment as a fallback.

    if not config["linked form and data server"]["api key"]:
        raise OSError("An API key for Enketo Express is required.")

    # Write the potentially-updated config file to disk.
    with open(CONFIG_FILE_PATH, "w") as config_file:
        config_file.write(
            # Sort keys so that the file remains consistent between runs.
            # Indent for readability. Specify separators to avoid trailing
            # whitespace (https://bugs.python.org/issue16333)
            json.dumps(config, indent=4, separators=(",", ": "), sort_keys=True)
        )


if __name__ == "__main__":
    create_config()
