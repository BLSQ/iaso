from typing import Any
from django.db import models
from django.db.models.signals import pre_save
from django.dispatch import receiver
from hat.geo.models import Village
from datetime import datetime
import calendar

CASES_PERMISSIONS = (
    ('import', 'Can import data'),
    ('import_reconciled', 'Can import reconciliation data'),
    ('export', 'Can export anonymized cases data'),
    ('export_full', 'Can export non anonymized cases data'),
    ('view', 'Can view anonymized cases data'),
    ('view_full', 'Can view non anonymized cases data'),
)

CURRENT_YEAR = datetime.now().year
years =  range(CURRENT_YEAR, CURRENT_YEAR - 20, -1)
YEAR_CHOICES = zip(years, years)
MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
MONTH_CHOICES = [(i+1, MONTHS[i]) for i in range(0, 12)]

RES_POSITIVE = 2
RES_NEGATIVE = 1
RES_ABSENT = 0
RES_MISSING = -1


class CaseAbstract(models.Model):
    '''
    Models case object with generic properties, treatment, followup, tests...

    - **Generic**

    :ivar text     source:
        Case data source.

            - **historic**      -- Historic
            - **mobile_backup** -- Mobile backup
            - **mobile_sync**   -- Mobile synced
            - **pv**            -- Pharmacovigilance

    :ivar datetime document_date:   Document date.
    :ivar text     document_id:     Unique hash that identifies the case.

    :ivar text     hat_id:          HAT Case id.
    :ivar datetime entry_date:      Entry form: Date.
    :ivar text     entry_name:      Entry form: name.

    :ivar integer  form_number:     Entry form: number.
    :ivar integer  form_year:       Entry form: year.
    :ivar integer  form_month:      Entry form: month.

    :ivar text     name:            Name.
    :ivar text     lastname:        Lastname/surname.
    :ivar text     prename:         Prename.
    :ivar text     mothers_surname: Mothers surname.

    :ivar integer  age:             Age at the moment of the test.
    :ivar integer  year_of_birth:   Year of birth.
    :ivar text     sex:
        Gender.

            - **female** --  Female
            - **male**   -- Male

    :ivar text     province:        Province name.
    :ivar text     ZS:              “Health zone” / “zone de santé” name.
    :ivar text     AS:              “Health area” / “aire de santé” name.
    :ivar text     village:         Official location name.
    :ivar double   longitude:       GPS coordinates: longitude.
    :ivar double   latitude:        GPS coordinates: latitude.

    :ivar text     mobile_unit:     Mobile unit responsible of the tests.
    :ivar text     device_id:       Id of the device used during screening.

    :ivar integer  version_number:  Indicates how many times has been updated


    - **Treatment**

    :ivar text     treatment_center:            Where the treatment took place.
    :ivar datetime treatment_start_date:        Start date of the treatment.
    :ivar datetime treatment_end_date:          End date of the treatment.
    :ivar text     treatment_prescribed:        Prescribed treatment.
    :ivar text     treatment_result:            Result.
    :ivar boolean  treatment_secondary_effects: Secondary effects due treatment?


    - **Followup**

    :ivar boolean followup_done:             Is there any followup?
    :ivar text test_followup_decision:       Medical decision.
    :ivar text test_followup_ge:             “Goutte Épaisse”.
    :ivar text test_followup_maect:          “mini Anion Exchange Centrifugation Technique”.
    :ivar text test_followup_pg:             “Ponction ganglionnaire”.
    :ivar text test_followup_pl:             “Ponction lombaire”.
    :ivar text test_followup_pl_gb:          “Ponction lombaire, Gb/mm³³”.
    :ivar text test_followup_pl_trypanosome: “Ponction lombaire, Présence trypanosomes”.
    :ivar text test_followup_sf:             “Sang Frais”.
    :ivar text test_followup_woo:            Woo (“haematocrit centrifuge technique”).
    :ivar text test_followup_woo_maect:      Woo / mAECT.


    - **Tests**

    :ivar integer test_clinical_sickness:    “Malade clinique”.
    :ivar integer test_ctcwoo:               “Woo (haematocrit centrifuge technique)”.
    :ivar integer test_dil:                  “Dil = ou > + à 1/16 en zone hyperendémique”.
    :ivar integer test_ge:                   “Goutte Épaisse”.
    :ivar integer test_ifat:                 “ImmunoFluorescence Antibody Test”.
    :ivar integer test_lcr:                  “LCR (liquide céphalo-rachidien)”.
    :ivar integer test_lymph_node_puncture:  “Ponction ganglionnaire”.
    :ivar integer test_maect:                “mini Anion Exchange Centrifugation Technique”.
    :ivar integer test_parasit:              “Confirmation Parasitologique”.
    :ivar integer test_pg:                   “Ponction ganglionnaire”.
    :ivar integer test_rdt:                  “Rapid Diagnostic Test”.
    :ivar integer test_sf:                   “Sang Frais”.
    :ivar integer test_sternal_puncture:     “Ponction sternale”.

    :ivar integer test_catt:                 “Card Agglutination Test for Trypanosomiasis”.
    :ivar text    test_catt_dilution:        “Card Agglutination Test for Trypanosomiasis”.
        Dilution positive at:

            - 1 / 2
            - 1 / 4
            - 1 / 8
            - 1 / 16
            - 1 / 32
            - > 1 / 32

    :ivar integer test_pl:                   “Ponction lombaire”.
    :ivar text    test_pl_albumine:          “Ponction lombaire”: Albumine (centrigr. ‰)
    :ivar text    test_pl_comments:          “Ponction lombaire”: Comments.
    :ivar text    test_pl_gb_mm3:            “Ponction lombaire”: Gb/mm³.
    :ivar text    test_pl_liquid:            “Ponction lombaire”:
        Liquid:

            - clair
            - trouble
            - hemorragique

    :ivar text    test_pl_trypanosome:       “Ponction lombaire”: Présence trypanosomes.
    :ivar text    test_pl_lcr:               “Ponction lombaire”:
        Latex LCR (liquide céphalo-rachidien)

            - 1 / 8
            - 1 / 16
            - 1 / 32
            - 1 / 64
            - 1 / 128
            - 1 / 256
            - 1 / 512
            - 1 / 1024

    :ivar text    test_pl_result:            “Ponction lombaire”:
        Stage results:

            - **stage1** -- “Stage 1”
            - **stage2** -- “Stage 2”

    :ivar integer test_other:                Other test.

    '''

    SOURCE_CHOICES = (
        ('historic', 'Historic'),
        ('mobile_backup', 'Mobile backup'),
        ('mobile_sync', 'Mobile synced'),
        ('pv', 'Pharmacovigilance'),
    )
    source = models.TextField(choices=SOURCE_CHOICES, null=True)

    document_date = models.DateTimeField("Date document", db_index=True, null=True)
    # The id is currently a hash over the row to be able to catch duplicates
    document_id = models.TextField(unique=True)
    hat_id = models.TextField()
    entry_date = models.DateTimeField("Date de collection", null=True)
    entry_name = models.TextField("Nom d'entrée", null=True)

    form_number = models.PositiveSmallIntegerField("Numéro de formulaire", null=True, blank=True)

    form_year = models.PositiveSmallIntegerField("Année du formulaire", choices=YEAR_CHOICES, null=True, blank=True)
    form_month = models.PositiveSmallIntegerField("Mois du formulaire", choices=MONTH_CHOICES, null=True, blank=True)

    name = models.TextField("Postnom", null=True)
    lastname = models.TextField("Nom de famille", null=True)
    prename = models.TextField("Prénom", null=True)

    SEX_CHOICES = (
        ('female', 'Femme'),
        ('male', 'Homme'),
    )
    sex = models.TextField("Sexe", choices=SEX_CHOICES, null=True)
    age = models.PositiveSmallIntegerField("Age", null=True, blank=True)
    year_of_birth = models.PositiveSmallIntegerField("Année de naissance", null=True, blank=True)
    mothers_surname = models.TextField("Nom de la mère", null=True)

    province = models.TextField(null=True)
    corrected_province = models.TextField(null=True)
    ZS = models.TextField(null=True)
    corrected_ZS = models.TextField(null=True)
    AS = models.TextField(null=True)
    corrected_AS = models.TextField(null=True)
    village = models.TextField(null=True)
    corrected_village = models.TextField(null=True)

    normalized_village = models.ForeignKey(Village, null=True)

    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True)

    mobile_unit = models.TextField(null=True)
    device_id = models.TextField(null=True)

    treatment_center = models.TextField("Centre de traitement", null=True, blank=True)
    treatment_start_date = models.DateTimeField("Début de traitement", null=True, blank=True)
    treatment_end_date = models.DateTimeField("Fin de traitement", null=True, blank=True)
    treatment_prescribed = models.TextField("Prescription", null=True, blank=True)
    treatment_secondary_effects = models.NullBooleanField("Effets Secondaires", blank=True)
    treatment_result = models.TextField("Résultat", null=True, blank=True)

    GENERAL_TEST_RESULT_CHOICES = (
        (RES_POSITIVE, 'Positif'),
        (RES_NEGATIVE, 'Négatif'),
        (RES_ABSENT, 'Absent'),
        (RES_MISSING, 'Manquant'),
    )

    test_catt = models.IntegerField("Test CATT", choices=GENERAL_TEST_RESULT_CHOICES, null=True, blank=True)
    test_catt_dilution = models.TextField("Dilution CATT", choices=GENERAL_TEST_RESULT_CHOICES, null=True, blank=True)
    test_clinical_sickness = models.IntegerField("Maladie clinique", choices=GENERAL_TEST_RESULT_CHOICES, null=True, blank=True)
    test_ctcwoo = models.IntegerField(choices=GENERAL_TEST_RESULT_CHOICES, null=True, blank=True)
    test_dil = models.IntegerField(choices=GENERAL_TEST_RESULT_CHOICES, null=True, blank=True)
    test_ge = models.IntegerField(choices=GENERAL_TEST_RESULT_CHOICES, null=True, blank=True)
    test_ifat = models.IntegerField(choices=GENERAL_TEST_RESULT_CHOICES, null=True, blank=True)
    test_lcr = models.IntegerField(choices=GENERAL_TEST_RESULT_CHOICES, null=True, blank=True)
    test_lymph_node_puncture = models.IntegerField("Ponction Ganglions", choices=GENERAL_TEST_RESULT_CHOICES, null=True, blank=True)
    test_maect = models.IntegerField(choices=GENERAL_TEST_RESULT_CHOICES, null=True, blank=True)
    test_parasit = models.IntegerField(choices=GENERAL_TEST_RESULT_CHOICES, null=True, blank=True)
    test_pg = models.IntegerField(choices=GENERAL_TEST_RESULT_CHOICES, null=True, blank=True)
    test_pl = models.IntegerField(choices=GENERAL_TEST_RESULT_CHOICES, null=True, blank=True)
    test_rdt = models.IntegerField(choices=GENERAL_TEST_RESULT_CHOICES, null=True, blank=True)
    test_sf = models.IntegerField(choices=GENERAL_TEST_RESULT_CHOICES, null=True, blank=True)
    test_sternal_puncture = models.IntegerField("Test Ponction Sternale", choices=GENERAL_TEST_RESULT_CHOICES, null=True, blank=True)
    test_other = models.IntegerField("Autre test", choices=GENERAL_TEST_RESULT_CHOICES, null=True, blank=True)

    # Some of these could be used for validating the correctness of the pl_result.
    # The pl_result field is the only one of this that is actually used for aggregation.
    test_pl_liquid = models.TextField(null=True, blank=True)
    test_pl_trypanosome = models.TextField(null=True, blank=True)
    test_pl_gb_mm3 = models.TextField(null=True, blank=True)
    test_pl_albumine = models.TextField(null=True, blank=True)
    test_pl_lcr = models.TextField(null=True, blank=True)
    test_pl_comments = models.TextField("Commentaire Ponction Lombaire", null=True, blank=True)
    PL_TEST_RESULT_CHOICES = (
        ('stage1', 'Stage1'),
        ('stage2', 'Stage2'),
        ('unknown', 'Inconnu'),
    )
    test_pl_result = models.TextField("Résultat de test PL", choices=PL_TEST_RESULT_CHOICES, null=True, blank=True)

    followup_done = models.NullBooleanField("Suivi effectué", blank=True)

    # fields for followup tests
    test_followup_pg = models.TextField("Suivi PG", null=True, blank=True)
    test_followup_sf = models.TextField("Suivi SF", null=True, blank=True)
    test_followup_ge = models.TextField("Suivi GE", null=True, blank=True)
    test_followup_woo = models.TextField("Suivi WOO", null=True, blank=True)
    test_followup_maect = models.TextField("Suivi MAECT", null=True, blank=True)
    test_followup_woo_maect = models.TextField("Suivi WOO MAECT",null=True, blank=True)
    test_followup_pl = models.TextField("Suivi PL", null=True, blank=True)
    test_followup_pl_trypanosome = models.TextField("Suivi PL trypanosome", null=True, blank=True)
    test_followup_pl_gb = models.TextField("Suivi PL GB", null=True, blank=True)
    test_followup_decision = models.TextField("Suivi décision", null=True, blank=True)

    confirmed_case = models.NullBooleanField("Cas confirmé", default=False)
    # log field: used to know how many times has been updated
    version_number = models.PositiveIntegerField(default=0)

    class Meta:
        abstract = True
        ordering = ['-id']
        permissions = CASES_PERMISSIONS

    def confirmed(self):
        if self.test_ctcwoo == RES_POSITIVE:
            return True
        if self.test_ge == RES_POSITIVE:
            return True
        if self.test_lcr == RES_POSITIVE:
            return True
        if self.test_lymph_node_puncture == RES_POSITIVE:
            return True
        if self.test_maect == RES_POSITIVE:
            return True
        if self.test_pg == RES_POSITIVE:
            return True
        if self.test_sf == RES_POSITIVE:
            return True
        return False

    def __str__(self):
        return "%s - %s - %s" % (self.lastname, self.name, self.prename)


