from django.db.models import Q

from hat.geo.models import ZS, AS, Village


class MultipleMatchesFoundException(Exception):
    pass


def name_or_alias(name):
    return Q(name__iexact=name) | Q(aliases__contains=[name])


def get_single_zone(name):
    zones = get_zones_by_name_or_alias(name)
    zone = None
    if zones.count() == 1:
        zone = zones[0]
    elif zones.count() > 1:
        # This should not happen
        raise MultipleMatchesFoundException()

    return zone


def get_zones_by_name_or_alias(name, provinces=None):
    zones = ZS.objects.filter(name_or_alias(name))
    if provinces is not None:
        zones = zones.filter(province__in=provinces)

    return zones


def get_single_area(name, zone=None):
    areas = get_areas_by_name_or_alias(name, [zone])
    area = None
    if areas.count() == 1:
        area = areas[0]
    elif areas.count() > 1:
        raise MultipleMatchesFoundException()

    return area


def get_areas_by_name_or_alias(name, zones=None):
    areas = AS.objects.filter(name_or_alias(name))
    if zones is not None:
        areas = areas.filter(ZS__in=zones)

    return areas


def get_areas_by_name(name, zones=None):
    areas = AS.objects.filter(name__iexact=name)
    if zones is not None:
        areas = areas.filter(ZS__in=zones)

    return areas


def get_single_village(name, areas, official=None):
    try:
        villages = Village.objects.filter(name_or_alias(name), AS__in=areas)
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


def get_single_as_and_village(zs_name, as_name, village_name) -> (AS, Village):
    """
    Find a matching village by its ZS, AS and village name. If there is a village match, AS and village will
    be returned. Otherwise, if a unique AS can be matched, it will be returned. In other cases, it will just return None
    """
    zone = get_single_zone(zs_name)
    if not zone:
        return None, None

    areas = get_areas_by_name_or_alias(as_name, [zone])
    if areas.count() == 0:
        return None, None

    try:
        village = get_single_village(village_name, areas)
        if village:
            return village.AS, village
        else:
            return (areas[0] if areas.count() == 1 else None), None
    except MultipleMatchesFoundException:
        return None, None
