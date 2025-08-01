from rest_framework import permissions, viewsets
from rest_framework.response import Response

import iaso.periods as periods
import iaso.permissions as core_permissions

from iaso.models import Instance, MappingVersion
from iaso.models.org_unit import OrgUnit

from .common import HasPermission


class CompletenessViewSet(viewsets.ViewSet):
    f"""Completeness API

    This API is restricted to authenticated users having the "{core_permissions.COMPLETENESS}" permission

    GET /api/completeness/
    """

    permission_classes = [permissions.IsAuthenticated, HasPermission(core_permissions.COMPLETENESS)]  # type: ignore

    def list(self, request):
        profile = request.user.iaso_profile
        profile_org_units = OrgUnit.objects.filter_for_user(request.user)

        queryset = (
            Instance.objects.filter(project__account=profile.account)
            .exclude(deleted=True)
            .exclude(file="")
            .with_status()
        )

        if profile_org_units:
            queryset = queryset.filter(org_unit__in=profile_org_units)

        counts = [to_completeness(count) for count in queryset.counts_by_status()]
        form_ids = [count["form"]["form_id"] for count in counts]

        # find derived related forms
        derived_forms_by_form_id = {}
        for form in MappingVersion.objects.filter(
            mapping__mapping_type="DERIVED", json__formId__in=set(form_ids)
        ).values("form_version__form_id", "json__formId", "form_version__form__name"):
            key = form["json__formId"]
            if key not in derived_forms_by_form_id:
                derived_forms_by_form_id[key] = []
            derived_forms_by_form_id[key].append(form)

        # enrich the paylod to allow scheduling from client if applicable
        for count in counts:
            count["form"]["generate_derived"] = derived_forms_by_form_id.get(count["form"]["form_id"])

        return Response({"completeness": counts})


def to_completeness(count):
    return {
        "period": count["period"],
        "form": {
            "id": count["form_id"],
            "name": count["form__name"],
            "period_type": periods.detect(count["period"]),
            "form_id": count["form__form_id"],
        },
        "counts": {
            "total": count["total_count"],
            "error": count["duplicated_count"],
            "exported": count["exported_count"],
            "ready": count["ready_count"],
        },
    }