class Case(CaseAbstract):
    '''
    Implements :class:`hat.cases.models.CaseAbstract`

    **Permissions**

    - **import**            -- Can import data.
    - **import_reconciled** -- Can import reconciliation data.
    - **export**            -- Can export anonymized cases data.
    - **export_full**       -- Can export non anonymized cases data.
    - **view**              -- Can view anonymized cases data.
    - **view_full**         -- Can view non anonymized cases data.

    '''

    class Meta:
        abstract = False
        ordering = ['-id']
        permissions = CASES_PERMISSIONS

    def as_dict(self):
        return {
            'id': self.id,
            'ZS': self.ZS,
            'AS': self.AS,
            'village': self.village,
            'province': self.province,
            'name': self.name,
            'prename': self.prename,
            'lastname': self.lastname

        }

def compute_confirmation(sender, instance: Case, **kwargs):
    instance.confirmed_case = instance.confirmed()

models.signals.pre_save.connect(compute_confirmation, sender=Case)


@receiver(pre_save, sender=Case)
def increase_case_version_number(sender, instance, *args, **kwargs):  # type: ignore
    instance.version_number = instance.version_number + 1


class CaseView(CaseAbstract):
    '''
    References a postgresql view that extends :class:`hat.cases.models.CaseAbstract`
    with calculated properties.

    :ivar datetime document_date_day:   Taken **document_date** goes to the beginning of the day.
    :ivar datetime document_date_month: Taken **document_date** goes to the beginning of the month.
    :ivar datetime document_date_year:  Taken **document_date** goes to the beginning of the year.

    :ivar integer document_day:   Extracts **document_date** day.
    :ivar integer document_month: Extracts **document_date** month.
    :ivar integer document_year:  Extracts **document_date** year.

    :ivar text full_name:     Concats **name** **prename** **lastname**.
    :ivar text full_location: Concats **province** - **ZS** - **AS** - **village**.

    :ivar integer screening_result: Takes the most significant result of the
        screening tests.

    :ivar integer confirmation_result: Takes the most significant result of the
        confirmation tests.

    :ivar text stage_result: Renames **test_pl_result**.

    .. seealso:: :any:`hat.cases.filters` to get the list of test classification.

    '''

    # calculated fields
    document_date_day = models.DateTimeField(null=True)
    document_date_month = models.DateTimeField(null=True)
    document_date_year = models.DateTimeField(null=True)
    document_day = models.PositiveSmallIntegerField(null=True)
    document_month = models.PositiveSmallIntegerField(null=True)
    document_year = models.PositiveSmallIntegerField(null=True)

    full_name = models.TextField(null=True)
    full_location = models.TextField(null=True)

    screening_result = models.IntegerField(null=True)
    confirmation_result = models.IntegerField(null=True)
    stage_result = models.TextField(null=True)

    class Meta:
        managed = False
        db_table = 'cases_case_view'
        ordering = ['-document_date']
        permissions = CASES_PERMISSIONS


