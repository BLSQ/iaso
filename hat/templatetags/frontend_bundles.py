from django import template
from django.utils.safestring import mark_safe

from hat.frontend_bundles import utils


register = template.Library()


@register.simple_tag
def render_bundle(bundle_name, extension=None, config="DEFAULT", suffix="", attrs="", is_preload=False):
    tags = utils.get_as_tags(
        bundle_name,
        extension=extension,
        config=config,
        suffix=suffix,
        attrs=attrs,
        is_preload=is_preload,
    )
    return mark_safe("\n".join(tags))


@register.simple_tag
def frontend_static(asset_name, config="DEFAULT"):
    return utils.get_static(asset_name, config=config)
