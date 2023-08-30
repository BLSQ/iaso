from .settings import *  # noqa: F401,F403

# Disable Database Serialization to speed up tests (Django < 4.0).
# Django serializes the whole database into a SQL string at the start of a test run, which can take a few seconds.
# https://docs.djangoproject.com/en/3.2/topics/testing/overview/#test-case-serialized-rollback
# Fixed in Django 4.0 https://code.djangoproject.com/ticket/32446
DATABASES["default"]["TEST"] = {"SERIALIZE": False}
