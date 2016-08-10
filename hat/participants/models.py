from django.db import models


class HatParticipant(models.Model):
    SOURCE_CHOICES = (
        ('historic', 'Historic'),
        ('mobile_backup', 'Mobile backup')
    )
    source = models.CharField(max_length=16, choices=SOURCE_CHOICES, null=True)

    document_date = models.DateTimeField(null=True)
    # The id is currently a hash over the row to be able to
    # catch duplicates
    document_id = models.CharField(max_length=32)
    hat_id = models.CharField(max_length=64)
    entry_date = models.DateTimeField(null=True)
    entry_name = models.CharField(max_length=128, null=True)

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
    treatment_start_date = models.DateTimeField(null=True)
    treatment_end_date = models.DateTimeField(null=True)
    TREATMENT_RESULT_CHOICES = (
        ('recovered','Recovered'),
        ('healthy','Healthy'),
        ('relapse','Relapse'),
        ('disappeared','Disappeared'),
        ('died','Died'),
        ('transferred','Transferred'),
        ('other','Other'),
    )
    treatment_result = models.CharField(max_length=16, choices=TREATMENT_RESULT_CHOICES, null=True)

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
    test_catt_total_blood = models.NullBooleanField(null=True)

    test_catt_dilution = models.NullBooleanField(null=True)
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
    test_pl_liquid = models.NullBooleanField(null=True)
    test_pl_trypanosome = models.CharField(max_length=128, null=True)
    test_pl_gb_mm3 = models.CharField(max_length=128, null=True)
    test_pl_albumine = models.CharField(max_length=128, null=True)
    test_pl_lcr = models.NullBooleanField(null=True)
    test_pl_comments = models.CharField(max_length=128, null=True)
    PL_TEST_RESULT_CHOICES = (
        ('stage1', 'Stage1'),
        ('stage2', 'Stage2'),
        ('unknown', 'Unknown')
    )
    test_pl_result = models.CharField(max_length=16, choices=PL_TEST_RESULT_CHOICES, null=True)

    followup_done = models.NullBooleanField(null=True)

    # fields for followup tests
    test_followup_pg = models.CharField(max_length=128, null=True)
    test_followup_sf = models.CharField(max_length=128, null=True)
    test_followup_ge = models.CharField(max_length=128, null=True)
    test_followup_woo = models.CharField(max_length=128, null=True)
    test_followup_maect = models.CharField(max_length=128, null=True)
    test_followup_woo_maect = models.CharField(max_length=128, null=True)
    test_followup_pl = models.CharField(max_length=128, null=True)
    test_followup_pl_trypanosome = models.CharField(max_length=128, null=True)
    test_followup_pl_gb = models.CharField(max_length=128, null=True)
    test_followup_decision = models.CharField(max_length=128, null=True)

    class Meta:
        permissions = (
            ("import_mdb", "Can import mdb files"),
            ("export_full", "Can export the full dataset as csv"),
            ("export_anon", "Can export anonymized data as csv"),
        )
