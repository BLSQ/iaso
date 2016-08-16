from django.conf import settings


def appversions(request):
    return {
            'version_commit': settings.HAT_COMMIT[0:7] or 'local-dev'
    }
