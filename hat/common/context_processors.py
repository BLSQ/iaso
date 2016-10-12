from django.conf import settings


def appversions(request):
    prefix = 'D-' if settings.DEBUG else ''
    return {
            'DEV_SERVER': settings.DEV_SERVER,
            'version_commit': prefix + (settings.HAT_COMMIT[0:7] or 'local-dev')
    }


def environment(request):
    return {
            'environment': settings.ENVIRONMENT
            }
