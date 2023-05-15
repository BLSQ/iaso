import csv
import datetime
import io
import math
from time import strftime, gmtime
from typing import List, Any, Union

import xlsxwriter  # type: ignore
from django.core.paginator import Paginator
from django.db.models import Max, Q, Count
from django.http import JsonResponse, HttpResponse, StreamingHttpResponse
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from rest_framework import filters
from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from hat.api.export_utils import Echo, generate_xlsx, iter_items
from iaso.api.common import (
    TimestampField,
    ModelViewSet,
    DeletionFilterBackend,
    CONTENT_TYPE_XLSX,
    CONTENT_TYPE_CSV,
    EXPORTS_DATETIME_FORMAT,
)
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
            "fields_detail_info_view",
            "fields_list_view",
            "fields_duplicate_search",
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
            "org_unit",
            "duplicates",
        ]

    entity_type_name = serializers.SerializerMethodField()
    attributes = serializers.SerializerMethodField()
    submitter = serializers.SerializerMethodField()
    org_unit = serializers.SerializerMethodField()
    duplicates = serializers.SerializerMethodField()

    def get_attributes(self, entity: Entity):
        if entity.attributes:
            return entity.attributes.as_full_model()
        return None

    def get_org_unit(self, entity: Entity):
        if entity.attributes and entity.attributes.org_unit:
            return entity.attributes.org_unit.as_location(with_parents=True)
        return None

    def get_submitter(self, entity: Entity):
        try:
            # TODO: investigate type issue on next line
            submitter = entity.attributes.created_by.username  # type: ignore
        except AttributeError:
            submitter = None
        return submitter

    @staticmethod
    def get_entity_type_name(obj: Entity):
        return obj.entity_type.name if obj.entity_type else None

    def get_duplicates(self, entity: Entity):
        return get_duplicates(entity)


class EntityTypeViewSet(ModelViewSet):
    """Entity Type API
    /api/entitytypes
    /api/mobile/entitytypes
    /api/mobile/entitytype [Deprecated] will be removed in the future
    """

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


def get_duplicates(entity):
    results = []
    e1qs = entity.duplicates1.filter(validation_status="PENDING")
    e2qs = entity.duplicates2.filter(validation_status="PENDING")
    if e1qs.count() > 0:
        results = results + list(map(lambda x: x.entity2.id, e1qs.all()))
    elif e2qs.count() > 0:
        results = results + list(map(lambda x: x.entity1.id, e2qs.all()))
    return results


