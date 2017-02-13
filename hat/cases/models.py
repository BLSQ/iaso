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
    source = models.TextField(choices=SOURCE_CHOICES, null=True)

    document_date = models.DateTimeField(db_index=True, null=True)
    # The id is currently a hash over the row to be able to
    # catch duplicates
    document_id = models.TextField(unique=True)
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
    ZS = models.TextField(null=True)
    AS = models.TextField(null=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True)

    mobile_unit = models.TextField(null=True)
    device_id = models.TextField(null=True)

    treatment_center = models.TextField(null=True)
    treatment_start_date = models.DateTimeField(null=True)
    treatment_end_date = models.DateTimeField(null=True)
    treatment_prescribed = models.TextField(null=True)
    treatment_secondary_effects = models.NullBooleanField()
    treatment_result = models.TextField(null=True)

    test_rdt = models.NullBooleanField()
    test_catt = models.NullBooleanField()
    test_maect = models.NullBooleanField()
    test_ge = models.NullBooleanField()
    test_pg = models.NullBooleanField()
    test_ctcwoo = models.NullBooleanField()
    test_pl = models.NullBooleanField()
    test_catt_dilution = models.TextField(null=True)
    test_lymph_node_puncture = models.NullBooleanField()
    test_sf = models.NullBooleanField()
    test_lcr = models.NullBooleanField()
    test_dil = models.NullBooleanField()
    test_parasit = models.NullBooleanField()
    test_sternal_puncture = models.NullBooleanField()
    test_ifat = models.NullBooleanField()
    test_clinical_sickness = models.NullBooleanField()
    test_other = models.NullBooleanField()
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

    followup_done = models.NullBooleanField()

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

    # log fields
    # used in merge duplicates actions
    update_with = models.TextField(null=True)
    # just to know how many times has been updated
    version_number = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-document_date']
        permissions = (
            ("import", "Can import data"),
            ("import_reconciled", "Can import reconciliation data"),
            ("export", "Can export anonymized cases data"),
            ("export_full", "Can export non anonymized cases data"),
            ("view", "Can view anonymized cases data"),
            ("view_full", "Can view non anonymized cases data"),
        )


class CaseView(models.Model):
    source = models.TextField(choices=SOURCE_CHOICES, null=True)

    document_date = models.DateTimeField(db_index=True, null=True)
    document_id = models.TextField(unique=True)
    hat_id = models.TextField()
    mobile_unit = models.TextField(null=True)

    name = models.TextField(null=True)
    lastname = models.TextField(null=True)
    prename = models.TextField(null=True)
    sex = models.TextField(choices=SEX_CHOICES, null=True)
    age = models.PositiveSmallIntegerField(null=True)
    year_of_birth = models.PositiveSmallIntegerField(null=True)

    province = models.TextField(null=True)
    ZS = models.TextField(null=True)
    AS = models.TextField(null=True)
    village = models.TextField(null=True)

    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True)

    screening_result = models.NullBooleanField()
    confirmation_result = models.NullBooleanField()
    stage_result = models.TextField(null=True)

    class Meta:
        managed = False
        db_table = 'cases_case_view'


class Location(models.Model):
    province = models.TextField(null=True)
    province_old = models.TextField(null=True)
    ZS = models.TextField(null=True)
    AS = models.TextField(null=True)
    AS_alt = models.TextField(null=True)
    village = models.TextField(null=True)
    village_alt = models.TextField(null=True)
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


class DuplicatesPair(models.Model):
    case1 = models.ForeignKey('Case', on_delete=models.CASCADE, related_name='+', db_index=True)
    case2 = models.ForeignKey('Case', on_delete=models.CASCADE, related_name='+', db_index=True)
    document_id1 = models.TextField(db_index=True, null=True)
    document_id2 = models.TextField(db_index=True, null=True)

    def save(self, *args, **kwargs):
        if(self.case1_id > self.case2_id):
            super(DuplicatesPair, self).save(*args, **kwargs)
        else:
            raise Exception("Case1's id MUST always be greater than case2's id")

    class Meta:
        unique_together = (('case1', 'case2'),)
        permissions = (
            ("reconcile_duplicates", "Can reconcile duplicates"),
        )


class IgnoredPair(models.Model):
    '''
    This table tracks all duplicates pairs that have been found not to be actual matches.
    When the process for finding duplicates reruns, we don't want any previously ignored
    pairs to show up again and need to keep track of them. The pairs are tracked by the
    document_id, so that they are not dependent on the table instance.
    '''
    document_id1 = models.TextField(db_index=True)
    document_id2 = models.TextField(db_index=True)

    class Meta:
        unique_together = (('document_id1', 'document_id2'),)
