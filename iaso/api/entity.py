import csv
import io

import xlsxwriter
from django.core.paginator import Paginator
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
from iaso.models import Entity, Instance, EntityType, FormVersion


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

    @action(detail=False, methods=["GET"])
    def get_attribute_fields(self, request):
        entity_type_id = self.request.query_params.get("id", None)
        entity_type = get_object_or_404(EntityType, pk=entity_type_id)
        latest_form_version_id = entity_type.reference_form.latest_version.pk
        form_version = FormVersion.objects.get(pk=latest_form_version_id)
        xpath = form_version.get_or_save_form_descriptor()["_xpath"]
        fields = []

        for k in xpath:
            fields.append(k)
        resp = {"fields": sorted(fields)}

        return Response(resp)


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


def export_entity_as_xlsx(entities):
    mem_file = io.BytesIO()
    workbook = xlsxwriter.Workbook(mem_file)
    worksheet = workbook.add_worksheet("beneficiary")
    worksheet.set_column(0, 100, 30)
    row_color = workbook.add_format({"bg_color": "#FFC7CE"})
    row = 0
    col = 0
    filename = ""
    for entity in entities:
        res = {"entity": EntitySerializer(entity, many=False).data}
        worksheet.set_row(row, cell_format=row_color)
        worksheet.write(row, col, f"{entity.name.upper()}:")
        row += 1
        for k, v in res["entity"].items():
            try:
                fields_list = entity.entity_type.fields_detail_view
            except TypeError:
                raise serializers.ValidationError(
                    {"error": "You must provide a field details view list in order to export the entities."}
                )
            if k in fields_list or k == "attributes":
                if k == "attributes":
                    for k_, v_ in res["entity"]["attributes"]["file_content"].items():
                        worksheet.write(row, col, k_)
                        worksheet.write(row + 1, col, v_)
                        col += 1
                else:
                    worksheet.write(row, col, k)
                    worksheet.write(row + 1, col, v)
                    col += 1
        col = 0
        row += 2
        filename = entity.name
    filename = f"EXPORT_ENTITIES.xlsx" if len(entities) > 1 else f"{filename.upper()}_ENTITY.xlsx"
    workbook.close()
    mem_file.seek(0)
    response = HttpResponse(mem_file, content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    response["Content-Disposition"] = "attachment; filename=%s" % filename
    return response


def export_entity_as_csv(entities):

    header = []
    data = []
    filename = ""

    for entity in entities:
        res = {"entity": EntitySerializer(entity, many=False).data}
        benef_data = []
        for k, v in res["entity"].items():
            try:
                fields_list = entity.entity_type.fields_detail_view
            except TypeError:
                raise serializers.ValidationError(
                    {"error": "You must provide a field details view list in order to export the entities."}
                )
            if k in fields_list or k == "attributes":
                if k == "attributes":
                    for k_, v_ in res["entity"]["attributes"]["file_content"].items():
                        if k_ not in header:
                            header.append(k_)
                        benef_data.append(v_)
                else:
                    if k not in header:
                        header.append(k)
                    benef_data.append(v)
        data.append(benef_data)
        filename = entity.name
    filename = f"EXPORT_ENTITIES.csv" if len(entities) > 1 else f"{filename.upper()}_ENTITY.csv"

    response = HttpResponse(
        content_type="txt/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )

    writer = csv.writer(response)
    writer.writerow(header)
    writer.writerows(data)

    return response


class EntityViewSet(ModelViewSet):
    results_key = "entities"
    remove_results_key_if_paginated = True
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend, EntityFilterBackend]

    def get_serializer_class(self):
        return EntitySerializer

    def get_queryset(self):
        search = self.request.query_params.get("search", None)
        org_unit_id = self.request.query_params.get("orgUnitId", None)
        date_from = self.request.query_params.get("dateFrom", None)
        date_to = self.request.query_params.get("dateTo", None)
        order = self.request.query_params.get("order", "updated_at").split(",")
        entity_type = self.request.query_params.get("entity_type", None)
        entity_type_id = self.request.query_params.get("entity_type_id", None)
        by_uuid = self.request.query_params.get("by_uuid", None)
        form_name = self.request.query_params.get("form_name", None)
        show_deleted = self.request.query_params.get("show_deleted", None)
        created_by_id = self.request.query_params.get("created_by_id", None)
        created_by_team_id = self.request.query_params.get("created_by_team_id", None)

        queryset = Entity.objects.filter(account=self.request.user.iaso_profile.account, deleted_at__isnull=True)
        if form_name:
            queryset = queryset.filter(attributes__form__name__icontains=form_name)
        if search:
            queryset = queryset.filter(name__icontains=search)
        if by_uuid:
            queryset = queryset.filter(uuid=by_uuid)
        if entity_type:
            queryset = queryset.filter(name=entity_type)
        if entity_type_id:
            queryset = queryset.filter(entity_type_id=entity_type_id)
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

    def list(self, request: Request, *args, **kwargs):
        queryset = self.get_queryset()
        csv_format = request.GET.get("csv", None)
        xlsx_format = request.GET.get("xlsx", None)
        pk = request.query_params.get("id", None)
        account = self.request.user.iaso_profile.account
        entity_type_id = request.query_params.get("entity_type_id", None)
        limit = request.GET.get("limit", None)
        page_offset = request.GET.get("page", 1)

        if xlsx_format or csv_format:
            if pk:
                entities = Entity.objects.filter(account=account, pk=pk, deleted_at__isnull=True)
            else:
                entities = Entity.objects.filter(account=account, deleted_at__isnull=True)
            if xlsx_format:
                return export_entity_as_xlsx(entities)
            if csv_format:
                return export_entity_as_csv(entities)

        entities = queryset
        result_list = []

        if entity_type_id is None:
            for entity in entities:
                entity_serialized = EntitySerializer(entity, many=False)
                file_content = entity_serialized.data.get("attributes").get("file_content")
                result = {
                    "id": entity.id,
                    "uuid": entity.uuid,
                    "name": file_content.get("name"),
                    "created_at": entity.created_at,
                    "updated_at": entity.updated_at,
                    "attributes": entity.attributes.pk,
                    "entity_type": entity.entity_type.name,
                }
                result_list.append(result)

            if limit:
                limit = int(limit)
                page_offset = int(page_offset)
                paginator = Paginator(result_list, limit)
                res = {"count": paginator.count}
                if page_offset > paginator.num_pages:
                    page_offset = paginator.num_pages
                page = paginator.page(page_offset)

                res["result"] = map(lambda x: x, page.object_list)
                res["has_next"] = page.has_next()
                res["has_previous"] = page.has_previous()
                res["page"] = page_offset
                res["pages"] = paginator.num_pages
                res["limit"] = limit
                return Response(res)

            return Response(result_list)

        columns_list = []
        form_key_list = []
        for entity in entities:
            entity_serialized = EntitySerializer(entity, many=False)
            file_content = entity_serialized.data.get("attributes").get("file_content")
            form_version = EntityType.objects.get(pk=entity_type_id).reference_form.latest_version
            form_descriptor = form_version.get_or_save_form_descriptor()
            for k in form_descriptor:
                form_key_list.append(k)
            form_data_key = form_key_list[form_key_list.index("version") + 1]
            descriptor_list = form_descriptor[form_data_key]

            is_list = True

            for d in descriptor_list:
                for k, v in d.items():
                    data_list = v
                    if k == "children":
                        while is_list:
                            for data in data_list:
                                value_dict = {}
                                for _k, _v in data.items():
                                    if _k == "name" or _k == "label":
                                        value_dict[_k] = _v
                                        is_list = False
                                    key_index = sorted(data.keys()).index(_k)
                                    if key_index < len(sorted(data.keys())) - 1:
                                        if sorted(data.keys())[key_index + 1] == "children":
                                            data_list = data["children"]
                                            is_list = True
                                    if _k == "children":
                                        data_list = _v
                                        is_list = True
                                columns_list.append(value_dict)
            result = {}
            for k, v in file_content.items():
                if k in list(entity.entity_type.fields_list_view):
                    result[k] = v
            result_list.append(result)
        columns_list = [i for n, i in enumerate(columns_list) if i not in columns_list[n + 1 :]]

        # remove dictionaries with "name" as only key
        for col in columns_list:
            if len(col) != 2:
                columns_list.remove(col)

        if limit:
            limit = int(limit)
            page_offset = int(page_offset)
            paginator = Paginator(result_list, limit)
            res = {"count": paginator.count}
            if page_offset > paginator.num_pages:
                page_offset = paginator.num_pages
            page = paginator.page(page_offset)

            res["has_next"] = page.has_next()
            res["has_previous"] = page.has_previous()
            res["page"] = page_offset
            res["pages"] = paginator.num_pages
            res["limit"] = limit
            res["columns"] = (columns_list,)
            res["result"] = map(lambda x: x, page.object_list)
            return Response(res)

        response = {"columns": columns_list, "result": result_list}

        return Response(response)
