from iaso.api.common import ModelViewSet
from django.core.paginator import Paginator
from django.db.models import Max, Q
from django.http import JsonResponse, HttpResponse, StreamingHttpResponse
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from rest_framework import filters
from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from iaso.models import Reports


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reports
        fields = ["name",
                  "published_version",
                  "project"]


class ReportsViewSet(ModelViewSet):
    results_key = "result"
    remove_results_key_if_paginated = True
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]

    def get_serializer_class(self):
        return ReportSerializer

    def get_queryset(self):
        search = self.request.query_params.get("search", None)
        queryset = Reports.objects.filter(project__acount=self.request.user.iaso_profile.account)
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset
