from django.db import models


class Province(models.Model):
    name = models.CharField(max_length=255)
    old_name = models.CharField(max_length=255)

    def __str__(self):
        return self.name


class ZS(models.Model):
    name = models.CharField(max_length=255)
    province = models.ForeignKey(Province)

    def __str__(self):
        return self.name

    class Meta():
        verbose_name_plural = "ZS"

class AS(models.Model):
    name = models.CharField(max_length=255)
    ZS = models.ForeignKey(ZS)

    class Meta():
        verbose_name_plural = "AS"

    def __str__(self):
        return self.name



class Village(models.Model):
    name = models.CharField(max_length=255)
    AS = models.ForeignKey(AS)

    name_alt = models.TextField(null=True)
    village_type = models.TextField(null=True)
    VILLAGE_OFFICIAL_CHOICES = (
        ('YES', 'Villages from Z.S.'),
        ('NO', 'Villages not from Z.S.'),
        ('OTHER', 'Locations where people are found during campaigns'),
        ('NA', 'Villages from satellite (unknown)'),
    )
    village_official = models.TextField(choices=VILLAGE_OFFICIAL_CHOICES, null=True)

    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True)
    gps_source = models.TextField(null=True)

    population = models.PositiveIntegerField(null=True)
    population_source = models.TextField(null=True)
    population_year = models.PositiveIntegerField(null=True)

    def __str__(self):
        return self.name

