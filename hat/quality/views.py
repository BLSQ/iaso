from datetime import datetime, timedelta
from django.contrib.auth.decorators import login_required, permission_required
from django.views.decorators.http import require_http_methods
from django.shortcuts import render
from django.http.request import HttpRequest
from django.http import HttpResponse

@login_required()
@permission_required('cases.view')
@require_http_methods(['GET'])
def quality_control(request: HttpRequest) -> HttpResponse:
    return render(request, 'quality/quality_control.html', {'test_count': range(1,7)})

@login_required()
@permission_required('cases.view')
@require_http_methods(['GET'])
def alerts(request: HttpRequest) -> HttpResponse:
    return render(request, 'quality/alerts.html', {'test_count': range(1,7)})