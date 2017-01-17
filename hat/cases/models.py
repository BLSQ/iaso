from django.db import models

SOURCE_CHOICES = (
    ('historic', 'Historic'),
    ('mobile_backup', 'Mobile backup'),
    ('pv', 'Pharmacovigilance'),
)

SEX_CHOICES = (
    ('female', 'Female'),
    ('male', 'Male'),
)


class Case(models.Model):
    source = models.TextField(choices=SOURCE_CHOICES, db_index=True, null=True)

    document_date = models.DateTimeField(db_index=True, null=True)
    # The id is currently a hash over the row to be able to
    # catch duplicates
    document_id = models.TextField(db_index=True)
    hat_id = models.TextField()
    entry_date = models.DateTimeField(null=True)
    entry_name = models.TextField(null=True)

    form_number = models.PositiveSmallIntegerField(null=True)
    form_year = models.PositiveSmallIntegerField(null=True)
    form_month = models.PositiveSmallIntegerField(null=True)

    name = models.TextField(null=True)
    lastname = models.TextField(null=True)
    prename = models.TextField(null=True)
    sex = models.TextField(choices=SEX_CHOICES, null=True)
    age = models.PositiveSmallIntegerField(null=True)
    year_of_birth = models.PositiveSmallIntegerField(null=True)
    mothers_surname = models.TextField(null=True)

    village = models.TextField(null=True)
    province = models.TextField(null=True)
    ZS = models.TextField(db_index=True, null=True)
    # TODO: Aires de santé acronym is misspelled and should be refactored into AS
    AZ = models.TextField(null=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True)

    mobile_unit = models.TextField(null=True)

    treatment_center = models.TextField(null=True)
    treatment_start_date = models.DateTimeField(null=True)
    treatment_end_date = models.DateTimeField(null=True)
    treatment_prescribed = models.TextField(null=True)
    treatment_secondary_effects = models.NullBooleanField()
    treatment_result = models.TextField(null=True)

    test_rdt = models.NullBooleanField(null=True)
    test_catt = models.NullBooleanField(null=True)
    test_maect = models.NullBooleanField(null=True)
    test_ge = models.NullBooleanField(null=True)
    test_pg = models.NullBooleanField(null=True)
    test_ctcwoo = models.NullBooleanField(null=True)
    test_pl = models.NullBooleanField(null=True)
    test_catt_dilution = models.TextField(null=True)
    test_lymph_node_puncture = models.NullBooleanField(null=True)
    test_sf = models.NullBooleanField(null=True)
    test_lcr = models.NullBooleanField(null=True)
    test_dil = models.NullBooleanField(null=True)
    test_parasit = models.NullBooleanField(null=True)
    test_sternal_puncture = models.NullBooleanField(null=True)
    test_ifat = models.NullBooleanField(null=True)
    test_clinical_sickness = models.NullBooleanField(null=True)
    test_other = models.NullBooleanField(null=True)
    # Some of these could be used for validating the correctness of the pl_result.
    # The pl_result field is the only one of this that is actually used for aggregation.
    test_pl_liquid = models.TextField(null=True)
    test_pl_trypanosome = models.TextField(null=True)
    test_pl_gb_mm3 = models.TextField(null=True)
    test_pl_albumine = models.TextField(null=True)
    test_pl_lcr = models.TextField(null=True)
    test_pl_comments = models.TextField(null=True)
    PL_TEST_RESULT_CHOICES = (
        ('stage1', 'Stage1'),
        ('stage2', 'Stage2'),
        ('unknown', 'Unknown')
    )
    test_pl_result = models.TextField(choices=PL_TEST_RESULT_CHOICES, null=True)

    followup_done = models.NullBooleanField(null=True)

    # fields for followup tests
    test_followup_pg = models.TextField(null=True)
    test_followup_sf = models.TextField(null=True)
    test_followup_ge = models.TextField(null=True)
    test_followup_woo = models.TextField(null=True)
    test_followup_maect = models.TextField(null=True)
    test_followup_woo_maect = models.TextField(null=True)
    test_followup_pl = models.TextField(null=True)
    test_followup_pl_trypanosome = models.TextField(null=True)
    test_followup_pl_gb = models.TextField(null=True)
    test_followup_decision = models.TextField(null=True)

    class Meta:
        ordering = ['-document_date']
        permissions = (
            ("import", "Can import data"),
            ("import_reconciled", "Can import reconciliation data"),
            ("export", "Can export data"),
            ("export_full", "Can export the full dataset as csv"),
            ("view", "Can view data"),
        )


class CaseView(models.Model):
    source = models.TextField(choices=SOURCE_CHOICES, db_index=True, null=True)

    document_date = models.DateTimeField(db_index=True, null=True)
    document_id = models.TextField(db_index=True)
    hat_id = models.TextField()
    mobile_unit = models.TextField(null=True)

    name = models.TextField(null=True)
    lastname = models.TextField(null=True)
    prename = models.TextField(null=True)
    sex = models.TextField(choices=SEX_CHOICES, null=True)
    age = models.PositiveSmallIntegerField(null=True)
    year_of_birth = models.PositiveSmallIntegerField(null=True)

    province = models.TextField(null=True)
    ZS = models.TextField(db_index=True, null=True)
    # TODO: Aires de santé acronym is misspelled and should be refactored into AS
    AS = models.TextField(null=True)
    village = models.TextField(null=True)

    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True)

    screening_result = models.NullBooleanField(null=True)
    confirmation_result = models.NullBooleanField(null=True)
    stage_result = models.TextField(null=True)

    class Meta:
        managed = False
        db_table = 'cases_case_view'


class Location(models.Model):
    ZS = models.TextField(db_index=True, null=True)
    AS = models.TextField(db_index=True, null=True)
    AS_alt = models.TextField(db_index=True, null=True)
    village = models.TextField(db_index=True, null=True)
    village_alt = models.TextField(db_index=True, null=True)
    village_type = models.TextField(null=True)
    VILLAGE_OFFICIAL_CHOICES = (
        ('YES', 'Villages from Z.S.'),
        ('NO', 'Villages not from Z.S.'),
        ('OTHER', 'Locations in which people work/study...'),
        ('NA', 'Villages from satellite (unknown)'),
    )
    village_official = models.TextField(choices=VILLAGE_OFFICIAL_CHOICES, null=True)

    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True)
    gps_source = models.TextField(null=True)

    population = models.PositiveIntegerField(null=True)
    population_source = models.TextField(null=True)
    population_year = models.PositiveIntegerField(null=True)

    class Meta:
        permissions = (
            ("import_locations", "Can import location data"),
        )