class Location(models.Model):
    '''
    The official location list created by
    :func:`hat.import_export.import_locations.import_locations_file`
    and updated by
    :func:`hat.import_export.import_locations.import_locations_areas_file`.

    :ivar text province:     Current province name.
    :ivar text province_old: Former province name.
    :ivar text ZS:           “Health zone” / “zone de santé” name.
    :ivar text AS:           “Health area” / “aire de santé” name.
    :ivar text AS_alt:       Alternative spelling for the “health area” / “aire de santé” name.
    :ivar text village:      Official location name.
    :ivar text village_alt:  Alternative spelling for this location.
    :ivar text village_type: Location type: village, hospital, camp, farm...

    :ivar text village_official:
        Is this location classified as “official”?

            - **YES**:   Location from “zone de santé”.
            - **NO**:    Location not from “zone de santé”.
            - **OTHER**: Location where people are found during campaigns.
            - **NA**:    Location visible from satellite (unknown).

    :ivar double  longitude:  GPS coordinates: longitude.
    :ivar double  latitude:   GPS coordinates: latitude.
    :ivar text    gps_source: GPS source: organization that provided GPS coordinates.

    :ivar integer population: Village population, only *official* villages have population data.
    :ivar integer population_year:   Year in which the census was taken.
    :ivar text    population_source: Name of the organization that provided population data.


    **Permissions**

    - **import_locations** -- Can import location data.
    '''

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
        ('OTHER', 'Locations where people are found during campaigns'),
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
            ('import_locations', 'Can import location data'),
        )

    def __str__(self):
        return "%s - %s - %s - %s" % (self.village,  self.AS, self.ZS, self.village_type)

