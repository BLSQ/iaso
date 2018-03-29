from hat.geo.models import ZS, AS, Village


class MultipleMatchesFoundException(Exception):
    pass


def get_single_zone(name):
    zones = ZS.objects.filter(name__iexact=name)
    zone = None
    if zones.count() == 1:
        zone = zones[0]
    elif zones.count() > 1:
        # This should not happen
        raise MultipleMatchesFoundException()

    if not zone:
        a_zones = ZS.objects.filter(aliases__contains=[name])
        if a_zones.count() == 1:
            zone = a_zones[0]
        elif a_zones.count() > 1:
            raise MultipleMatchesFoundException()

    return zone


def get_single_area(name, zone=None):
    areas = AS.objects.filter(name__iexact=name)
    if zone is not None:
        areas = areas.filter(ZS=zone)
    area = None
    if areas.count() == 1:
        area = areas[0]
    elif areas.count() > 1:
        raise MultipleMatchesFoundException()

    if not area:
        a_areas = AS.objects.filter(aliases__contains=[name])
        if a_areas.count() == 1:
            area = a_areas[0]
        elif a_areas.count() > 1:
            raise MultipleMatchesFoundException()

    return area


def get_single_village(name, area):
    try:
        villages = Village.objects.filter(name__iexact=name, AS=area)
    except ValueError as ve:
        print("value error", ve)
        print("value error2", type(area), "--", area)
        print("value error3", name)
        exit(1)
    village = None
    if villages.count() == 1:
        village = villages[0]
    elif villages.count() > 1:
        raise MultipleMatchesFoundException()

    if not village:
        a_villages = Village.objects.filter(aliases__contains=[name])
        if a_villages.count() == 1:
            village = a_villages[0]
        elif a_villages.count() > 1:
            raise MultipleMatchesFoundException()

    return village
