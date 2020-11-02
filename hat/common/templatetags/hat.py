from typing import Any
from django import template

register = template.Library()


@register.filter(name="get")
def get(obj: Any, attr: str) -> str:
    """ Gets an attribute of an object dynamically from a string name """
    try:
        return obj[attr]
    except:
        try:
            return getattr(obj, attr)
        except:
            pass

    return ""
