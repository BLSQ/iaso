from django.contrib.postgres.fields import ArrayField
from django.db import models


class Province(models.Model):
    name = models.CharField(max_length=255)
    old_name = models.CharField(max_length=255)
    aliases = ArrayField(
        models.TextField(max_length=255, blank=True),
        size=4,
        null=True,
        blank=True,
    )

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
        models.TextField(max_length=255, blank=True),
        size=4,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name

    class Meta():
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
        models.TextField(max_length=255, blank=True),
        size=4,
        null=True,
        blank=True,
    )

    class Meta():
        verbose_name_plural = "AS"

    def __str__(self):
        return "%s - (Zone: %s)" % (self.name, self.ZS.name)

    def as_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "zs_id": self.ZS_id
        }


class Village(models.Model):
    name = models.CharField(max_length=255)
    AS = models.ForeignKey(AS, on_delete=models.CASCADE)
    aliases = ArrayField(
        models.TextField(max_length=255, blank=True),
        size=4,
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
    village_source = models.TextField(max_length=255, null=True, blank=True)

    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True)
    gps_source = models.TextField(null=True)

    population = models.PositiveIntegerField(null=True)
    population_source = models.TextField(null=True)
    population_year = models.PositiveIntegerField(null=True)

    def __str__(self):
        return self.name


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
