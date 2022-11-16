"""
The completeness stats API endpoint.

This endpoint is used to display the completeness stats in the dashboard. Completeness data is a list rows, each row
for a given form in a given orgunit.

This one is planned to become a "default" and be reused, not to be confused with the more specialized preexisting
completeness API.
"""

# TODO: clarify permissions: new iaso_completeness_stats permission?
# TODO: clarify with FE what's needed in terms of pagination
# TODO: clarify with FE what's needed in terms of sorting

from rest_framework import viewsets, permissions
from rest_framework.response import Response

from .common import HasPermission
from iaso.models import OrgUnit, Form, OrgUnitType
from django.core.paginator import Paginator


def formatted_percentage(part: int, total: int) -> str:
    if total == 0:
        return "N/A"

    return "{:.1%}".format(part / total)


class CompletenessStatsViewSet(viewsets.ViewSet):
    """Completeness Stats API"""

    permission_classes = [permissions.IsAuthenticated, HasPermission("menupermissions.iaso_completeness_stats")]  # type: ignore

    def list(self, request):
        order = request.GET.get("order", "name").split(",")
        org_unit_type_str = request.query_params.get("org_unit_type_id", None)
        requested_forms = request.query_params.get("form_id", None)
        if org_unit_type_str is not None:
            org_unit_type = OrgUnitType.objects.get(id=org_unit_type_str)
        else:
            org_unit_type = None

        parent_org_unit_id_str = request.GET.get("parent_id", None)

        if parent_org_unit_id_str is not None:
            parent_org_unit = OrgUnit.objects.get(id=parent_org_unit_id_str)
        else:
            parent_org_unit = None

        requested_form_ids = requested_forms.split(",") if requested_forms is not None else []
        profile = request.user.iaso_profile

        # Forms to take into account: we take everything for the user's account, then filter by the form_ids if provided
        form_qs = Form.objects.filter_for_user_and_app_id(user=request.user)
        if requested_form_ids:
            form_qs = form_qs.filter(id__in=requested_form_ids)

        account = profile.account
        version = account.default_version

        org_units = (
            OrgUnit.objects.filter(version=version).filter(parent=parent_org_unit).filter(validation_status="VALID")
        )  # don't forget to think about org unit status

        top_ous = org_units.exclude(parent__in=org_units)
        if org_unit_type is not None:
            top_ous = top_ous.filter(org_unit_type__id=org_unit_type.id)

        top_ous = top_ous.order_by(*order)

        res = []
        for ou in top_ous:
            for form in form_qs:
                form = Form.objects.get(id=form.id)

                ou_types = form.org_unit_types.all()
                if org_unit_type is not None:
                    ou_types = ou_types.filter(id=org_unit_type.id)

                ou_to_fill = OrgUnit.objects.hierarchy(ou).filter(org_unit_type__in=ou_types)

                ou_to_fill_count = ou_to_fill.count()
                ou_filled = ou_to_fill.filter(instance__form=form)
                ou_filled_count = ou_filled.count()

                # TODO: response as serializer for swagger

                parent_data = None
                if ou.parent is not None:
                    parent_data = (ou.parent.as_dict_for_completeness_stats(),)

                res.append(
                    {
                        "parent_org_unit": parent_data,
                        "org_unit_type": ou.org_unit_type.as_dict_for_completeness_stats(),
                        "org_unit": ou.as_dict_for_completeness_stats(),
                        "form": form.as_dict_for_completeness_stats(),
                        "forms_filled": ou_filled_count,
                        "forms_to_fill": ou_to_fill_count,
                        "completeness_ratio": formatted_percentage(part=ou_filled_count, total=ou_to_fill_count),
                    }
                )
        limit = int(request.GET.get("limit", "50"))
        page_offset = int(request.GET.get("page", "1"))
        paginator = Paginator(res, limit)
        if page_offset > paginator.num_pages:
            page_offset = paginator.num_pages
        page = paginator.page(page_offset)

        paginated_res = {
            "count": paginator.count,
            "results": page.object_list,
            "has_next": page.has_next(),
            "has_previous": page.has_previous(),
            "page": page_offset,
            "pages": paginator.num_pages,
            "limit": limit,
        }

        return Response(paginated_res)
