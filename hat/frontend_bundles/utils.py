from importlib import import_module

from django.conf import settings

from .config import load_config

_loaders = {}


def import_string(dotted_path):
    module_path, class_name = dotted_path.rsplit(".", 1)
    module = import_module(module_path)
    return getattr(module, class_name)


def get_loader(config_name):
    if config_name not in _loaders:
        config = load_config(config_name)
        loader_class = import_string(config["LOADER_CLASS"])
        _loaders[config_name] = loader_class(config_name, config)
    return _loaders[config_name]


def _filter_by_extension(bundle, extension):
    for chunk in bundle:
        if chunk["name"].endswith(f".{extension}"):
            yield chunk


def _get_bundle(bundle_name, extension, config):
    bundle = get_loader(config).get_bundle(bundle_name)
    if extension:
        bundle = _filter_by_extension(bundle, extension)
    return bundle


def get_files(bundle_name, extension=None, config="DEFAULT"):
    return list(_get_bundle(bundle_name, extension, config))


def get_as_tags(bundle_name, extension=None, config="DEFAULT", suffix="", attrs="", is_preload=False):
    bundle = _get_bundle(bundle_name, extension, config)
    tags = []
    for chunk in bundle:
        if chunk["name"].endswith((".js", ".js.gz")):
            if is_preload:
                tags.append(
                    f'<link rel="preload" as="script" href="{chunk["url"]}{suffix}" {attrs}/>',
                )
            else:
                tags.append(f'<script src="{chunk["url"]}{suffix}" {attrs}></script>')
        elif chunk["name"].endswith((".css", ".css.gz")):
            rel = '"stylesheet"' if not is_preload else '"preload" as="style"'
            tags.append(f'<link href="{chunk["url"]}{suffix}" rel={rel} {attrs}/>')
    return tags


def get_static(asset_name, config="DEFAULT"):
    return "{0}{1}".format(
        get_loader(config).get_assets().get("publicPath", getattr(settings, "STATIC_URL")),
        asset_name,
    )