class DuplicatesPair(models.Model):
    '''
    Potential duplicate cases. Two cases are considered potential duplicates if:
        - Have **same** values in:
            - **ZS**
            - **AS**
            - **village**
            - **sex**
        - Have **similar** values in:
            - **name**
            - **prename**
            - **lastname**
            - **mothers_surname**

    :ivar Case case1: Case 1 **reference**.
    :ivar Case case2: Case 2 **reference**.

    :ivar text document_id1: Case 1 **document_id**.
    :ivar text document_id2: Case 2 **document_id**.

    **Permissions**

    - **reconcile_duplicates** -- Can reconcile duplicates.

    '''

    case1 = models.ForeignKey('Case', on_delete=models.CASCADE, related_name='+', db_index=True)
    case2 = models.ForeignKey('Case', on_delete=models.CASCADE, related_name='+', db_index=True)
    document_id1 = models.TextField(db_index=True, null=True)
    document_id2 = models.TextField(db_index=True, null=True)

    def save(self, *args: Any, **kwargs: Any) -> None:
        if self.case1_id > self.case2_id:
            super(DuplicatesPair, self).save(*args, **kwargs)
        else:
            raise Exception("Case1's id MUST always be greater than case2's id")

    class Meta:
        unique_together = (('case1', 'case2'),)
        permissions = (
            ('reconcile_duplicates', 'Can reconcile duplicates'),
        )


class TestGroup(models.Model):
    type = models.TextField()
    cases = models.ManyToManyField('Case')
    group_id = models.TextField(db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return "%s - %s - %s" % (self.type, self.group_id, self.created_at)


class IgnoredPair(models.Model):
    '''
    This table tracks all duplicates pairs that have been found not to be actual matches.
    When the process for finding duplicates reruns, we don't want any previously ignored
    pairs to show up again and need to keep track of them. The pairs are tracked by the
    ``document_id``, so that they are not dependent on the table instance.

    :ivar text document_id1: Case 1 **document_id**.
    :ivar text document_id2: Case 2 **document_id**.

    '''
    document_id1 = models.TextField(db_index=True)
    document_id2 = models.TextField(db_index=True)

    class Meta:
        unique_together = (('document_id1', 'document_id2'),)

    def __str__(self):
        return "%s - %s" % (self.document_id1, self.document_id2)
