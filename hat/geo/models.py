from django.contrib.postgres.fields import ArrayField, CITextField
from django.contrib.gis.db.models.fields import MultiPolygonField, PointField
from django.db import models

from django.shortcuts import get_object_or_404

GEO_SOURCE_CHOICES = (
    ('snis', 'SNIS'),
    ('ucla', 'UCLA'),
    ('pnltha', 'PNL THA'),
    ('derivated', 'Derivated from actual data'),
)

VILLAGE_SOURCE_CHOICES = (
    ("device", 'Tablettes'),
    ("ucla", "UCLA"),
    ("manual", "Ajouté par un utilisateur")
)

class Province(models.Model):
    name = models.CharField(max_length=255)
    old_name = models.CharField(max_length=255)
    aliases = ArrayField(
        CITextField(max_length=255, blank=True),
        size=10,
        null=True,
        blank=True,
    )

    source = models.TextField(choices=GEO_SOURCE_CHOICES, null=True)
    source_ref = models.TextField(null=True)
    geom = MultiPolygonField(srid=4326, null=True)
    geom_source = models.TextField(choices=GEO_SOURCE_CHOICES, null=True)
    geom_ref = models.IntegerField(null=True)

    def __str__(self):
        return self.name

    def as_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "old_name": self.old_name
        }


class ZS(models.Model):
    name = models.CharField(max_length=255)
    province = models.ForeignKey(Province, on_delete=models.CASCADE)
    aliases = ArrayField(
        CITextField(max_length=255, blank=True),
        size=10,
        null=True,
        blank=True,
    )

    source = models.TextField(choices=GEO_SOURCE_CHOICES, null=True, default='snis')
    source_ref = models.TextField(null=True)
    geom = MultiPolygonField(srid=4326, null=True)
    geom_source = models.TextField(choices=GEO_SOURCE_CHOICES, null=True)
    geom_ref = models.IntegerField(null=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "ZS"

    def as_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "province_id": self.province_id
        }


class AS(models.Model):
    name = models.CharField(max_length=255)
    ZS = models.ForeignKey(ZS, on_delete=models.CASCADE)
    aliases = ArrayField(
        CITextField(max_length=255, blank=True),
        size=10,
        null=True,
        blank=True,
    )

    source = models.TextField(choices=GEO_SOURCE_CHOICES, null=True)
    source_ref = models.TextField(null=True)
    geom = MultiPolygonField(srid=4326, null=True)
    geom_source = models.TextField(choices=GEO_SOURCE_CHOICES, null=True)
    geom_ref = models.IntegerField(null=True)

    class Meta:
        verbose_name_plural = "AS"

    def __str__(self):
        return "%s - (Zone: %s)" % (self.name, self.ZS.name)

    def as_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "zs_id": self.ZS_id,
            "province_id": self.ZS.province_id
        }


class Village(models.Model):
    name = models.CharField(max_length=255)
    AS = models.ForeignKey(AS, on_delete=models.CASCADE)
    aliases = ArrayField(
        CITextField(max_length=255, blank=True),
        size=10,
        null=True,
        blank=True,
    )

    name_alt = models.TextField(null=True)
    village_type = models.TextField(null=True)
    VILLAGE_OFFICIAL_CHOICES = (
        ('YES', 'Villages from Z.S.'),
        ('NO', 'Villages not from Z.S.'),
        ('OTHER', 'Locations where people are found during campaigns'),
        ('NA', 'Villages from satellite (unknown)'),
    )
    village_official = models.TextField(choices=VILLAGE_OFFICIAL_CHOICES, null=True)
    village_source = models.TextField(max_length=255, choices=VILLAGE_SOURCE_CHOICES,  null=True, blank=True)
    creator_device = models.ForeignKey("sync.DeviceDB", null=True, on_delete=models.SET_NULL)

    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True)
    gps_source = models.TextField(null=True)  # much more diverse than above GEO_SOURCE_CHOICES
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
