from django import template
from django.template import TemplateDoesNotExist
from django.template.loader import get_template
from django.utils.safestring import mark_safe


register = template.Library()


@register.simple_tag(takes_context=True)
def include_optional(context, template_name):
    """Render a template when it exists. Missing templates render nothing.

    Plugin templates are optional: core pages can include them, and a deploy
    without that plugin still renders the page.
    """
    try:
        plugin_template = get_template(template_name)
    except TemplateDoesNotExist:
        return ""
    return mark_safe(plugin_template.render(context.flatten()))
