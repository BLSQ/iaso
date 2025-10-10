import datetime
import json
import math
import re

from time import gmtime, strftime
from typing import Any, List, Union

import pytz

from django.core.paginator import Paginator
from django.db.models import Exists, Max, OuterRef, Q
from django.db.models.functions import Coalesce
from django.http import HttpResponse, JsonResponse, StreamingHttpResponse
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from rest_framework import filters, permissions, serializers
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.request import Request
from rest_framework.response import Response

import iaso.permissions as core_permissions

from hat.api.export_utils import Echo, generate_xlsx, iter_items
from hat.audit.models import ENTITY_API
from iaso.api.common import (
    CONTENT_TYPE_CSV,
    CONTENT_TYPE_XLSX,
    EXPORTS_DATETIME_FORMAT,
    DeletionFilterBackend,
    HasPermission,
    ModelViewSet,
)
from iaso.models import Entity, EntityType, Instance, OrgUnit
from iaso.utils.jsonlogic import entities_jsonlogic_to_q

from .serializers import EntitySerializer


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
    filter_backends = [
        filters.OrderingFilter,
        DjangoFilterBackend,
        DeletionFilterBackend,
    ]
    permission_classes = [permissions.IsAuthenticated, HasPermission(core_permissions.ENTITIES)]  # type: ignore

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
        groups = self.request.query_params.get("groups", None)
        fields_search = self.request.GET.get("fields_search", None)

        queryset = (
            Entity.objects.filter_for_user(self.request.user)
            .select_related(
                "attributes__org_unit",
                "attributes__created_by",
                "entity_type",
            )
            .prefetch_related(
                "attributes__created_by__teams",
                "attributes__form",
                "attributes__org_unit__groups",
                "attributes__org_unit__org_unit_type",
                "attributes__org_unit__parent",
                "attributes__org_unit__version__data_source",
                "instances",
            )
        )

        if form_name:
            queryset = queryset.filter(attributes__form__name__icontains=form_name)
        if search:
            if search.startswith("ids:"):
                ids = re.findall("\d+", search)
                if not ids:
                    raise ValidationError(f"Failed parsing ids in search '{search}'")
                queryset = queryset.filter(id__in=ids)
            elif search.startswith("uuids:"):
                uuids_re = r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
                uuids = re.findall(uuids_re, search)
                if not uuids:
                    raise ValidationError(f"Failed parsing uuids in search '{search}'")
                queryset = queryset.filter(uuid__in=uuids)
            else:
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
            parent = OrgUnit.objects.get(id=org_unit_id)
            queryset = queryset.filter(attributes__org_unit__path__descendants=parent.path)

        if date_from or date_to:
            date_from_dt = datetime.datetime.min
            if date_from:
                parsed_date = datetime.datetime.strptime(date_from, "%Y-%m-%d")
                date_from_dt = datetime.datetime.combine(parsed_date, datetime.time.min).replace(tzinfo=pytz.UTC)

            date_to_dt = datetime.datetime.max
            if date_to:
                parsed_date = datetime.datetime.strptime(date_to, "%Y-%m-%d")
                date_to_dt = datetime.datetime.combine(parsed_date, datetime.time.max).replace(tzinfo=pytz.UTC)

            instances_within_range = Instance.objects.annotate(
                creation_timestamp=Coalesce("source_created_at", "created_at")
            ).filter(
                entity=OuterRef("pk"),
                creation_timestamp__gte=date_from_dt,
                creation_timestamp__lte=date_to_dt,
            )
            queryset = queryset.filter(Exists(instances_within_range))
        if show_deleted:
            queryset = queryset.filter(deleted_at__isnull=True)
        if created_by_id:
            queryset = queryset.filter(attributes__created_by_id=created_by_id)
        if created_by_team_id:
            queryset = queryset.filter(attributes__created_by__teams__id=created_by_team_id)
        if groups:
            queryset = queryset.filter(attributes__org_unit__groups__in=groups.split(","))

        if fields_search:
            q = entities_jsonlogic_to_q(json.loads(fields_search))
            queryset = queryset.filter(q)

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

        entity = Entity.objects.create(
            name=data["name"],
            entity_type=entity_type,
            attributes=instance,
            account=account,
        )
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
                    name=entity["name"],
                    entity_type=entity_type,
                    attributes=instance,
                    account=account,
                )
                created_entities.append(entity)
            return JsonResponse(created_entities, safe=False)
        entities = Entity.objects.filter(account=request.user.iaso_profile.account)
        serializer = EntitySerializer(entities, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        queryset = Entity.objects.filter_for_user(self.request.user).distinct()
        entity = get_object_or_404(queryset, pk=pk)
        return Response(EntitySerializer(entity, many=False).data)

    def list(self, request: Request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        csv_format = request.GET.get("csv", None)
        xlsx_format = request.GET.get("xlsx", None)
        is_export = any([csv_format, xlsx_format])

        # TODO: investigate if request.user can be anonymous here
        entity_type_ids = request.query_params.get("entity_type_ids", None)
        limit = request.GET.get("limit", None)
        page_offset = request.GET.get("page", 1)
        orders = request.GET.get("order", "-created_at").split(",")
        order_columns = request.GET.get("order_columns", None)
        as_location = request.GET.get("asLocation", None)

        # we don't need duplicates for map display or exports
        fetch_duplicates = not as_location and not is_export
        if fetch_duplicates:
            queryset = queryset.with_duplicates()

        queryset = queryset.order_by(*orders)

        # annotate with last instance on Entity, to allow ordering by it
        entities = queryset.annotate(
            last_saved_instance=Max(Coalesce("instances__source_created_at", "instances__created_at"))
        )
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

        if as_location:
            limit_int = int(limit)
            paginator = Paginator(entities, limit_int)
            entities = paginator.page(1).object_list
        elif limit and not is_export:
            limit_int = int(limit)
            page_offset = int(page_offset)
            start_int = (page_offset - 1) * limit_int
            end_int = start_int + limit_int
            total_count = entities.count()
            num_pages = math.ceil(total_count / limit_int)
            entities = entities[start_int:end_int]

        # if exactly one type of entity specified, add columns for that type of entity
        columns_list = []
        if entity_type_ids is not None and len(entity_type_ids.split(",")) == 1:
            entity_type = EntityType.objects.select_related("reference_form").get(id=int(entity_type_ids))
            possible_fields_list = entity_type.reference_form.possible_fields or []
            for items in possible_fields_list:
                for k, v in items.items():
                    if k == "name" and v in entity_type.fields_list_view:
                        columns_list.append(items)
            columns_list = [i for n, i in enumerate(columns_list) if i not in columns_list[n + 1 :]]
            columns_list = [c for c in columns_list if len(c) > 2]
        columns_set = {k["name"] for k in columns_list}

        def entities_as_dict_gen(entity_qs, columns_set):
            for entity in entity_qs:
                attributes = entity.attributes
                attributes_pk = None
                attributes_ou = None
                attributes_latitude = None
                attributes_longitude = None
                file_content = None
                if attributes is not None and entity.attributes is not None:
                    file_content = entity.attributes.get_and_save_json_of_xml().get("file_content", None)
                    attributes_pk = attributes.pk
                    attributes_ou = (
                        entity.attributes.org_unit.as_dict_for_entity() if entity.attributes.org_unit else None
                    )  # type: ignore
                    attributes_latitude = attributes.location.y if attributes.location else None  # type: ignore
                    attributes_longitude = attributes.location.x if attributes.location else None  # type: ignore
                name = None
                if file_content is not None:
                    name = file_content.get("name")
                has_duplicates = False
                if fetch_duplicates:
                    has_duplicates = getattr(entity, "has_duplicates", False)

                result = {
                    "id": entity.id,
                    "uuid": entity.uuid,
                    "name": name,
                    "created_at": entity.created_at,
                    "updated_at": entity.updated_at,
                    "attributes": attributes_pk,
                    "entity_type": entity.entity_type.name,
                    "last_saved_instance": entity.last_saved_instance,
                    "org_unit": attributes_ou,
                    "has_duplicates": has_duplicates,
                    "latitude": attributes_latitude,
                    "longitude": attributes_longitude,
                }
                if attributes is not None and attributes.json is not None:
                    for k, v in entity.attributes.json.items():
                        if k in columns_set:
                            result[k] = v
                yield result

        if is_export:
            # chunk_size needs to be set explicitly when using prefetch_related() on the qs
            results = entities_as_dict_gen(entities.iterator(chunk_size=4000), columns_set)
            columns = [
                {"title": "ID", "width": 20},
                {"title": "UUID", "width": 20},
                {"title": "Entity Type", "width": 20},
                {"title": "Creation Date", "width": 20},
                {"title": "HC", "width": 20},
                {"title": "HC ID", "width": 20},
                {"title": "Last update", "width": 20},
            ]
            # entity type-specific columns
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
                    entity["org_unit"]["id"] if entity["org_unit"] else "",
                    last_saved_instance,
                ]
                for col in columns_list:
                    values.append(entity.get(col["name"]))
                return values

            response: Union[HttpResponse, StreamingHttpResponse]
            if xlsx_format:
                filename = filename + ".xlsx"
                response = HttpResponse(
                    generate_xlsx("Entities", columns, results, get_row),
                    content_type=CONTENT_TYPE_XLSX,
                )
            if csv_format:
                response = StreamingHttpResponse(
                    streaming_content=(iter_items(results, Echo(), columns, get_row)),
                    content_type=CONTENT_TYPE_CSV,
                )
                filename = filename + ".csv"
            response["Content-Disposition"] = "attachment; filename=%s" % filename
            return response

        results = entities_as_dict_gen(entities, columns_set)
        if as_location:
            return Response(
                {
                    "limit": limit_int,
                    "result": list(results),
                }
            )
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
                    "result": list(results),
                }
            )

        res = {"columns": columns_list, "result": list(results)}
        return Response(res)

    def destroy(self, request, pk=None):
        entity = Entity.objects_include_deleted.get(pk=pk)

        entity = entity.soft_delete_with_instances_and_pending_duplicates(
            audit_source=ENTITY_API,
            user=request.user,
        )

        return Response(EntitySerializer(entity, many=False).data)
