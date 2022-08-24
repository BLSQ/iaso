import csv
import io

import xlsxwriter
from django.db.models import Q
from django.http import JsonResponse, HttpResponse
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, filters
from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from iaso.api.common import TimestampField, ModelViewSet
from iaso.models import Entity, Instance, EntityType


class EntityTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = EntityType
        fields = [
            "id",
            "name",
            "created_at",
            "updated_at",
            "reference_form",
            "entities_count",
            "account",
            "fields_detail_view",
            "fields_list_view",
        ]

    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)
    entities_count = serializers.SerializerMethodField()

    @staticmethod
    def get_entities_count(obj: EntityType):
        return Entity.objects.filter(entity_type=obj.id).count()


class BeneficiarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Entity
        depth = 1
        fields = [
            "id",
            "name",
            "uuid",
            "created_at",
            "updated_at",
            "attributes",
            "entity_type",
            "entity_type_name",
            "instances",
            "submitter",
        ]

    entity_type_name = serializers.SerializerMethodField()
    attributes = serializers.SerializerMethodField()
    submitter = serializers.SerializerMethodField()

    def get_attributes(self, entity: Entity):
        if entity.attributes:
            return entity.attributes.as_full_model()
        return None

    def get_submitter(self, entity: Entity):
        try:
            submitter = entity.attributes.created_by.username
        except AttributeError:
            submitter = None
        return submitter

    @staticmethod
    def get_entity_type_name(obj: Entity):
        return obj.entity_type.name if obj.entity_type else None


class EntitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Entity
        fields = [
            "id",
            "name",
            "uuid",
            "created_at",
            "updated_at",
            "attributes",
            "entity_type",
            "entity_type_name",
        ]

    entity_type_name = serializers.SerializerMethodField()

    @staticmethod
    def get_entity_type_name(obj: Entity):
        return obj.entity_type.name if obj.entity_type else None


# To define
class HasEntityPermission(permissions.BasePermission):
    def has_permission(self, request: Request, view):
        if request.method == "POST":
            return True


class EntityTypeViewSet(ModelViewSet):
    results_key = "types"
    remove_results_key_if_paginated = True
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]

    def get_serializer_class(self):
        return EntityTypeSerializer

    def get_queryset(self):
        search = self.request.query_params.get("search", None)
        queryset = EntityType.objects.filter(account=self.request.user.iaso_profile.account)
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset


class EntityFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        query_param = request.query_params.get("deletion_status", "active")

        if query_param == "deleted":
            query = Q(deleted_at__isnull=False)
            return queryset.filter(query)

        if query_param == "active":
            query = Q(deleted_at__isnull=True)
            return queryset.filter(query)

        if query_param == "all":
            return queryset
        return queryset


class BeneficiaryFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        query_param = request.query_params.get("deletion_status", "active")

        if query_param == "deleted":
            query = Q(deleted_at__isnull=False)
            return queryset.filter(query)

        if query_param == "active":
            query = Q(deleted_at__isnull=True)
            return queryset.filter(query)

        if query_param == "all":
            return queryset
        return queryset


class EntityViewSet(ModelViewSet):
    results_key = "entities"
    remove_results_key_if_paginated = True
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend, EntityFilterBackend]

    def get_serializer_class(self):
        return EntitySerializer

    def get_queryset(self):
        search = self.request.query_params.get("search", None)
        entity_types__id = self.request.query_params.get("entity_types__ids", None)

        order = self.request.query_params.get("order", "updated_at").split(",")
        queryset = Entity.objects.filter(account=self.request.user.iaso_profile.account)
        if search:
            queryset = queryset.filter(name__icontains=search)
        if entity_types__id:
            entity_types__ids = entity_types__id.split(",")
            queryset = queryset.filter(entity_type__in=entity_types__ids)

        queryset = queryset.order_by(*order)
        return queryset

    def create(self, request, *args, **kwargs):
        data = request.data
        entity_type = get_object_or_404(EntityType, pk=int(data["entity_type"]))
        instance = get_object_or_404(Instance, uuid=data["attributes"])
        account = request.user.iaso_profile.account
        # Avoid duplicates
        if Entity.objects.filter(attributes=instance):
            raise serializers.ValidationError({"attributes": "Entity with this attribute already exists."})

        entity = Entity.objects.create(name=data["name"], entity_type=entity_type, attributes=instance, account=account)
        serializer = EntitySerializer(entity, many=False)
        return Response(serializer.data)

    @action(detail=False, methods=["POST", "GET"])
    def bulk_create(self, request, *args, **kwargs):
        created_entities = []
        data = request.data if isinstance(request.data, list) else [request.data]
        # allows multiple create
        if request.method == "POST":
            for entity in data:
                instance = get_object_or_404(Instance, uuid=entity["attributes"])
                # Avoid duplicates
                if Entity.objects.filter(attributes=instance):
                    raise serializers.ValidationError(
                        {"attributes": "Entity with the attribute '{0}' already exists.".format(entity["attributes"])}
                    )
                entity_type = get_object_or_404(EntityType, pk=int(entity["entity_type"]))
                account = request.user.iaso_profile.account
                Entity.objects.create(
                    name=entity["name"], entity_type=entity_type, attributes=instance, account=account
                )
                created_entities.append(entity)
            return JsonResponse(created_entities, safe=False)
        entities = Entity.objects.filter(account=request.user.iaso_profile.account)
        serializer = EntitySerializer(entities, many=True)
        return Response(serializer.data)


