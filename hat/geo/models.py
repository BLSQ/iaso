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


class AS(models.Model):
    name = models.CharField(max_length=255)
    ZS = models.ForeignKey(ZS)

    def __str__(self):
        return self.name


class Village(models.Model):
    name = models.CharField(max_length=255)
    AS = models.ForeignKey(AS)

    def __str__(self):
        return self.name

