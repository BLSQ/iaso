import json

from django.contrib.gis.db import models as gis_models
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.db.models import Q, CASCADE, TextField
from django.contrib.postgres import fields as contrib

from hat.cases.models import Case
from hat.constants import TEST_TYPE_CHOICES, TYPES_WITH_VIDEOS, TYPES_WITH_IMAGES, GPS_SRID
from hat.geo.models import Village, AS
from hat.sync.models import VideoUpload, ImageUpload
from hat.common.utils import ANONYMOUS_PLACEHOLDER
from hat.users.middleware import get_current_user


class Patient(models.Model):
    post_name = contrib.CITextField("Postnom", null=True)
    last_name = contrib.CITextField("Nom de famille", null=True)
    first_name = contrib.CITextField("Prénom", null=True)

    SEX_CHOICES = (
        ('female', 'Femme'),
        ('male', 'Homme'),
    )
    sex = models.TextField("Sexe", choices=SEX_CHOICES, null=True)
    age = models.PositiveSmallIntegerField("Age", null=True, blank=True)
    year_of_birth = models.PositiveSmallIntegerField("Année de naissance", null=True, blank=True, db_index=True)
    mothers_surname = contrib.CITextField("Nom de la mère", null=True)
    # Origin area/village is the normalized test location for residents and origin location for travellers
    origin_area = models.ForeignKey(AS, null=True, on_delete=models.CASCADE)
    origin_village = models.ForeignKey(Village, null=True, on_delete=models.CASCADE)
    # Raw location names when not yet normalized. Exclusive with the above IDs
    origin_raw_village = models.TextField(null=True, blank=True, db_index=True)
    origin_raw_AS = models.TextField(null=True, blank=True, db_index=True)
    origin_raw_ZS = models.TextField(null=True, blank=True, db_index=True)
    dead = models.BooleanField(default=False)
    death_date = models.DateField(null=True, blank=True)
    death_device = models.ForeignKey("sync.DeviceDB", null=True, blank=True, on_delete=CASCADE)
    death_location = gis_models.PointField(srid=GPS_SRID, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "%s %s %s " % (self.first_name, self.post_name, self.last_name)

    def as_dict(self, additional_fields=None):
        user = get_current_user()
        is_anonymised = user.has_perm("menupermissions.x_anonymous") and not user.is_superuser
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
        result = {
            "id": self.id,
            "post_name": self.post_name if not is_anonymised else ANONYMOUS_PLACEHOLDER,
            "last_name": self.last_name if not is_anonymised else ANONYMOUS_PLACEHOLDER,
            "first_name": self.first_name if not is_anonymised else ANONYMOUS_PLACEHOLDER,
            "sex": self.sex,
            "age": self.age,
            "year_of_birth": self.year_of_birth,
            "mothers_surname": self.mothers_surname if not is_anonymised else ANONYMOUS_PLACEHOLDER,
            "province": province,
            "ZS": ZS,
            "AS": AS,
            "village": village,
            "dead": self.dead,
            "death_date": self.death_date,
        }

        # include fields that were added through annotate
        if additional_fields:
            for field in additional_fields:
                if hasattr(self, field):
                    result[field] = getattr(self, field)

        return result

    def as_full_dict(self):
        user = get_current_user()
        is_anonymised = user.has_perm("menupermissions.x_anonymous") and not user.is_superuser
        cases = []
        tests = []
        for case in self.case_set.all():
            cases.append(case.as_dict(True))
            for test in case.test_set.all():
                tests.append(test.to_dict())
        similar_patients = []
        for pair in PatientDuplicatesPair.objects.filter(Q(patient1_id=self.id) | Q(patient2_id=self.id)):
            if pair.patient1_id != self.id:
                duplicate_patient = pair.patient1.as_dict()
            else:
                duplicate_patient = pair.patient2.as_dict()
            duplicate_patient['duplicateId'] = pair.id
            similar_patients.append(duplicate_patient)
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

        if self.dead:
            death = {
                "dead": self.dead,
                "death_date": self.death_date,
                "location": json.loads(self.death_location.geojson),
                "device": self.death_device.as_dict() if self.death_device else None,
            }
        else:
            death = {
                "dead": self.dead
            }

        return {
            "id": self.id,
            "post_name": self.post_name if not is_anonymised else ANONYMOUS_PLACEHOLDER,
            "last_name": self.last_name if not is_anonymised else ANONYMOUS_PLACEHOLDER,
            "first_name": self.first_name if not is_anonymised else ANONYMOUS_PLACEHOLDER,
            "sex": self.sex,
            "age": self.age,
            "year_of_birth": self.year_of_birth,
            "mothers_surname": self.mothers_surname if not is_anonymised else ANONYMOUS_PLACEHOLDER,
            "origin_area": self.origin_area.as_dict() if self.origin_area else None,
            "cases": cases,
            "tests": tests,
            "similar_patients": similar_patients,
            "province": province,
            "ZS": ZS,
            "AS": AS,
            "village": village,
            "death": death,
            "treatments": [t.as_dict() for t in self.treatment_set.all()]
        }


class Test(models.Model):
    type = models.TextField("Type", choices=TEST_TYPE_CHOICES)
    note = models.TextField("Note", null=True, blank=True)
    date = models.DateTimeField(null=True, blank=True)
    result = models.IntegerField(choices=Case.GENERAL_TEST_RESULT_CHOICES, null=True, blank=True)
    index = models.IntegerField(null=True, blank=True)
    team = models.ForeignKey("users.Team", null=True, blank=True, on_delete=models.CASCADE)
    village = models.ForeignKey(Village, null=True, on_delete=models.CASCADE)
    traveller_area = models.ForeignKey(AS, null=True, blank=True, on_delete=models.CASCADE)
    form = models.ForeignKey(Case, on_delete=models.CASCADE)
    image_filename = models.TextField("Filename for image/picture", null=True, blank=True)
    image = models.ForeignKey(ImageUpload, blank=True, null=True, on_delete=models.CASCADE)
    video_filename = models.TextField("Filename for video", null=True, blank=True)
    video = models.ForeignKey(VideoUpload, blank=True, null=True, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    hidden = models.BooleanField(default=False)

    def __str__(self):
        return "%s %s %s %s " % (self.type, self.index, self.date, self.created_at)

    def to_dict(self):
        res = {
            "id": self.id,
            "type": self.type,
            "index": self.index,
            "result": self.result,
            "date": self.date,
            "hidden": self.hidden,
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


class Treatment(models.Model):
    MED_NONE = 'none'
    MED_PENTAMIDINE = 'pentamidine'
    MED_MELARSOPROL = 'melarsoprol'
    MED_EFLORNITHINE = 'eflornithine'
    MED_NECT = 'nect'
    MED_FEXINIDAZOLE = 'fexinidazole'
    MED_OXABOROLE = 'oxaborole'
    MED_CHOICES = (
        (MED_NONE, 'Aucun'),
        (MED_PENTAMIDINE, 'Pentamidine'),
        (MED_MELARSOPROL, 'Melarsoprol'),
        (MED_EFLORNITHINE, 'Eflornithine'),
        (MED_NECT, 'NECT'),
        (MED_FEXINIDAZOLE, 'Fexinidazole'),
        (MED_OXABOROLE, 'Oxaborole')
    )

    ISSUE_VOMITING = 'vomiting'
    ISSUE_DIARRHEA = 'diarrhea'
    ISSUE_DISORIENTATION = 'desorientation' # typo in document
    ISSUE_OBNUBILATION = 'obnubilation'
    ISSUE_BEHAVIOUR = 'behaviour'
    ISSUE_COMA = 'coma'
    ISSUE_NEURO = 'neuro'
    ISSUE_CONVULSION = 'convulsion'
    ISSUE_SEPTICEMY = 'septicemy'
    ISSUE_ACUTE_RESPIRATORY_FAILURE = 'acute respiratory failure'
    ISSUE_OTHERS = 'other'
    ISSUE_CHOICES=(
        (ISSUE_VOMITING, 'vomiting'),
        (ISSUE_DIARRHEA, 'diarrhea'),
        (ISSUE_DISORIENTATION, 'desorientation'),  # typo in document
        (ISSUE_OBNUBILATION, 'obnubilation'),
        (ISSUE_BEHAVIOUR, 'behaviour'),
        (ISSUE_COMA, 'coma'),
        (ISSUE_NEURO, 'neuro'),
        (ISSUE_CONVULSION, 'convulsion'),
        (ISSUE_SEPTICEMY, 'septicemy'),
        (ISSUE_ACUTE_RESPIRATORY_FAILURE, 'acute respiratory failure'),
        (ISSUE_OTHERS, 'other'),
    )

    INCOMPLETE_REASON_OUTOFSTOCK = 'outofstock'
    INCOMPLETE_REASON_ABANDON = 'abandon'
    INCOMPLETE_REASON_DEATH = 'death'
    INCOMPLETE_REASON_PATIENTINCAPACITY = 'patientincapacity'
    INCOMPLETE_REASON_CHOICES = (
        ('outofstock', 'rupture de stock'),
        ('abandon', 'abandon'),
        ('death', 'décès'),
        ('patientincapacity', 'incapacité du patient')
    )

    DEATH_MOMENT_BEFORE = 'before'
    DEATH_MOMENT_DURING = 'during'
    DEATH_MOMENT_AFTER = 'after'
    DEATH_MOMENT_CHOICES = (
        ('before', 'Avant traitement'),
        ('during', 'Pendant traitement'),
        ('after', 'Après traitement')
    )
    patient = models.ForeignKey(to=Patient, on_delete=CASCADE)
    index = models.IntegerField()
    medicine = models.TextField(choices=MED_CHOICES)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    entry_date = models.DateTimeField(null=True, blank=True)
    adverse_effects = models.NullBooleanField()
    dead = models.NullBooleanField()
    lost = models.NullBooleanField()
    success = models.NullBooleanField()
    complete = models.NullBooleanField()
    event = models.NullBooleanField()
    issues = ArrayField(
        TextField(max_length=255, blank=True, choices=ISSUE_CHOICES),
        null=True,
        blank=True,
    )
    other_issues = models.TextField(null=True, blank=True)
    location = gis_models.PointField(srid=GPS_SRID, null=True)
    incomplete_reasons = ArrayField(
        TextField(max_length=255, blank=True, choices=INCOMPLETE_REASON_CHOICES),
        null=True,
        blank=True,
    )
    device = models.ForeignKey("sync.DeviceDB", on_delete=CASCADE)
    death_moment = models.TextField(null=True, blank=True, choices=DEATH_MOMENT_CHOICES)

    def __str__(self):
        return f"id={self.id} patient=[{self.patient}] {self.index} {self.medicine} {self.start_date}→{self.end_date}"

    def as_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "index": self.index,
            "medicine": self.medicine,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "entry_date": self.entry_date,
            "adverse_effects": self.adverse_effects,
            "issues": self.issues,
            "otherIssues": self.other_issues,
            "event": self.event,
            "incomplete_reasons": self.incomplete_reasons,
            "location": json.loads(self.location.geojson),
            "device": self.device.as_dict() if self.device else None,
            "death_moment": self.death_moment,
            "complete": self.complete,
            "success": self.success,
            "lost": self.lost,
        }


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
        unique_together = (('patient1', 'patient2', 'algorithm'),)
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
