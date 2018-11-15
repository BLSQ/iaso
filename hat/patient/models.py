from django.db import models
from django.db.models import Q

from hat.cases.models import Case
from hat.constants import TEST_TYPE_CHOICES, TYPES_WITH_VIDEOS, TYPES_WITH_IMAGES
from hat.geo.models import Village, AS
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
    year_of_birth = models.PositiveSmallIntegerField("Année de naissance", null=True, blank=True, db_index=True)
    mothers_surname = models.TextField("Nom de la mère", null=True)
    origin_area = models.ForeignKey(AS, null=True, on_delete=models.CASCADE)
    origin_village = models.ForeignKey(Village, null=True, on_delete=models.CASCADE)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "%s %s %s " % (self.first_name, self.post_name, self.last_name)

    def as_dict(self):
        AS = None
        ZS = None
        province = None
        if self.origin_area:
            AS = self.origin_area.name
            ZS = self.origin_area.ZS.name
            province = self.origin_area.ZS.province.name
        village = None
        if self.origin_village:
            village = self.origin_village.name
        return {
            "id": self.id,
            "post_name": self.post_name,
            "last_name": self.last_name,
            "first_name": self.first_name,
            "sex": self.sex,
            "age": self.age,
            "mothers_surname": self.mothers_surname,
            "province": province,
            "ZS": ZS,
            "AS": AS,
            "village": village
        }

    def as_full_dict(self):
        cases = []
        tests = []
        for case in self.case_set.all():
            cases.append(case.as_dict())
            for test in case.test_set.all():
                tests.append(test.to_dict())

        similar_patients = [pair.patient1.as_dict() if pair.patient1_id != self.id else pair.patient2.as_dict()
                            for pair in
                            PatientDuplicatesPair.objects.filter(Q(patient1_id=self.id) | Q(patient2_id=self.id))]

        return {
            "id": self.id,
            "post_name": self.post_name,
            "last_name": self.last_name,
            "first_name": self.first_name,
            "sex": self.sex,
            "year_of_birth": self.year_of_birth,
            "mothers_surname": self.mothers_surname,
            "origin_area": self.origin_area.as_dict() if self.origin_area else None,
            "cases": cases,
            "tests": tests,
            "similar_patients": similar_patients,
        }


class Test(models.Model):
    type = models.TextField("Type", choices=TEST_TYPE_CHOICES)
    note = models.TextField("Note", null=True, blank=True)
    date = models.DateTimeField(null=True, blank=True)
    result = models.IntegerField(choices=Case.GENERAL_TEST_RESULT_CHOICES, null=True, blank=True)
    index = models.IntegerField(null=True, blank=True)
    team = models.ForeignKey("users.Team", null=True, blank=True, on_delete=models.CASCADE)
    village = models.ForeignKey(Village, null=True, on_delete=models.CASCADE)
    traveller_area = models.ForeignKey(AS, null=True, on_delete=models.CASCADE)
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
            "result": self.result,
            "date": self.date,
        }

        if self.type in TYPES_WITH_IMAGES:
            if self.image_filename:
                res['image_filename'] = self.image_filename
            if self.image:
                res['image'] = self.image.image.url
                res['group_id'] = self.image.participant_uuid

        if self.type in TYPES_WITH_VIDEOS:
            if self.video_filename:
                res['video_filename'] = self.video_filename
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


class PatientDuplicatesPair(models.Model):
    """
    Potential duplicate patients. Duplicate candidates have multiple origins, including:
        - Exact location similarity
            - Same normalized_village
            - Similar, first name, last name, post name, mother's name
        - Geographic distance similarity
            - normalized_village is within x km of a similar name
        - Data permutations
            - tight match where the first name is switched with last name or post name
        - Historical data Form Number and similar ids matching
            - similar names and team/form numbers
            - similar names and obviously incorrect form numbers

    **Permissions**

    - **reconcile_duplicates** -- Can reconcile duplicates.

    """

    patient1 = models.ForeignKey('patient.Patient', on_delete=models.CASCADE, related_name='+', db_index=True)
    patient2 = models.ForeignKey('patient.Patient', on_delete=models.CASCADE, related_name='+', db_index=True)
    similarity_score = models.SmallIntegerField(null=True)
    algorithm = models.CharField(max_length=10)

    def save(self, *args, **kwargs) -> None:
        if self.patient1_id > self.patient2_id:
            super(PatientDuplicatesPair, self).save(*args, **kwargs)
        else:
            raise Exception("Patient1's id MUST always be greater than patient2's id")

    class Meta:
        unique_together = (('patient1', 'patient2'),)
        permissions = (
            ('reconcile_duplicates', 'Can reconcile duplicates'),
        )

    def as_dict(self, full=False):
        return {
            'id': self.id,
            'patient1': self.patient1.as_dict() if full else {'id': self.patient1_id},
            'patient2': self.patient2.as_dict() if full else {'id': self.patient2_id},
            'similarity_score': self.similarity_score,
            'algorithm': self.algorithm,
        }

    def __str__(self):
        return "%s: %s > %s" % (self.id, self.patient1_id, self.patient2_id)


class PatientIgnoredPair(models.Model):
    """
    This table tracks all duplicates pairs that have been found not to be actual matches.
    When the process for finding duplicates reruns, we don't want any previously ignored
    pairs to show up again and need to keep track of them. The pairs are tracked by the
    ``document_id``, so that they are not dependent on the table instance.

    :ivar fk patient1: Patient 1
    :ivar fk patient2: Patient 2
    :ivar text algorithm: The algorithm that generated the excluded pair, will affect all other algorithms too

    """
    patient1 = models.ForeignKey('patient.Patient', on_delete=models.CASCADE, related_name='+', db_index=True)
    patient2 = models.ForeignKey('patient.Patient', on_delete=models.CASCADE, related_name='+', db_index=True)
    algorithm = models.CharField(max_length=10)  # Only for information, the pair will be ignored with all algorithms
    ignored_by = models.ForeignKey('auth.User', on_delete=models.DO_NOTHING, related_name='+')

    class Meta:
        unique_together = (('patient1', 'patient2'),)

    def __str__(self):
        return "%s - %s" % (self.patient1_id, self.patient2_id)

    def as_dict(self, full=False):
        return {
            'id': self.id,
            'patient1': self.patient1.as_dict() if full else {'id': self.patient1_id},
            'patient2': self.patient2.as_dict() if full else {'id': self.patient2_id},
            'algorithm': self.algorithm,
            'ignore': True,
        }


class PatientDuplicatesView(models.Model):
    """
    This view groups all the various search algorithms for patient duplicates identification.

    You should never query the whole table at once as it would take forever, one should apply filter on specific IDs
    """
    # Django forces us to name a primary key and doesn't support composite keys. This is a read only view, we don't care
    patient1 = models.ForeignKey('patient.Patient', on_delete=models.DO_NOTHING, related_name='+')
    patient2 = models.ForeignKey('patient.Patient', on_delete=models.DO_NOTHING, related_name='+')
    similarity_score = models.SmallIntegerField(null=True)
    algorithm = models.CharField(max_length=10, primary_key=True)

    class Meta:
        managed = False
        db_table = 'patient_matching_all'

    def as_dict(self):
        return {
            'patient1_id': self.patient1_id,
            'patient2_id': self.patient2_id,
            'similarity_score': self.similarity_score,
            'algorithm': self.algorithm,
        }
