from django.contrib.gis.db.models.fields import (
    MultiPolygonField,
    PointField,
    PolygonField,
)
from django.contrib.postgres.fields import ArrayField, CITextField
from django.db import models


GEO_SOURCE_CHOICES = (
    ("snis", "SNIS"),
    ("ucla", "UCLA"),
    ("pnltha", "PNL THA"),
    ("derivated", "Derivated from actual data"),
)

VILLAGE_SOURCE_CHOICES = (
    ("device", "Tablettes"),
    ("ucla", "UCLA"),
    ("manual", "Ajouté par un utilisateur"),
)

POPULATION_TYPE_CHOICES = (
    ("PTR", "Population Totale Recensée"),
    ("PTE", "Population Totale Estimée"),
)


class Province(models.Model):
    name = models.CharField(max_length=255)
    old_name = models.CharField(max_length=255)
    aliases = ArrayField(
        CITextField(max_length=255, blank=True), size=10, null=True, blank=True
    )

    source = models.TextField(choices=GEO_SOURCE_CHOICES, null=True)
    source_ref = models.TextField(null=True)
    geom = PolygonField(srid=4326, null=True)
    simplified_geom = PolygonField(srid=4326, null=True)
    geom_source = models.TextField(choices=GEO_SOURCE_CHOICES, null=True)
    geom_ref = models.IntegerField(null=True)

    def __str__(self):
        return self.name

    def as_dict(self):
        return {"id": self.id, "name": self.name, "old_name": self.old_name}


class ZS(models.Model):
    name = models.CharField(max_length=255)
    province = models.ForeignKey(Province, on_delete=models.CASCADE)
    aliases = ArrayField(
        CITextField(max_length=255, blank=True), size=10, null=True, blank=True
    )

    source = models.TextField(choices=GEO_SOURCE_CHOICES, null=True, default="snis")
    source_ref = models.TextField(null=True)
    geom = PolygonField(srid=4326, null=True)
    simplified_geom = PolygonField(srid=4326, null=True)
    geom_source = models.TextField(choices=GEO_SOURCE_CHOICES, null=True)
    geom_ref = models.IntegerField(null=True)
    is_erased = models.BooleanField(default=False)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "ZS"

    def as_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "province_id": self.province_id,
        }

    def as_full_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "province_id": self.province_id,
            "province__name": self.province.name,
            "aliases": self.aliases,
            "source": self.source,
            "has_shape": False if self.simplified_geom is None else True,
        }


class AS(models.Model):
    name = models.CharField(max_length=255)
    ZS = models.ForeignKey(ZS, on_delete=models.CASCADE)
    aliases = ArrayField(
        CITextField(max_length=255, blank=True), size=10, null=True, blank=True
    )

    source = models.TextField(choices=GEO_SOURCE_CHOICES, null=True)
    source_ref = models.TextField(null=True)
    geom = PolygonField(srid=4326, null=True)
    simplified_geom = PolygonField(srid=4326, null=True)
    geom_source = models.TextField(choices=GEO_SOURCE_CHOICES, null=True)
    geom_ref = models.IntegerField(null=True)
    is_erased = models.BooleanField(default=False)

    class Meta:
        verbose_name_plural = "AS"

    def __str__(self):
        return "%s - (Zone: %s)" % (self.name, self.ZS.name)

    def as_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "zs_id": self.ZS_id,
            "zs_name": self.ZS.name,
            "province_id": self.ZS.province_id,
            "province_name": self.ZS.province.name,
        }

    def as_full_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "ZS_id": self.ZS_id,
            "ZS__name": self.ZS.name,
            "ZS__province_id": self.ZS.province_id,
            "ZS__province__name": self.ZS.province.name,
            "aliases": self.aliases,
            "source": self.source,
            "has_shape": False if self.simplified_geom is None else True,
        }


class HealthStructure(models.Model):
    name = models.TextField()
    AS = models.ForeignKey(AS, on_delete=models.CASCADE)
    source = models.TextField(choices=GEO_SOURCE_CHOICES, null=True)
    source_ref = models.TextField(null=True)
    location = PointField(srid=4326, null=True)

    def __str__(self):
        return "%s - (Area: %s)" % (self.name, self.AS.name)

    def as_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "as_id": self.ZS_id,
            "as_name": self.ZS.name,
            "source": self.source,
            "source_ref": self.source_ref,
        }


class Village(models.Model):
    name = models.CharField(max_length=255)
    AS = models.ForeignKey(AS, on_delete=models.CASCADE)
    aliases = ArrayField(
        CITextField(max_length=255, blank=True), size=10, null=True, blank=True
    )

    name_alt = models.TextField(null=True)
    village_type = models.TextField(null=True)
    VILLAGE_OFFICIAL_CHOICES = (
        ("YES", "Villages from Z.S."),
        ("NO", "Villages not from Z.S."),
        ("OTHER", "Locations where people are found during campaigns"),
        ("NA", "Villages from satellite (unknown)"),
    )
    village_official = models.TextField(choices=VILLAGE_OFFICIAL_CHOICES, null=True)
    village_source = models.TextField(
        max_length=255, choices=VILLAGE_SOURCE_CHOICES, null=True, blank=True
    )
    creator_device = models.ForeignKey(
        "sync.DeviceDB", null=True, on_delete=models.SET_NULL
    )

    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True)
    gps_source = models.TextField(
        null=True
    )  # much more diverse than above GEO_SOURCE_CHOICES
    location = PointField(srid=4326, null=True)

    population = models.PositiveIntegerField(null=True)
    population_source = models.TextField(null=True)
    population_year = models.PositiveIntegerField(null=True)
    is_erased = models.BooleanField(default=False)

    def __str__(self):
        return self.name

    def as_dict(self):
        return {
            "name": self.name,
            "id": self.id,
            "longitude": self.longitude,
            "latitude": self.latitude,
            "population": self.population,
            "population_source": self.population_source,
            "population_year": self.population_year,
            "AS_id": self.AS_id,
            "AS_name": self.AS.name,
            "ZS_id": self.AS.ZS_id,
            "ZS_name": self.AS.ZS.name,
            "province_id": self.AS.ZS.province_id,
            "province_name": self.AS.ZS.province.name,
            "village_type": self.village_type,
            "village_official": self.village_official,
            "village_source": self.village_source,
            "gps_source": self.gps_source,
            "is_erased": self.is_erased,
            "aliases": self.aliases,
        }


class ZSASMappingImport(models.Model):
    file_name = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)


class ZSASMappingItem(models.Model):
    line = models.IntegerField()
    case_province = models.TextField(null=True, blank=True)
    case_zs = models.TextField(null=True, blank=True)
    case_as = models.TextField(null=True, blank=True)
    # The excel sheet has a count here but it's not useful to store it
    match_province = models.TextField(null=True, blank=True)
    match_zs = models.TextField(null=True, blank=True)
    match_as = models.TextField(null=True, blank=True)
    match_yesno = models.CharField(max_length=20, null=True, blank=True)
    match_comment = models.TextField(null=True, blank=True)
    zsas_import = models.ForeignKey(ZSASMappingImport, on_delete=models.CASCADE)
    added_zone_alias = models.BooleanField(default=False)
    added_area_alias = models.BooleanField(default=False)


class PopulationData(models.Model):
    village = models.ForeignKey(to=Village, on_delete=models.DO_NOTHING)
    population = models.IntegerField()
    type = models.TextField(choices=POPULATION_TYPE_CHOICES, default="PTR")
    source = models.TextField(
        default="device"
    )  # "device", "ucla" or other source (see Village population source)
    device = models.ForeignKey(
        to="sync.DeviceDB", on_delete=models.DO_NOTHING, null=True
    )
    population_year = models.IntegerField()
    report_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return "%s - %s -%s -%s" % (
            self.village.name,
            self.population,
            self.source,
            self.type,
        )


class GeopodeSettlement(models.Model):
    province_code = models.TextField(null=True, blank=True)
    province_name = models.TextField(null=True, blank=True)
    zone_code = models.TextField(null=True, blank=True)
    zone_name = models.TextField(null=True, blank=True)
    area_code = models.TextField(null=True, blank=True)
    area_name = models.TextField(null=True, blank=True)
    guid = models.TextField(null=True, blank=True)
    name = models.TextField(null=True, blank=True)
    type = models.TextField(null=True, blank=True)
    lat = models.TextField(null=True, blank=True)
    long = models.TextField(null=True, blank=True)
    location = PointField(srid=4326, null=True)
    pop_female = models.IntegerField(null=True, blank=True)
    pop_male = models.IntegerField(null=True, blank=True)
    pop_total = models.IntegerField(null=True, blank=True)
    normalized_zone = models.ForeignKey(
        to=ZS, null=True, blank=True, on_delete=models.DO_NOTHING
    )
    normalized_area = models.ForeignKey(
        to=AS, null=True, blank=True, on_delete=models.DO_NOTHING
    )
    normalized_village = models.ForeignKey(
        to=Village, null=True, blank=True, on_delete=models.DO_NOTHING
    )

    def __str__(self):
        return str(id)
