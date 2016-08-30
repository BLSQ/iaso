from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.shortcuts import render


@login_required()
@require_http_methods(['GET'])
def testapp(request):
    return render(request, 'dashboard/testapp.html')
