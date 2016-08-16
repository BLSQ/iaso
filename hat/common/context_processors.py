from django.conf import settings


def appversions(request):
    return {
        'version_commit': settings.HAT_COMMIT or 'local-dev'
    }
