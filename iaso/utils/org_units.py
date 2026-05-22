from django.db.models import Q

from iaso.models.org_unit import OrgUnit


def get_valid_org_units_with_geography(account):
    return (
        OrgUnit.objects.filter(version=account.default_version)
        .filter(validation_status=OrgUnit.VALIDATION_VALID)
        .filter(Q(location__isnull=False) | Q(simplified_geom__isnull=False))
    )
