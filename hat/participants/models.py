from django.db import models


class HatParticipant(models.Model):
    SOURCE_CHOICES = (
        ('historic', 'Historic'),
        ('mobile_backup', 'Mobile backup')
    )
    source = models.TextField(choices=SOURCE_CHOICES, null=True)

    document_date = models.DateTimeField(null=True)
    # The id is currently a hash over the row to be able to
    # catch duplicates
    document_id = models.TextField()
    hat_id = models.TextField()
    entry_date = models.DateTimeField(null=True)
    entry_name = models.TextField(null=True)

    name = models.TextField(null=True)
    lastname = models.TextField(null=True)
    prename = models.TextField(null=True)
    SEX_CHOICES = (
        ('female', 'Female'),
        ('male', 'Male'),
        ('unknown', 'Unknown'),
    )
    sex = models.TextField(choices=SEX_CHOICES)
    age = models.PositiveSmallIntegerField(null=True)
    year_of_birth = models.PositiveSmallIntegerField(null=True)
    mothers_surname = models.TextField(null=True)

    village = models.TextField(null=True)
    province = models.TextField(null=True)
    ZS = models.TextField(null=True)
    AZ = models.TextField(null=True)

    mobile_unit = models.TextField(null=True)

    treatment_center = models.TextField(null=True)
    treatment_start_date = models.DateTimeField(null=True)
    treatment_end_date = models.DateTimeField(null=True)
    treatment_prescribed = models.TextField(null=True)
    treatment_secondary_effects = models.NullBooleanField()
    TREATMENT_RESULT_CHOICES = (
        ('recovered', 'Recovered'),
        ('healthy', 'Healthy'),
        ('relapse', 'Relapse'),
        ('disappeared', 'Disappeared'),
        ('died', 'Died'),
        ('transferred', 'Transferred'),
        ('other', 'Other'),
    )
    treatment_result = models.TextField(choices=TREATMENT_RESULT_CHOICES, null=True)

    # mobile and historic data sources
    test_rdt = models.NullBooleanField(null=True)
    test_catt = models.NullBooleanField(null=True)
    test_maect = models.NullBooleanField(null=True)
    test_ge = models.NullBooleanField(null=True)

    # from mobile data
    test_pg = models.NullBooleanField(null=True)
    test_ctcwoo = models.NullBooleanField(null=True)
    test_pl = models.NullBooleanField(null=True)

    # from historic data
    test_catt_total_blood = models.TextField(null=True)

    test_catt_dilution = models.TextField(null=True)
    test_lymph_node_puncture = models.NullBooleanField(null=True)
    test_sf = models.NullBooleanField(null=True)
    test_woo = models.NullBooleanField(null=True)
    test_maec = models.NullBooleanField(null=True)
    test_maect_bc = models.NullBooleanField(null=True)
    test_lcr = models.NullBooleanField(null=True)
    test_lcr_fr = models.NullBooleanField(null=True)
    test_lcr_scm = models.NullBooleanField(null=True)
    test_dil = models.NullBooleanField(null=True)
    test_parasit = models.NullBooleanField(null=True)
    test_sternal_puncture = models.NullBooleanField(null=True)
    test_ifat = models.NullBooleanField(null=True)

    test_clinical_sickness = models.NullBooleanField(null=True)
    test_other = models.NullBooleanField(null=True)
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
        permissions = (
            ("import", "Can import data"),
            ("export", "Can export data"),
            ("export_full", "Can export the full dataset as csv"),
        )
