from typing import Union

from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.core.paginator import Paginator
from django.db import models
from django.shortcuts import get_object_or_404
from django.utils.translation import gettext as _
from rest_framework import viewsets
from rest_framework.authentication import BasicAuthentication
from rest_framework.response import Response

from hat.api.authentication import CsrfExemptSessionAuthentication
from hat.audit.models import Modification
from iaso.models import OrgUnit, Instance, Form
from hat.menupermissions import models as permission


def has_access_to(user: User, obj: Union[OrgUnit, Instance, models.Model]):
    if isinstance(obj, OrgUnit):
        ous = OrgUnit.objects.filter_for_user_and_app_id(user, None)
        return ous.filter(id=obj.id).exists()
    if isinstance(obj, Instance):
        instances = Instance.objects.filter_for_user(user)
        return user.has_perm(permission.SUBMISSIONS) and instances.filter(id=obj.id).exists()
    if isinstance(obj, Form):
        forms = Form.objects.filter_for_user_and_app_id(user)
        return forms.filter(id=obj.id).exists()
    # FIXME Hotfix to prevent an error when loading the app without the polio plugins
    from plugins.polio.models import Campaign

    if isinstance(obj, Campaign):
        return user.has_perm(permission.POLIO) and Campaign.objects.filter_for_user(user).filter(id=obj.id).exists()
    return False


class LogsViewSet(viewsets.ViewSet):
    """
    Modification API to retrieve log modifications. Read only
    unless the user is a super admin it is required to filter logs to an object instance (via a contentType and objectId)

    a `fields` query param can be used to specify additionals fields to return, accepted value are :
        - past_value
        - new_value
        - field_diffs

    contentType parameter can be one of:  iaso.orgunit, iaso.form, iaso.instance, polio.campaign

    list:
    Returns the list of modifications

    Contrary to most other endpoints, it is paginated by default to prevent overloading the system
    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)

    def list(self, request):
        from_date = request.GET.get("date_from", None)
        to_date = request.GET.get("date_to", None)
        limit = request.GET.get("limit", 50)  # prevent killing iaso /api/logs will just blow up in prod
        page_offset = request.GET.get("page", 1)
        orders = request.GET.get("order", "-created_at").split(",")
        user_ids = request.GET.get("userId", None)
        object_id = request.GET.get("objectId", None)
        content_type_arg = request.GET.get("contentType", None)
        source = request.GET.get("source", None)
        fields = request.GET.get("fields", "").split(",")

        queryset = Modification.objects.all()

        queryset = queryset.prefetch_related("user")
        queryset = queryset.prefetch_related("user__iaso_profile")
        queryset = queryset.prefetch_related("user__iaso_profile__user")
        queryset = queryset.prefetch_related("content_type")

        if from_date is not None:
            queryset = queryset.filter(created_at__gte=from_date)
        if to_date is not None:
            queryset = queryset.filter(created_at__lte=to_date)
        if user_ids is not None:
            queryset = queryset.filter(user_id__in=user_ids.split(","))

        if source is not None:
            queryset = queryset.filter(source=source)

        content_type = None
        if object_id is not None:
            queryset = queryset.filter(object_id=object_id)
        if content_type_arg:
            app_label, model = content_type_arg.split(".")
            try:
                content_type = ContentType.objects.get_by_natural_key(app_label, model)
            except ContentType.DoesNotExist:
                return queryset.none()
            else:
                queryset = queryset.filter(content_type=content_type)

        user: User = request.user
        if not user.is_superuser:
            if not (object_id and content_type):
                return Response(
                    {
                        "error": _(
                            "objectId and contentType parameters are required. contentType Can be one of iaso.orgunit, iaso.form, iaso.instance"
                        )
                    },
                    status=400,
                )
            obj = content_type.get_object_for_this_type(pk=object_id)
            if not has_access_to(user, obj):
                return Response({"error": _("Unauthorized")}, status=401)

        queryset = queryset.order_by(*orders)

        if limit:
            limit = int(limit)
            page_offset = int(page_offset)

            paginator = Paginator(queryset, limit)
            res = {"count": paginator.count}
            if page_offset > paginator.num_pages:
                page_offset = paginator.num_pages
            page = paginator.page(page_offset)

            res["list"] = map(lambda x: x.as_list(fields), page.object_list)
            res["has_next"] = page.has_next()
            res["has_previous"] = page.has_previous()
            res["page"] = page_offset
            res["pages"] = paginator.num_pages
            res["limit"] = limit
            return Response(res)
        else:
            return Response(map(lambda x: x.as_list(fields), queryset))

    def retrieve(self, request, pk=None):
        log = get_object_or_404(Modification, pk=pk)
        if not has_access_to(request.user, log.content_object):
            return Response({"error": _("Unauthorized")}, status=401)
        return Response(log.as_dict())
