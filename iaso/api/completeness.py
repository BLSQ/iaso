from rest_framework import viewsets
from rest_framework.response import Response

from hat.api.authentication import UserAccessPermission

from iaso.models import Instance, MappingVersion
import iaso.periods as periods


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


class CompletenessViewSet(viewsets.ViewSet):
    """
    list:
    """

    permission_required = ["menupermissions.iaso_completeness"]
    permission_classes = [UserAccessPermission]

    def list(self, request):
        profile = request.user.iaso_profile
        queryset = Instance.objects.filter(
            project__account=profile.account
        ).with_status()
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
            count["form"]["generate_derived"] = derived_forms_by_form_id.get(
                count["form"]["form_id"]
            )

        return Response({"completeness": counts})
