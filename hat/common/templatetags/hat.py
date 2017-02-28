from django import template

register = template.Library()


@register.filter(name='get')
def get(obj, attr):
    ''' Gets an attribute of an object dynamically from a string name '''

    try:
        return obj[attr]
    except:
        try:
            return getattr(obj, attr)
        except:
            pass

    return ''
