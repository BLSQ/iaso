from hat.geo.models import ZS, AS, Village


def get_single_zone(name):
    zones = ZS.objects.filter(name__iexact=name)
    zone = None
    if zones.count() == 1:
        zone = zones[0]

    if not zone:
        a_zones = ZS.objects.filter(aliases__contains=[name])
        if a_zones.count() == 1:
            zone = a_zones[0]

    return zone


def get_single_area(name, zone):
    areas = AS.objects.filter(name__iexact=name, ZS=zone)
    area = None
    if areas.count() == 1:
        area = areas[0]

    if not area:
        a_areas = ZS.objects.filter(aliases__contains=[name])
        if a_areas.count() == 1:
            area = a_areas[0]

    return area


def get_single_village(name, area):
    villages = Village.objects.filter(name__iexact=name, AS=area)
    village = None
    if villages.count() == 1:
        village = villages[0]

    if not village:
        a_villages = Village.objects.filter(aliases__contains=[name])
        if a_villages.count() == 1:
            village = a_villages[0]

    return village
