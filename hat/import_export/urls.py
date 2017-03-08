import json
from django.conf.urls import url, include
from django.utils.translation import ugettext as _

from hat.tasks.views import task_state, task_done
from . import views


################################################################################
# Download/Upload helpers
################################################################################

upload_messages = {
    'title': _('Uploading data'),
    'inprogress': _('The file upload is in progress...'),
    'expired': _("The upload job you\'re looking for has expired."),
    'failed': _("The upload job has failed."),
    'import_cases': _('cases'),
    'import_locations': _('locations'),
    'import_reconciled': _('reconciled data'),
}


def post_task_upload(request, results) -> dict:
    if not isinstance(results, list):
        results = [results]

    for result in results:
        result['ok'] = result['error'] is None

    error_count = sum(1 for r in results if r['error'] is not None)
    resultJSON = json.dumps(results, indent=2)

    return {
        'dataset': upload_messages[request.resolver_match.namespaces[1]],
        'results': results,
        'resultJSON': resultJSON,
        'error_count': error_count
    }


def get_kwargs_state(namespace):
    return {
        'next_view': 'datasets:{}:done'.format(namespace),
        'expired_view': 'datasets:{}:upload'.format(namespace),
        'error_view': 'datasets:{}:done'.format(namespace),
        'texts': upload_messages,
    }


def get_kwargs_done(namespace):
    return {
        'expired_view': 'datasets:{}:done'.format(namespace),
        'template': 'import_export/upload_done.html',
        'post_action': post_task_upload,
        'texts': upload_messages,
    }


################################################################################
# url patterns
################################################################################

import_cases_urlpatterns = [
    url(r'^upload$', view=views.upload_cases, name='upload'),
    url(r'^state/(?P<task_id>[a-z0-9-]+)$', view=task_state, name='state',
        kwargs=get_kwargs_state('import_cases'),
        ),
    url(r'^done/(?P<task_id>[a-z0-9-]+)$', view=task_done, name='done',
        kwargs=get_kwargs_done('import_cases'),
        ),
]

import_locations_urlpatterns = [
    url(r'^upload$', view=views.upload_locations, name='upload'),
    url(r'^state/(?P<task_id>[a-z0-9-]+)$', view=task_state, name='state',
        kwargs=get_kwargs_state('import_locations'),
        ),
    url(r'^done/(?P<task_id>[a-z0-9-]+)$', view=task_done, name='done',
        kwargs=get_kwargs_done('import_locations'),
        ),
]

import_reconciled_urlpatterns = [
    url(r'^upload$', view=views.upload_reconciled, name='upload'),
    url(r'^state/(?P<task_id>[a-z0-9-]+)$', view=task_state, name='state',
        kwargs=get_kwargs_state('import_reconciled'),
        ),
    url(r'^done/(?P<task_id>[a-z0-9-]+)$', view=task_done, name='done',
        kwargs=get_kwargs_done('import_reconciled'),
        ),
]


urlpatterns = [
    url('^$', views.index, name='index'),
    url('^import/', include(import_cases_urlpatterns, 'import_cases')),
    url('^import_locations/', include(import_locations_urlpatterns, 'import_locations')),
    url('^import_reconciled/', include(import_reconciled_urlpatterns, 'import_reconciled')),
]
