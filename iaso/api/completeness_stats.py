"""
The completeness stats API endpoint.

This endpoint is used to display the completeness stats in the dashboard. Completeness data is a list rows, each row
for a given form in a given orgunit.

This one is planned to become a "default" and be reused, not to be confused with the more specialized preexisting
completeness API.
"""
from django.db.models import Q

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


def get_instance_counters(ous_to_fill: "QuerySet[OrgUnit]", form_type: Form) -> "Tuple[int, int, str]":
    """Returns a dict such as (forms to fill counters, forms filled counters) with the number
    of instances to fill and filled for the given form type"""
    filled = ous_to_fill.filter(instance__form=form_type)
    return ous_to_fill.count(), filled.count()


class CompletenessStatsViewSet(viewsets.ViewSet):
    """Completeness Stats API"""

    permission_classes = [permissions.IsAuthenticated, HasPermission("menupermissions.iaso_completeness_stats")]  # type: ignore

    def list(self, request):
        order = request.GET.get("order", "name").split(",")
        org_unit_type_str = request.query_params.get("org_unit_type_id", None)

        requested_forms_str = request.query_params.get("form_id", None)
        requested_form_ids = requested_forms_str.split(",") if requested_forms_str is not None else []

        if org_unit_type_str is not None:
            org_unit_types = OrgUnitType.objects.filter(id__in=org_unit_type_str.split(","))
        else:
            org_unit_types = None

        requested_org_unit_id_str = request.GET.get("org_unit_id", None)

        if requested_org_unit_id_str is not None:
            requested_org_unit = OrgUnit.objects.get(id=requested_org_unit_id_str)
        else:
            requested_org_unit = None

        profile = request.user.iaso_profile

        # Forms to take into account: we take everything for the user's account, then filter by the form_ids if provided
        form_qs = Form.objects.filter_for_user_and_app_id(user=request.user)
        if requested_form_ids:
            form_qs = form_qs.filter(id__in=requested_form_ids)

        account = profile.account
        version = account.default_version

        org_units = OrgUnit.objects.filter(version=version).filter(
            validation_status="VALID"
        )  # don't forget to think about org unit status
        if requested_org_unit:
            org_units = org_units.hierarchy(requested_org_unit)

        top_ous = org_units

        # Filtering by org unit type
        if org_unit_types is not None:
            top_ous = top_ous.filter(org_unit_type__id__in=[o.id for o in org_unit_types])

        # Cutting the list, so we only keep the heads (top-level of the selection)
        if org_unit_types is None:
            # Normal case: we only keep the top-level org units
            top_ous = top_ous.exclude(parent__in=top_ous)
        else:
            # Edge case: if parent/children are selected because of the requested OU types, we need to keep the children
            top_ous = top_ous.exclude(Q(parent__in=top_ous) & ~Q(org_unit_type__id__in=[o.id for o in org_unit_types]))

        top_ous = top_ous.order_by(*order)

        res = []

        for row_ou in top_ous:
            for form in form_qs:
                form = Form.objects.get(id=form.id)

                ou_types_of_form = form.org_unit_types.all()

                # Instance counters for the row OU + all descendants
                ou_to_fill_with_descendants = org_units.filter(org_unit_type__in=ou_types_of_form).hierarchy(row_ou)
                ou_to_fill_with_descendants_count, ou_filled_with_descendants_count = get_instance_counters(
                    ou_to_fill_with_descendants, form
                )

                # Instance counters strictly/directly for the row OU
                ou_to_fill_direct = org_units.filter(org_unit_type__in=ou_types_of_form).filter(pk=row_ou.pk)
                ou_to_fill_direct_count, ou_filled_direct_count = get_instance_counters(ou_to_fill_direct, form)

                # TODO: response as serializer for Swagger

                parent_data = None
                if row_ou.parent is not None:
                    parent_data = (row_ou.parent.as_dict_for_completeness_stats(),)

                res.append(
                    {
                        "parent_org_unit": parent_data,
                        "org_unit_type": row_ou.org_unit_type.as_dict_for_completeness_stats(),
                        "org_unit": row_ou.as_dict_for_completeness_stats(),
                        "form": form.as_dict_for_completeness_stats(),
                        # Those counts target the row org unit and all of its descendants
                        "forms_filled": ou_filled_with_descendants_count,
                        "forms_to_fill": ou_to_fill_with_descendants_count,
                        "completeness_ratio": formatted_percentage(
                            part=ou_filled_with_descendants_count, total=ou_to_fill_with_descendants_count
                        ),
                        # Those counts strictly/directly target the row org unit (no descendants included)
                        "forms_filled_direct": ou_filled_direct_count,
                        "forms_to_fill_direct": ou_to_fill_direct_count,
                        "completeness_ratio_direct": formatted_percentage(
                            part=ou_filled_direct_count, total=ou_to_fill_direct_count
                        ),
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
