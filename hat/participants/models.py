from django.db import models


class HatParticipant(models.Model):
    # To generate the id, we currently md5 hash the
    # complete row from the historic import.
    document_id = models.CharField(max_length=32, unique=True)
    document_date = models.DateTimeField(null=True)
    entry_date = models.DateTimeField(null=True)
    hat_id = models.CharField(max_length=64)

    name = models.CharField(max_length=128, null=True)
    lastname = models.CharField(max_length=128, null=True)
    prename = models.CharField(max_length=128, null=True)
    SEX_CHOICES = (
        ('female', 'Female'),
        ('male', 'Male'),
        ('unknown', 'Unknown'),
    )
    sex = models.CharField(max_length=16, choices=SEX_CHOICES)
    age = models.PositiveSmallIntegerField(null=True)
    year_of_birth = models.PositiveSmallIntegerField(null=True)
    mothers_surname = models.CharField(max_length=128, null=True)

    village = models.CharField(max_length=64, null=True)
    province = models.CharField(max_length=64, null=True)
    ZS = models.CharField(max_length=64, null=True)
    AZ = models.CharField(max_length=64, null=True)

    mobile_unit = models.CharField(max_length=128, null=True)
    treatment_center = models.CharField(max_length=128, null=True)

    RESULT_CHOICES = (
        ('negative', 'Negative'),
        ('positive', 'Positive'),
        ('unknown', 'Unknown')
    )
    screening_test_result = models.CharField(max_length=16, choices=RESULT_CHOICES)
    confirmation_test_result = models.CharField(max_length=16, choices=RESULT_CHOICES)
    PL_TEST_RESULT_CHOICES = (
        ('none', 'None'),
        ('stage1', 'Stage1'),
        ('stage2', 'Stage2'),
        ('unknown', 'Unknown')
    )
    PL_test_result = models.CharField(max_length=16, choices=PL_TEST_RESULT_CHOICES)

    class Meta:
        permissions = (
            ("import_mdb", "Can import mdb files"),
            ("export_full", "Can export the full dataset as csv"),
            ("export_anon", "Can export anonymized data as csv"),
        )