class EntityViewSet(ModelViewSet):
    """Entity API

    list: /api/entities

    list entity by entity type: /api/entities/?entity_type_id=ids

    details =/api/entities/<id>

    export entity list: /api/entities/?xlsx=true

    export entity by entity type: /api/entities/entity_type_ids=ids&?xlsx=true

    export entity submissions list: /api/entities/export_entity_submissions_list/?id=id

    **replace xlsx by csv to export as csv
    """

    results_key = "entities"
    remove_results_key_if_paginated = True
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend, DeletionFilterBackend]

    def get_serializer_class(self):
        return EntitySerializer

    def get_queryset(self):
        search = self.request.query_params.get("search", None)
        org_unit_id = self.request.query_params.get("orgUnitId", None)
        date_from = self.request.query_params.get("dateFrom", None)
        date_to = self.request.query_params.get("dateTo", None)
        entity_type = self.request.query_params.get("entity_type", None)
        entity_type_ids = self.request.query_params.get("entity_type_ids", None)
        by_uuid = self.request.query_params.get("by_uuid", None)
        form_name = self.request.query_params.get("form_name", None)
        show_deleted = self.request.query_params.get("show_deleted", None)
        created_by_id = self.request.query_params.get("created_by_id", None)
        created_by_team_id = self.request.query_params.get("created_by_team_id", None)

        queryset = Entity.objects.filter(account=self.request.user.iaso_profile.account)
        if form_name:
            queryset = queryset.filter(attributes__form__name__icontains=form_name)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(uuid__icontains=search) | Q(attributes__json__icontains=search)
            )
        if by_uuid:
            queryset = queryset.filter(uuid=by_uuid)
        if entity_type:
            queryset = queryset.filter(name=entity_type)
        if entity_type_ids:
            queryset = queryset.filter(entity_type_id__in=entity_type_ids.split(","))
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
        queryset = self.filter_queryset(self.get_queryset())
        csv_format = request.GET.get("csv", None)
        xlsx_format = request.GET.get("xlsx", None)
        # TODO: investigate if request.user can be anonymous here
        entity_type_ids = request.query_params.get("entity_type_ids", None)
        limit = request.GET.get("limit", None)
        page_offset = request.GET.get("page", 1)
        orders = request.GET.get("order", "-created_at").split(",")
        order_columns = request.GET.get("order_columns", None)

        queryset = queryset.order_by(*orders)

        # annotate with last instance on Entity, to allow ordering by it
        entities = queryset.annotate(last_saved_instance=Max("instances__created_at"))
        result_list = []
        columns_list: List[Any] = []

        # -- Allow ordering by the field inside the Entity.
        fields_on_entity = [f.name for f in Entity._meta.get_fields()]
        # add field in the annotation
        fields_on_entity += entities.query.annotations.keys()
        # check if the ordering column is on Entity or annotation,
        # otherwise assume it's part of the attributes
        new_order_columns = []
        if order_columns:
            # FIXME: next line: a string variable is reused for a list, cna we avoid that?
            order_columns = order_columns.split(",")  # type: ignore
            for order_column in order_columns:
                # Remove eventual leading -
                order_column_name = order_column.lstrip("-")
                if order_column_name.split("__")[0] in fields_on_entity:
                    new_order_columns.append(order_column)
                else:
                    new_name = "-" if order_column.startswith("-") else ""
                    new_name += "attributes__json__" + order_column_name
                    new_order_columns.append(new_name)

        entities = entities.order_by(*new_order_columns)

        if limit:
            limit_int = int(limit)
            page_offset = int(page_offset)
            start_int = (page_offset - 1) * limit_int
            end_int = start_int + limit_int
            total_count = entities.count()
            num_pages = math.ceil(total_count / limit_int)
            entities = entities[start_int:end_int]
            results_count = entities.count()

        if entity_type_ids is None or (entity_type_ids is not None and len(entity_type_ids.split(",")) > 1):
            for entity in entities:
                attributes = entity.attributes
                attributes_pk = None
                attributes_ou = None
                # FIXME
                file_content = None  # type: ignore
                if attributes is not None and entity.attributes is not None:
                    file_content = entity.attributes.get_and_save_json_of_xml().get(
                        "file_content", None
                    )  # type: ignore
                    attributes_pk = attributes.pk
                    attributes_ou = entity.attributes.org_unit.as_location(with_parents=True)  # type: ignore
                name = None
                program = None

                if file_content is not None:
                    name = file_content.get("name")
                    program = file_content.get("program")
                result = {
                    "id": entity.id,
                    "uuid": entity.uuid,
                    "name": name,
                    "created_at": entity.created_at,
                    "updated_at": entity.updated_at,
                    "attributes": attributes_pk,
                    "entity_type": entity.entity_type.name,
                    # TODO: investigate typing issue on next line
                    "last_saved_instance": entity.last_saved_instance,  # type: ignore
                    "org_unit": attributes_ou,
                    "program": program,
                    "duplicates": get_duplicates(entity),
                }
                result_list.append(result)
        else:
            for entity in entities:
                attributes = entity.attributes
                attributes_ou = None
                file_content = None
                if attributes is not None and entity.attributes is not None:  # type: ignore
                    # FIXME: what if entity.attributes is None?
                    file_content = entity.attributes.get_and_save_json_of_xml().get(
                        "file_content", None
                    )  # type: ignore
                    # FIXME: what if entity.attributes.org_unit is None?
                    attributes_ou = entity.attributes.org_unit.as_location(with_parents=True)  # type: ignore
                columns_list = []
                program = None
                if file_content is not None:
                    program = file_content.get("program")
                # FIXME: what if entity.entity_type.reference_form is None?
                possible_fields_list = entity.entity_type.reference_form.possible_fields or []  # type: ignore
                # FIXME: investigate typing error on next line
                for items in possible_fields_list:  # type: ignore
                    for k, v in items.items():
                        if k == "name":
                            # FIXME: investigate typing error on next line
                            if v in entity.entity_type.fields_list_view:  # type: ignore
                                columns_list.append(items)
                result = {
                    "id": entity.pk,
                    "uuid": str(entity.uuid),
                    "entity_type": entity.entity_type.name,
                    "created_at": entity.created_at,
                    "updated_at": entity.updated_at,
                    "org_unit": attributes_ou,
                    # FIXME: investigate typing error on next line
                    "last_saved_instance": entity.last_saved_instance,  # type: ignore
                    "program": program,
                    "duplicates": get_duplicates(entity),
                }

                # Get data from xlsform
                if attributes is not None and attributes.json is not None:
                    # TODO: investigate typing error on next line
                    for k, v in entity.attributes.json.items():  # type: ignore
                        if k in list(entity.entity_type.fields_list_view):  # type: ignore
                            result[k] = v
                    result_list.append(result)

            columns_list = [i for n, i in enumerate(columns_list) if i not in columns_list[n + 1 :]]
            columns_list = [c for c in columns_list if len(c) > 2]

        if xlsx_format or csv_format:
            columns = [
                {"title": "ID", "width": 20},
                {"title": "UUID", "width": 20},
                {"title": "Entity Type", "width": 20},
                {"title": "Creation Date", "width": 20},
                {"title": "HC", "width": 20},
                {"title": "Last update", "width": 20},
                {"title": "Program", "width": 20},
            ]
            for col in columns_list:
                columns.append({"title": col["label"]})

            filename = "entities"
            filename = "%s-%s" % (filename, strftime("%Y-%m-%d-%H-%M", gmtime()))

            def get_row(entity: dict, **kwargs):
                created_at = entity["created_at"]
                if created_at is not None:
                    created_at = created_at.strftime(EXPORTS_DATETIME_FORMAT)

                last_saved_instance = entity["last_saved_instance"]
                if last_saved_instance is not None:
                    last_saved_instance = last_saved_instance.strftime(EXPORTS_DATETIME_FORMAT)

                values = [
                    entity["id"],
                    str(entity["uuid"]),
                    entity["entity_type"],
                    created_at,
                    entity["org_unit"]["name"] if entity["org_unit"] else "",
                    last_saved_instance,
                    entity["program"],
                ]
                for col in columns_list:
                    values.append(entity.get(col["name"]))
                return values

            response: Union[HttpResponse, StreamingHttpResponse]
            if xlsx_format:
                filename = filename + ".xlsx"
                response = HttpResponse(
                    generate_xlsx("Entities", columns, result_list, get_row),
                    content_type=CONTENT_TYPE_XLSX,
                )
            if csv_format:
                response = StreamingHttpResponse(
                    streaming_content=(iter_items(result_list, Echo(), columns, get_row)), content_type=CONTENT_TYPE_CSV
                )
                filename = filename + ".csv"
            response["Content-Disposition"] = "attachment; filename=%s" % filename
            return response

        if limit:
            return Response(
                {
                    "count": total_count,
                    "has_next": end_int < total_count,
                    "has_previous": start_int > 0,
                    "page": page_offset,
                    "pages": num_pages,
                    "limit": limit_int,
                    "columns": columns_list,
                    "result": result_list,
                }
            )

        res = {"columns": columns_list, "result": result_list}
        return Response(res)

    @action(detail=False, methods=["GET"])
    def export_entity_submissions_list(self, request):
        entity_id = request.GET.get("id", None)
        entity = get_object_or_404(Entity, pk=entity_id)
        instances = Instance.objects.filter(entity=entity)
        xlsx = request.GET.get("xlsx", None)
        csv_exp = request.GET.get("csv", None)
        fields = ["Submissions for the form", "Created", "Last Sync", "Org Unit", "Submitter", "Actions"]
        date = datetime.datetime.now().strftime("%Y-%m-%d")

        if xlsx:
            mem_file = io.BytesIO()
            workbook = xlsxwriter.Workbook(mem_file)
            worksheet = workbook.add_worksheet("entity")
            worksheet.set_column(0, 100, 30)
            row = 0
            col = 0

            for f in fields:
                worksheet.write(row, col, f)
                col += 1

            for i in instances:
                row += 1
                col = 0
                data = [
                    i.form.name,
                    i.created_at.strftime(EXPORTS_DATETIME_FORMAT),
                    i.updated_at.strftime(EXPORTS_DATETIME_FORMAT),
                    i.org_unit.name,
                    i.created_by.username,
                    "",
                ]
                for d in data:
                    worksheet.write(row, col, d)
                    col += 1
            filename = f"{entity}_details_list_{date}.xlsx"
            workbook.close()
            mem_file.seek(0)
            response = HttpResponse(mem_file, content_type=CONTENT_TYPE_XLSX)
            response["Content-Disposition"] = "attachment; filename=%s" % filename
            return response

        if csv_exp:
            filename = f"{entity}_details_list_{date}.csv"
            response = HttpResponse(
                content_type="txt/csv",
                headers={"Content-Disposition": f"attachment; filename={filename}"},
            )

            writer = csv.writer(response)
            writer.writerow(fields)

            for i in instances:
                data_list = [
                    i.form.name,
                    i.created_at.strftime(EXPORTS_DATETIME_FORMAT),
                    i.updated_at.strftime(EXPORTS_DATETIME_FORMAT),
                    i.org_unit.name,
                    i.created_by.username,
                    "",
                ]
                writer.writerow(data_list)

            return response

        return super().list(request)
