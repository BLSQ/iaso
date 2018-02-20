from django.db import models
from hat.geo.models import Village
from hat.cases.models import Case
from hat.sync.models import VideoUpload, ImageUpload


class Patient(models.Model):
    post_name = models.TextField("Postnom", null=True)
    last_name = models.TextField("Nom de famille", null=True)
    first_name = models.TextField("Prénom", null=True)

    SEX_CHOICES = (
        ('female', 'Femme'),
        ('male', 'Homme'),
    )
    sex = models.TextField("Sexe", choices=SEX_CHOICES, null=True)
    age = models.PositiveSmallIntegerField("Age", null=True, blank=True)
    year_of_birth = models.PositiveSmallIntegerField("Année de naissance", null=True, blank=True)
    mothers_surname = models.TextField("Nom de la mère", null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "%s %s %s " % (self.first_name, self.post_name, self.last_name)


class Test(models.Model):
    TEST_TYPE_CHOICES = (
        ('CATT', 'CATT'),
        ('PG', 'PG'),
        ('ctcwoo', 'ctcwoo'),
        ('maect', 'maect')
    )

    type = models.TextField("Type", choices=TEST_TYPE_CHOICES)
    note = models.TextField("Note", null=True, blank=True)
    date = models.DateTimeField(null=True, blank=True)
    result = models.IntegerField(choices=Case.GENERAL_TEST_RESULT_CHOICES, null=True, blank=True)
    village = models.ForeignKey(Village, null=True)
    form = models.ForeignKey(Case)
    images = models.ManyToManyField(ImageUpload)
    videos = models.ManyToManyField(VideoUpload)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "%s %s %s " % (self.type, self.date, self.created_at)



