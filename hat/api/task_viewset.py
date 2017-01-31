from django.http import FileResponse
from django.http import Http404
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.reverse import reverse
from rest_framework.exceptions import NotFound, ValidationError, PermissionDenied
from hat.rq.utils import run_task, get_task_status, get_task_result
from hat.import_export.tasks import export_task


class TaskViewSet(viewsets.ViewSet):
    '''
    View to create and retrieve tasks
    '''
    def create(self, request):
        taskConfig = request.data
        taskType = taskConfig.get('type', None)
        if taskType is None:
            raise ValidationError('No task type specified')

        taskOptions = taskConfig.get('options', None)
        if taskOptions is None:
            raise ValidationError('No task options specified')

        if taskType == 'download':
            if request.user.has_perm('cases.export_full'):
                task = run_task(export_task, kwargs=taskOptions,
                                permission='cases.export_full')
            elif request.user.has_perm('cases.export'):
                task = run_task(export_task, kwargs={'anon': True, **taskOptions},
                                permission='cases.export')
            else:
                raise PermissionDenied()
        else:
            raise ValidationError('Task type is invalid: ' + taskType)

        return Response({'url': reverse('api:tasks-detail', args=[task.id], request=request)})

    def retrieve(self, request, pk=None):
        status = get_task_status(pk, user=request.user)
        if status == 'notfound':
            raise NotFound()
        if status == 'failed':
            raise ValueError('Task failed')
        data = {'done': status == 'finished'}
        if status == 'finished':
            data['result_url'] = reverse('api:taskresults-detail', args=[pk], request=request)
        return Response(data)


class TaskResultViewSet(viewsets.ViewSet):
    '''
    View to list and retrieve tasks
    '''

    def list(self, request):
        # TODO: figure out how to list the results
        pass

    def retrieve(self, request, pk=None):
        # We use a django HttpResponse here to get the raw csv. We do not care about
        # django rest frameworks format handling which would just get in the way.
        # Same with errors.
        status = get_task_status(pk, user=request.user)
        if status == 'notfound':
            raise Http404('Task was not found')
        if status != 'finished':
            raise Http404('Task has not finished')
        filename = get_task_result(pk, request.user)

        response = FileResponse(open(filename, 'rb'))
        response['Content-Disposition'] = 'attachment; filename="hat_suspect_cases.csv"'
        return response
