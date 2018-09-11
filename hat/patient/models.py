from django.db import models
from hat.geo.models import Village
from hat.cases.models import Case
from hat.sync.models import VideoUpload, ImageUpload
from hat.constants import TEST_TYPE_CHOICES, TYPES_WITH_VIDEOS, TYPES_WITH_IMAGES


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
    type = models.TextField("Type", choices=TEST_TYPE_CHOICES)
    note = models.TextField("Note", null=True, blank=True)
    date = models.DateTimeField(null=True, blank=True)
    result = models.IntegerField(choices=Case.GENERAL_TEST_RESULT_CHOICES, null=True, blank=True)
    index = models.IntegerField(null=True, blank=True)
    team = models.ForeignKey("users.Team", null=True, blank=True, on_delete=models.CASCADE)
    village = models.ForeignKey(Village, null=True, on_delete=models.CASCADE)
    form = models.ForeignKey(Case, on_delete=models.CASCADE)
    image_filename = models.TextField("Filename for image/picture", null=True, blank=True)
    image = models.ForeignKey(ImageUpload, blank=True, null=True, on_delete=models.CASCADE)
    video_filename = models.TextField("Filename for video", null=True, blank=True)
    video = models.ForeignKey(VideoUpload, blank=True, null=True, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "%s %s %s %s " % (self.type, self.index, self.date, self.created_at)

    def to_dict(self):
        res = {
            "id": self.id,
            "type": self.type,
            "index": self.index,
        }

        if self.type in TYPES_WITH_IMAGES:
            if self.image:
                res['image'] = self.image.image.url
                res['group_id'] = self.image.participant_uuid

        if self.type in TYPES_WITH_VIDEOS:
            if self.video:
                res['video'] = self.video.video.url
                res['group_id'] = self.video.participant_uuid

        return res


class TestGroup(models.Model):
    type = models.TextField()
    tests = models.ManyToManyField(Test)
    group_id = models.TextField(db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "%s - %s - %s" % (self.type, self.group_id, self.created_at)


