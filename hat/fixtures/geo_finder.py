from django.db.models import Q

from hat.geo.models import ZS, AS, Village


class MultipleMatchesFoundException(Exception):
    pass


def get_single_zone(name):
    zones = get_zones_by_name_or_alias(name)
    zone = None
    if zones.count() == 1:
        zone = zones[0]
    elif zones.count() > 1:
        # This should not happen
        raise MultipleMatchesFoundException()

    return zone


def get_zones_by_name_or_alias(name):
    return ZS.objects.filter(Q(name__iexact=name) | Q(aliases__contains=[name]))


def get_single_area(name, zone=None):
    areas = get_areas_by_name_or_alias(name, [zone])
    area = None
    if areas.count() == 1:
        area = areas[0]
    elif areas.count() > 1:
        raise MultipleMatchesFoundException()

    return area


def get_areas_by_name_or_alias(name, zones=None):
    areas = AS.objects.filter(Q(name__iexact=name) | Q(aliases__contains=[name]))
    if zones is not None:
        areas = areas.filter(ZS__in=zones)

    return areas


def get_single_village(name, areas, official=None):
    try:
        villages = Village.objects.filter(Q(name__iexact=name) | Q(aliases__contains=[name]), AS__in=areas)
        if official is not None:
            villages = villages.filter(village_official=official)
    except ValueError as ve:
        print("value error", ve)
        print("value error2", type(areas), "--", areas)
        print("value error3", name)
        exit(1)

    village = None
    if villages.count() == 1:
        village = villages[0]
    elif villages.count() > 1:
        raise MultipleMatchesFoundException()

    return village
