# import django_filters
from rest_framework import viewsets, filters
from rest_framework.serializers import ModelSerializer
from hat.cases.models import Case


# This serves as an example and is currently not used


class CaseSerializer(ModelSerializer):
    class Meta:
        model = Case
        fields = ['document_id', 'document_date']


class CaseFilter(filters.FilterSet):
    # min_foo = django_filters.NumberFilter(name="foo", lookup_expr='gte')
    # max_foo = django_filters.NumberFilter(name="foo", lookup_expr='lte')
    class Meta:
        model = Case
        # fields = {
        #     'year_of_birth': ['gt', 'lt', 'lte', 'gte']
        # }
        # order_by = ['-document_date', 'document_date']


class CaseViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Case.objects.all()
    serializer_class = CaseSerializer
    filter_class = CaseFilter