def export_beneficiary_as_xlsx(beneficiaries):
    mem_file = io.BytesIO()
    workbook = xlsxwriter.Workbook(mem_file)
    worksheet = workbook.add_worksheet("beneficiary")
    worksheet.set_column(0, 100, 30)
    row_color = workbook.add_format({"bg_color": "#FFC7CE"})
    row = 0
    col = 0
    filename = ""
    for beneficiary in beneficiaries:
        res = {"beneficiaries": BeneficiarySerializer(beneficiary, many=False).data}
        worksheet.set_row(row, cell_format=row_color)
        worksheet.write(row, col, f"{beneficiary.name.upper()}:")
        row += 1
        for k, v in res["beneficiaries"].items():
            try:
                fields_list = beneficiary.entity_type.fields_detail_view
            except TypeError:
                raise serializers.ValidationError(
                    {"error": "You must provide a field details view list in order to export the beneficiaries."}
                )
            if k in fields_list or k == "attributes":
                if k == "attributes":
                    for k_, v_ in res["beneficiaries"]["attributes"]["file_content"].items():
                        worksheet.write(row, col, k_)
                        worksheet.write(row + 1, col, v_)
                        col += 1
                else:
                    worksheet.write(row, col, k)
                    worksheet.write(row + 1, col, v)
                    col += 1
        col = 0
        row += 2
        filename = beneficiary.name
    filename = f"EXPORT_BENEFICIARIES.xlsx" if len(beneficiaries) > 1 else f"{filename.upper()}_BENEFICIARY.xlsx"
    workbook.close()
    mem_file.seek(0)
    response = HttpResponse(mem_file, content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    response["Content-Disposition"] = "attachment; filename=%s" % filename
    return response


def export_beneficiary_as_csv(beneficiaries):

    header = []
    data = []
    filename = ""

    for beneficiary in beneficiaries:
        res = {"beneficiaries": BeneficiarySerializer(beneficiary, many=False).data}
        benef_data = []
        for k, v in res["beneficiaries"].items():
            try:
                fields_list = beneficiary.entity_type.fields_detail_view
            except TypeError:
                raise serializers.ValidationError(
                    {"error": "You must provide a field details view list in order to export the beneficiaries."}
                )
            if k in fields_list or k == "attributes":
                if k == "attributes":
                    for k_, v_ in res["beneficiaries"]["attributes"]["file_content"].items():
                        if k_ not in header:
                            header.append(k_)
                        benef_data.append(v_)
                else:
                    if k not in header:
                        header.append(k)
                    benef_data.append(v)
        data.append(benef_data)
        filename = beneficiary.name
    filename = f"EXPORT_BENEFICIARIES.csv" if len(beneficiaries) > 1 else f"{filename.upper()}_BENEFICIARY.csv"

    response = HttpResponse(
        content_type="txt/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )

    writer = csv.writer(response)
    writer.writerow(header)
    writer.writerows(data)

    return response


class BeneficiaryViewset(ModelViewSet):
    """Beneficiaries API

    GET /api/entity/beneficiary
    GET /api/entity/beneficiary/<id>
    DELETE /api/entity/beneficiary/<id>

    To export as xlsx:
    /api/entity/beneficiary/?xlsx=true
    or by id:
    /api/entity/beneficiary/?xlsx=true&id=<id>
    """

    results_key = "beneficiary"
    remove_results_key_if_paginated = True
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend, EntityFilterBackend]

    def get_serializer_class(self):
        return BeneficiarySerializer

    def get_queryset(self):
        search = self.request.query_params.get("search", None)
        org_unit_id = self.request.query_params.get("orgUnitId", None)
        date_from = self.request.query_params.get("dateFrom", None)
        date_to = self.request.query_params.get("dateTo", None)
        order = self.request.query_params.get("order", "updated_at").split(",")
        entity_type = self.request.query_params.get("entity_type", None)
        by_uuid = self.request.query_params.get("by_uuid", None)
        form_name = self.request.query_params.get("form_name", None)
        show_deleted = self.request.query_params.get("show_deleted", None)
        created_by_id = self.request.query_params.get("created_by_id", None)
        created_by_team_id = self.request.query_params.get("created_by_team_id", None)

        queryset = Entity.objects.filter(account=self.request.user.iaso_profile.account)
        if form_name:
            queryset = queryset.filter(attributes__form__name__icontains=form_name)
        if search:
            queryset = queryset.filter(name__icontains=search)
        if by_uuid:
            queryset = queryset.filter(uuid=by_uuid)
        if entity_type:
            queryset = queryset.filter(name=entity_type)
        if org_unit_id:
            queryset = queryset.filter(attributes__org_unit__id=org_unit_id)
        if date_from:
            # TODO: see if we use created_at as reference date (or latest instance creation, update, ...)
            queryset = queryset.filter(created_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
        if show_deleted:
            queryset = queryset.filter(deleted_at__isnull=True)
        if created_by_id:
            queryset = queryset.filter(attributes__created_by_id=created_by_id)
        if created_by_team_id:
            queryset = queryset.filter(attributes__created_by__teams__id=created_by_team_id)

        # location

        queryset = queryset.order_by(*order)
        return queryset

    def list(self, request: Request, *args, **kwargs):
        csv_format = request.GET.get("csv", None)
        xlsx_format = request.GET.get("xlsx", None)
        pk = request.query_params.get("id", None)

        if xlsx_format or csv_format:
            if pk:
                beneficiaries = Entity.objects.filter(
                    account=self.request.user.iaso_profile.account, pk=pk, deleted_at__isnull=True
                )
            else:
                beneficiaries = Entity.objects.filter(
                    account=self.request.user.iaso_profile.account, deleted_at__isnull=True
                )
            if xlsx_format:
                return export_beneficiary_as_xlsx(beneficiaries)
            if csv_format:
                return export_beneficiary_as_csv(beneficiaries)

        return super().list(request, *args, **kwargs)
