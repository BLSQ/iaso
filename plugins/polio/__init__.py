from django.apps import apps
from os.path import dirname, abspath


# Enable/Disable the loading of the python test then when plugin is not enabled
# load_tests is a special function that if discovered by unittest is used to discover
# the test for the module. See:
# https://docs.python.org/3/library/unittest.html#unittest.TestLoader.discover


def load_tests(loader, tests, pattern):
    from django.conf import settings

    if apps.is_installed("plugins.polio"):
        # doc say passing top_level_dir is not required, but it os necessary if you pass the module name directly to
        # manage.py test otherwise relative import don't work
        return loader.discover(
            start_dir=dirname(abspath(__file__)), pattern=pattern or "test*.py", top_level_dir=settings.BASE_DIR
        )
