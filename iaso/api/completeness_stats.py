from rest_framework import viewsets, permissions
from rest_framework.response import Response

from .common import HasPermission
from iaso.models import Instance, OrgUnit, Form
import iaso.periods as periods


class CompletenessStatsViewSet(viewsets.ViewSet):
    """Completeness Stats API"""

    permission_classes = [permissions.IsAuthenticated, HasPermission("menupermissions.iaso_completeness")]  # type: ignore

    def list(self, request):
        org_unit_type = None
        parent_org_unit = None
        form_ids = []
        profile = request.user.iaso_profile
        instance_qs = (
            Instance.objects.filter(project__account=profile.account)
            .exclude(deleted=True)
            .exclude(file="")
            .with_status()
        )
        #            .filter(form_id__in=form_ids) #don't forget this
        account = profile.account
        version = account.default_version

        org_units = (
            OrgUnit.objects.filter(version=version).filter(parent=parent_org_unit).filter(validation_status="VALID")
        )  # don't filter to think about org unit status

        top_ous = org_units.exclude(parent__in=org_units)

        res = []
        for ou in top_ous:
            for form_id in [2, 5, 1]:  # forms:
                form = Form.objects.get(id=form_id)
                ou_to_fill_count = (
                    OrgUnit.objects.hierarchy(ou).filter(org_unit_type__in=form.org_unit_types.all()).count()
                )
            res.append({"ou": ou.as_dict(), "form": form.as_dict(), "ou_to_fill_count": ou_to_fill_count})

        return Response({"completeness": res})
