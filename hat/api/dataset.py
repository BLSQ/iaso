"""

.. |sources| replace:: Available sources:
                       ``mobile_backup``,
                       ``mobile_sync``,
                       ``historic``,
                       ``pv``.

.. |p_date_month| replace:: Filters results by document date month.
.. |p_date_from|  replace:: Filters participants with document date after parameter value.
.. |p_date_to|    replace:: Filters participants with document date before parameter value.
.. |p_location|   replace:: Filters results by “zone de santé”.
.. |p_source|     replace:: Filters results by document source. -- |sources|

"""

from functools import wraps
from typing import Dict, List, Any, Callable


from django.db.models import Count, Q

from rest_framework import viewsets
from rest_framework.exceptions import NotFound
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.reverse import reverse


from hat.cases.models import Location
from hat.common.jsonschema_validator import DefaultValidator
from hat.common.typing import JsonType
from hat.constants import CATT, RDT, CTCWOO, MAECT, PL, PG
from hat.geo.models import AS, ZS, Village
from hat.patient.models import Test

from hat.sync.models import DeviceDB

datasets = {}


def dataset(params_schema: JsonType = None) -> Callable:
    # Decorator to add a query function to the dataset.
    # Takes an optional schema to validate the query string parameters against.
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            return func(*args, **kwargs)

        datasets[func.__name__] = {"getter": wrapper, "params_schema": params_schema}
        return wrapper

    return decorator


params_schema = {
    "type": "object",
    "properties": {
        "date_month": {"type": "string"},
        "date_from": {"type": "string"},
        "date_to": {"type": "string"},
        "location": {"type": "string"},
        "source": {"type": "string"},
        "offset": {"type": "string"},
        "device_id": {"type": "string"},
        "order": {"type": "string"},
        "limit": {"type": "string"},
        "page": {"type": "string"},
    },
    "additionalProperties": False,
}


@dataset(params_schema=params_schema)
def device_status(request: Request, params: Dict[str, str]) -> List[JsonType]:

    devices = DeviceDB.objects.all()

    res = []
    for device in devices:
        # Add stats about pictures and videos
        device_stats = Test.objects.all().select_related('form').filter(form__device_id=device.device_id) \
            .aggregate(
                count_total=Count('id'),
                # count_catt=Count('id', filter=Q(type=CATT)),
                # count_catt_with_filename=Count('id', filter=Q(image_filename__isnull=False)),
                # count_catt_with_linked_picture=Count('id',
                #                                      filter=Q(image_filename__isnull=False) & Q(
                #                                          image_id__isnull=False) & Q(type=CATT)),
                # count_rdt=Count('id', filter=Q(type=RDT)),
                # count_rdt_with_filename=Count('id', filter=Q(image_filename__isnull=False)),
                # count_rdt_with_linked_picture=Count('id',
                #                                     filter=Q(image_filename__isnull=False) & Q(
                #                                         image_id__isnull=False) & Q(type=RDT)),
                count_linked_pictures=Count('id', filter=Q(image_filename__isnull=False) & Q(
                                        image_id__isnull=False) & (Q(type=RDT) | Q(type=CATT))),
                count_pictures_with_filename=Count('id', filter=Q(image_filename__isnull=False)),
                count_video_with_filename=Count('id', filter=Q(video_filename__isnull=False)),
                count_video_with_linked_video=Count(
                    'id',
                    filter=Q(video_filename__isnull=False) &
                           Q(video_id__isnull=False) &
                           Q(
                               Q(type=CTCWOO) |
                               Q(type=MAECT) |
                               Q(type=PL) |
                               Q(type=PG)
                           )
                ),
            )
        # Fetch user information
        last_team = ""
        last_user = ""
        if device.last_user and device.last_user.profile:
            last_user = device.last_user.profile.full_name()
            if device.last_user.profile.team:
                last_team = device.last_user.profile.team.name
        log_message = device.last_synced_log_message
        if not log_message:
            log_message = ""
        device_dict = {
            "last_synced_date": device.last_synced_date,
            "last_synced_log_message": log_message,
            "device_id": device.device_id,
            "days_since_sync": device.days_since_sync(),
            "last_user": last_user,
            "last_team": last_team,
            "id": device.id,
            **device_stats
        }

        res.append(device_dict)
    orders = params.get("order", "-days_since_sync").split(",")
    orders = [w.replace("last_synced_date", "days_since_sync") for w in orders]
    orders = [w.replace("-last_synced_date", "-days_since_sync") for w in orders]

    orders.reverse()

    for order in orders:
        key = order
        invert = False
        if order.startswith("-"):
            key = order[1:]
            invert = True

        res = sorted(
            res,
            key=lambda d: (d.get(key, "").lower() if isinstance(d.get(key, ""), str) else d.get(key, "")),
            reverse=invert,
        )

    return res


@dataset(params_schema={"type": "object", "properties": {}})
def locations_with_shape(request: Request, params: Dict[str, str]) -> List[str]:
    """
    Retrieves the valid list of “zones de santé” (:class:`hat.cases.models.Location`).
    Those zones come from the dbf files so we can assume that their
    shapes are contained in the ``shapes.json`` file.

    :return: The flat list of “zones de santé”.
    :rtype:  List[str]
    """

    locations = Location.objects.order_by("ZS")

    return locations.values_list("ZS", flat=True).distinct()


@dataset(params_schema={"type": "object", "properties": {"province_id": {"type": "string"}}})
def health_zones(request: Request, params: Dict[str, str]) -> List[str]:
    province_id = params.get("province_id")

    if province_id:
        queryset = ZS.objects.filter(province_id=province_id)
    else:
        queryset = ZS.objects.all()

    return queryset.values_list("id", "name").order_by("name")


@dataset(params_schema={"type": "object", "properties": {"zs_id": {"type": "string"}}})
def health_areas(request: Request, params: Dict[str, str]) -> List[str]:
    zs_ids = params.get("zs_id")

    if zs_ids:
        queryset = AS.objects.filter(ZS_id__in=zs_ids.split(","))
    else:
        queryset = AS.objects.all()

    return queryset.values_list("id", "name").order_by("name")


@dataset(params_schema={"type": "object", "properties": {"as_id": {"type": "string"}}})
def villages(request: Request, params: Dict[str, str]) -> List[str]:
    as_id = params.get("as_id")

    if as_id:
        queryset = Village.objects.filter(as_id=as_id)
    else:
        queryset = Village.objects.all()

    return queryset.values_list("id", "name").order_by("name")


class DatasetViewSet(viewsets.ViewSet):
    # View to list and retrieve registered datasets
    def list(self, request: Request) -> Response:
        items = []
        for k, v in datasets.items():
            items.append(
                {
                    "name": k,
                    "url": reverse("datasets-detail", args=[k], request=request),
                    "params_schema": v["params_schema"],
                }
            )
        return Response(items)

    def retrieve(self, request: Request, pk: str) -> Response:
        if pk not in datasets:
            raise NotFound()
        item = datasets[pk]
        # We have to convert the query dict to a regular dict,
        # because the json schema validation
        # might mutate the params dict with default values.
        params = dict(request.GET.items())
        if not item["params_schema"] is None:
            DefaultValidator(item["params_schema"]).validate(params)
        return Response(item["getter"](request, params))  # type: ignore
