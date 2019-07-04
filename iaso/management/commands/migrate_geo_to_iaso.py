from django.core.management.base import BaseCommand

from hat.geo.models import Province, ZS, AS, HealthStructure
from iaso.models import OrgUnit, OrgUnitType


from datetime import datetime

date_format = "%m/%d/%y"


def c(s):
    if s.strip() == "":
        return None
    return s


def copy_to_org_unit(obj, geo_type):
    org_unit = OrgUnit()
    org_unit.org_unit_type = geo_type
    org_unit.name = obj.name
    org_unit.aliases = obj.aliases
    org_unit.source = obj.source
    org_unit.source_ref = obj.source_ref
    org_unit.geom = obj.geom
    org_unit.geom_source = obj.geom_source
    org_unit.simplified_geom = obj.simplified_geom
    org_unit.geom_ref = obj.geom_ref

    return org_unit


class Command(BaseCommand):
    help = "Province"

    def handle(self, *args, **options):

        province_type, created = OrgUnitType.objects.get_or_create(
            name="Province", short_name="Prov"
        )

        zs_type, created = OrgUnitType.objects.get_or_create(
            name="Zone de santé", short_name="ZS"
        )

        as_type, created = OrgUnitType.objects.get_or_create(
            name="Aire de santé", short_name="AS"
        )

        hospital_type, created = OrgUnitType.objects.get_or_create(
            name="Hôpital", short_name="Hosp."
        )

        center_type, created = OrgUnitType.objects.get_or_create(
            name="Centre de Santé", short_name="CDS"
        )

        ssc_type, created = OrgUnitType.objects.get_or_create(
            name="Site de santé communautaire", short_name="SSC"
        )

        OrgUnit.objects.all().delete()
        provinces = Province.objects.all()
        province_id_dict = {}
        for province in provinces:
            print("p: ", province)
            org_unit = copy_to_org_unit(province, province_type)
            org_unit.save()
            province_id_dict[province.id] = org_unit.id

        zones = ZS.objects.all()
        zone_id_dict = {}
        for zone in zones:
            print("z: ", zone)
            org_unit = copy_to_org_unit(zone, zs_type)
            org_unit.parent_id = province_id_dict[zone.province_id]
            org_unit.save()
            zone_id_dict[zone.id] = org_unit.id

        areas = AS.objects.all()
        area_id_dict = {}
        for area in areas:
            print("a: ", area)
            org_unit = copy_to_org_unit(area, as_type)
            org_unit.parent_id = zone_id_dict[area.ZS_id]
            org_unit.save()
            area_id_dict[area.id] = org_unit.id

        for structure in HealthStructure.objects.all():
            print("s: ", structure)
            org_unit = OrgUnit()
            org_unit.org_unit_type = center_type
            org_unit.name = structure.name
            org_unit.parent_id = area_id_dict[structure.AS_id]
            org_unit.source = structure.source
            org_unit.source_ref = structure.source_ref
            org_unit.location = structure.location
            org_unit.save()
