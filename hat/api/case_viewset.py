from collections import OrderedDict
from rest_framework import viewsets
from rest_framework.serializers import ModelSerializer
from hat.cases.models import CaseView
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.response import Response
from hat.cases.filters import resolve_dateperiod, Q_is_suspect


class CasePagination(LimitOffsetPagination):
    '''
    We create our own Pagination class to supplement the response with
    `limit` and `offset` values. The react frontend cannot use the links
    directly and needs to construct it's own urls from limit and offset.
    '''
    def get_paginated_response(self, data):
        return Response(OrderedDict([
            ('count', self.count),
            ('next', self.get_next_link()),
            ('previous', self.get_previous_link()),
            ('limit', self.limit),
            ('offset', self.offset),
            ('results', data)
        ]))


class CaseSerializer(ModelSerializer):
    class Meta:
        model = CaseView
        fields = [
            'document_id',
            'document_date',
            'ZS',
            'AS',
            'village',
            'screening_result',
            'confirmation_result',
            'stage_result',
        ]


class CaseViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CaseSerializer
    pagination_class = CasePagination

    def get_queryset(self):
        ''' Filter by query parameters '''
        queryset = CaseView.objects.all()

        dateperiod = self.request.query_params.get('dateperiod', None)
        if dateperiod is not None:
            (date_from, date_to) = resolve_dateperiod(dateperiod)
            queryset = queryset.filter(
                document_date__gte=date_from, document_date__lt=date_to)

        location = self.request.query_params.get('location', None)
        if location is not None:
            queryset = queryset.filter(ZS=location)

        only_suspects = self.request.query_params.get('only_suspects', None)
        if only_suspects is not None:
            queryset = queryset.filter(Q_is_suspect)
        queryset = queryset.order_by('-document_date')
        return queryset
