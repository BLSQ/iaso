# Debugging the Backend

## Django Debug Toolbar

You can activate the [Django Debug Toolbar](https://django-debug-toolbar.readthedocs.io/).

To do so, create a `hat/local_settings.py` files and configure the toolbar.

E.g.:

```
from .settings import *  # noqa

from debug_toolbar.middleware import show_toolbar


INSTALLED_APPS += ["debug_toolbar"]

MIDDLEWARE += ["debug_toolbar.middleware.DebugToolbarMiddleware"]


def custom_show_toolbar(request):
    included_urls = ["/__debug__", "/admin", "/api"]
    included = any(request.path.startswith(url) for url in included_urls)
    return show_toolbar(request) and included


DEBUG_TOOLBAR_CONFIG = {
    "DISABLE_PANELS": [
        "debug_toolbar.panels.redirects.RedirectsPanel",
        # ProfilingPanel makes the django admin extremely slow.
        "debug_toolbar.panels.profiling.ProfilingPanel",
    ],
    "SHOW_TEMPLATE_CONTEXT": True,
    "SHOW_TOOLBAR_CALLBACK": custom_show_toolbar,
}
```
