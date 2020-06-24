from datetime import datetime, timedelta

from django.db import models
from django.db.models import Q
from django.db.models.functions import Coalesce, Cast, ExtractYear, Greatest
from django.db.models.signals import pre_save
from django.dispatch import receiver

from hat.constants import (
    SCREENING_TYPE_CHOICES,
    DATE_FORMAT,
    CATT,
    RDT,
    PL,
    PG,
    CTCWOO,
    MAECT,
    SF,
    GE,
    LCR,
    IFAT,
    SP,
    CLINICAL_SICKNESS,
    DIL,
    PARASIT,
    LNP,
    RESEARCH_PL,
    IELISA,
)
from hat.geo.models import AS as ASModel
from hat.geo.models import Village
from hat.sync.models import DeviceDB
from hat.users.models import Team
import logging

logger = logging.getLogger(__name__)

CASES_PERMISSIONS = (
    ("import", "Can import data"),
    ("import_reconciled", "Can import reconciliation data"),
    ("export", "Can export anonymized cases data"),
    ("export_full", "Can export non anonymized cases data"),
    ("view", "Can view anonymized cases data"),
    ("view_full", "Can view non anonymized cases data"),
)

CURRENT_YEAR = datetime.now().year
years = range(CURRENT_YEAR, CURRENT_YEAR - 20, -1)
YEAR_CHOICES = zip(years, years)
MONTHS = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Aout",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
]
MONTH_CHOICES = [(i + 1, MONTHS[i]) for i in range(0, 12)]


def testResultString(value):
    if value == RES_POSITIVE_POSITIVE_POSITIVE:
        return "Positif +++"
    if value == RES_POSITIVE_POSITIVE:
        return "Positif ++"
    if value == RES_POSITIVE:
        return "Positif +"
    if value == RES_NEGATIVE:
        return "Négatif"
    if value == RES_ABSENT:
        return "Absent"
    if value == RES_MISSING:
        return "Manquant"
    if value == RES_UNREADABLE:
        return "Non lisible"
    if value == RES_INVALID:
        return "Invalide"
    if value == RES_UNSURE:
        return "Incertain +/-"
    return "/"


RES_POSITIVE_POSITIVE_POSITIVE = 4
RES_POSITIVE_POSITIVE = 3
RES_POSITIVE = 2
RES_NEGATIVE = 1
RES_ABSENT = 0
RES_MISSING = -1
RES_UNREADABLE = -2
RES_INVALID = -3
RES_UNSURE = -4

SESSION_TYPE_DOOR_TO_DOOR = "doorToDoor"
SESSION_TYPE_ON_SITE = "onSite"


USER_TYPE_UM = "UM"
USER_TYPE_MUM = "MUM"
USER_TYPE_MUM_CONF = "MUM_CONF"
USER_TYPE_CDTC = "CDTC"
USER_TYPE_FIXED_STRUCTURE = "fixed_structure"

USER_TYPE_CHOICES = (
    (USER_TYPE_UM, "Unité mobile"),
    (USER_TYPE_MUM, "Mini unité mobile"),
    (USER_TYPE_MUM_CONF, "Mini unité mobile de confirmation"),
    (USER_TYPE_CDTC, "CDTC"),
    (USER_TYPE_FIXED_STRUCTURE, "Structure fixe"),
)


class CaseAbstract(models.Model):
    """
    Models case object with generic properties, treatment, followup, tests...

    - **Generic**

    :ivar text     source:
        Case data source.

            - **historic**      -- Historic
            - **mobile_backup** -- Mobile backup
            - **mobile_sync**   -- Mobile synced
            - **pv**            -- Pharmacovigilance

    :ivar datetime document_date:   Document date.
    :ivar text     document_id:     Hash that used to uniquely identify a "case" but is now obsolete.

    :ivar text     hat_id:          HAT Case id.
    :ivar datetime entry_date:      Entry form: Date.
    :ivar text     entry_name:      Entry form: name.

    :ivar integer  form_number:     Entry form: number.
    :ivar integer  form_year:       Entry form: year.
    :ivar integer  form_month:      Entry form: month.

    :ivar text     postname:        Post name. "name" and "lastname" used to be mixed-up, this clears it up
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

    :ivar text     screening_type:       passif, actif ou None
    :ivar text     circumstances_da_um:  Dépistage Actif UM
    :ivar text     circumstances_dp_um:  Dépistage Passif UM
    :ivar text     circumstances_dp_cs:  Dépistage Passif Centre de Santé
    :ivar text     circumstances_dp_hgr: Dépistage Passif Hôpital Général de Référence

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
    :ivar integer test_ctcwoo_video_filename:“Woo (haematocrit centrifuge technique), filename of the video file”.
    :ivar integer test_dil:                  “Dil = ou > + à 1/16 en zone hyperendémique”.
    :ivar integer test_ge:                   “Goutte Épaisse”.
    :ivar integer test_ifat:                 “ImmunoFluorescence Antibody Test”.
    :ivar integer test_lcr:                  “LCR (liquide céphalo-rachidien)”.
    :ivar integer test_lymph_node_puncture:  “Ponction ganglionnaire”.
    :ivar integer test_maect:                “mini Anion Exchange Centrifugation Technique”.
    :ivar integer test_maect_video_filename: “mini Anion Exchange Centrifugation Technique”: filename of the video.
    :ivar integer test_parasit:              “Confirmation Parasitologique”.
    :ivar integer test_pg:                   “Ponction ganglionnaire”.
    :ivar integer test_pg_video_filename:    “Ponction ganglionnaire, filename of the video”.
    :ivar integer test_ielisa:               “iELISA test performed outside PNLTHA but confirmed by MUM”.
    :ivar integer test_rdt:                  “Rapid Diagnostic Test”.
    :ivar integer test_rdt_picture_filename: “Rapid Diagnostic Test, filename of the picture”.
    :ivar integer test_rdt_session_type:     “Rapid Diagnostic Test, doorToDoor or onSite”.
    :ivar integer test_sf:                   “Sang Frais”.
    :ivar integer test_sternal_puncture:     “Ponction sternale”.

    :ivar integer test_catt:                 “Card Agglutination Test for Trypanosomiasis”.
    :ivar integer test_catt_index:           “Card Agglutination Test for Trypanosomiasis, index of test on the card”.
    :ivar integer test_catt_picture_filename:“Card Agglutination Test for Trypanosomiasis, filename of the picture”.
    :ivar integer test_catt_session_type:    “Card Agglutination Test for Trypanosomiasis, doorToDoor or onSite”.
    :ivar text    test_catt_dilution:        “Card Agglutination Test for Trypanosomiasis”.
        Dilution positive at:

            - 1 / 2
            - 1 / 4
            - 1 / 8
            - 1 / 16
            - 1 / 32
            - > 1 / 32

    :ivar integer test_pl:                   “Ponction lombaire”.
    :ivar integer test_pl_video_filename:    “Ponction lombaire”: filename of the video file.
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

    """

    SOURCE_HISTORIC = "historic"
    SOURCE_MOBILE_BACKUP = "mobile_backup"
    SOURCE_MOBILE_SYNC = "mobile_sync"
    SOURCE_PV = "pv"
    SOURCE_CHOICES = (
        (SOURCE_HISTORIC, "Historic"),
        (SOURCE_MOBILE_BACKUP, "Mobile backup"),
        (SOURCE_MOBILE_SYNC, "Mobile synced"),
        (SOURCE_PV, "Pharmacovigilance"),
    )
    source = models.TextField(choices=SOURCE_CHOICES, null=True)

    ORIGIN_SELF_PRESENTED = "selfPresenting"
    ORIGIN_MOBILE_UNIT = "mobileUnit"
    ORIGIN_STRUCTURE = "structure"
    ORIGIN_CHOICES = (
        (ORIGIN_SELF_PRESENTED, "S'est présenté de lui-même"),
        (ORIGIN_MOBILE_UNIT, "Une unité mobile"),
        (ORIGIN_STRUCTURE, "Une structure de santé"),
    )

    document_date = models.DateTimeField("Date document", db_index=True, null=True)
    # The id is currently a hash over the row to be able to catch duplicates, the unicity is not enforced now
    # that we are considering cases as sessions
    document_id = models.TextField()
    hat_id = models.TextField()
    entry_date = models.DateTimeField("Date de collection", null=True)
    entry_name = models.TextField("Nom d'entrée", null=True)

    form_number = models.PositiveSmallIntegerField(
        "Numéro de formulaire", null=True, blank=True
    )

    form_year = models.PositiveSmallIntegerField(
        "Année du formulaire", choices=YEAR_CHOICES, null=True, blank=True
    )
    form_month = models.PositiveSmallIntegerField(
        "Mois du formulaire", choices=MONTH_CHOICES, null=True, blank=True
    )

    postname = models.TextField("Postnom", null=True)
    lastname = models.TextField("Nom de famille", null=True)
    prename = models.TextField("Prénom", null=True)

    SEX_CHOICES = (("female", "Femme"), ("male", "Homme"))
    sex = models.TextField("Sexe", choices=SEX_CHOICES, null=True)
    age = models.PositiveSmallIntegerField("Age", null=True, blank=True)
    year_of_birth = models.PositiveSmallIntegerField(
        "Année de naissance", null=True, blank=True
    )
    mothers_surname = models.TextField("Nom de la mère", null=True)

    province = models.TextField(null=True)
    ZS = models.TextField(null=True)
    AS = models.TextField(null=True)
    village = models.TextField(null=True)

    normalized_village = models.ForeignKey(
        Village, null=True, on_delete=models.SET_NULL
    )

    normalized_AS = models.ForeignKey(ASModel, null=True, on_delete=models.SET_NULL)
    # Don't use the class here because the import will create a cyclic dependency on Case
    normalized_patient = models.ForeignKey(
        "patient.Patient", null=True, on_delete=models.SET_NULL
    )

    normalized_village_not_found = models.NullBooleanField(default=False)

    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True)

    screening_type = models.TextField(
        null=True, blank=True, choices=SCREENING_TYPE_CHOICES, db_index=True
    )
    circumstances_da_um = models.TextField(null=True, blank=True)
    circumstances_dp_um = models.TextField(null=True, blank=True)
    circumstances_dp_cs = models.TextField(null=True, blank=True)
    circumstances_dp_cdtc = models.TextField(null=True, blank=True)
    circumstances_dp_hgr = models.TextField(null=True, blank=True)

    normalized_team = models.ForeignKey(Team, null=True, on_delete=models.SET_NULL)
    mobile_unit = models.TextField(null=True)
    device_id = models.TextField(null=True)

    # In mobile app 2.0.45, there were three choices with bad labels:
    # "Résident" -> "testLocation"
    # "Flottant" -> "residenceLocation"
    # "Autre" -> "otherLocation"
    # The main issue being that the "Flottant" doesn't ask for a location. When this happens and the location
    # could not be determined, they are marked as ambiguous
    INFECTION_LOCATION_TYPE_AMBIGUOUS = "ambiguous"
    INFECTION_LOCATION_TYPE_RESIDENCE = "residence"
    INFECTION_LOCATION_TYPE_TEST = "test"
    INFECTION_LOCATION_TYPE_OTHER = "other"
    INFECTION_LOCATION_TYPE_CHOICES = (
        (
            INFECTION_LOCATION_TYPE_AMBIGUOUS,
            "Lieu ambigu dans l'app mobile version 2.0.45",
        ),
        (INFECTION_LOCATION_TYPE_RESIDENCE, "Lieu de résidence"),
        (INFECTION_LOCATION_TYPE_TEST, "Lieu du test"),
        (INFECTION_LOCATION_TYPE_OTHER, "Autre"),
    )
    infection_location_type = models.TextField(
        "Type d'endroit où l'infection a été rapportée",
        choices=INFECTION_LOCATION_TYPE_CHOICES,
        null=True,
        blank=True,
    )
    infection_location = models.ForeignKey(
        Village,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="infection_cases",
    )
    infection_location_as = models.ForeignKey(
        "geo.AS",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="infection_cases",
    )

    treatment_center = models.TextField("Centre de traitement", null=True, blank=True)
    treatment_start_date = models.DateTimeField(
        "Début de traitement", null=True, blank=True
    )
    treatment_end_date = models.DateTimeField(
        "Fin de traitement", null=True, blank=True
    )
    treatment_prescribed = models.TextField("Prescription", null=True, blank=True)
    treatment_secondary_effects = models.NullBooleanField(
        "Effets Secondaires", blank=True
    )
    treatment_result = models.TextField("Résultat", null=True, blank=True)

    GENERAL_TEST_RESULT_CHOICES = (
        (RES_POSITIVE_POSITIVE_POSITIVE, "Positif +++"),
        (RES_POSITIVE_POSITIVE, "Positif ++"),
        (RES_POSITIVE, "Positif"),
        (RES_NEGATIVE, "Négatif"),
        (RES_ABSENT, "Absent"),
        (RES_MISSING, "Manquant"),
        (RES_UNREADABLE, "Illisible"),
        (RES_INVALID, "Invalide"),
        (RES_UNSURE, "Pas certain"),
    )

    SESSION_TYPE_CHOICES = (
        (SESSION_TYPE_DOOR_TO_DOOR, "Door to door"),
        (SESSION_TYPE_ON_SITE, "On site"),
    )

    test_catt = models.IntegerField(
        "Test CATT", choices=GENERAL_TEST_RESULT_CHOICES, null=True, blank=True
    )
    test_catt_index = models.IntegerField("CATT Card Index", null=True, blank=True)

    test_catt_level = models.IntegerField(
        "CATT positivity level", null=True, blank=True
    )
    test_catt_dilution = models.TextField(
        "Dilution CATT", choices=GENERAL_TEST_RESULT_CHOICES, null=True, blank=True
    )
    test_catt_picture_filename = models.TextField(
        "CATT picture filename", null=True, blank=True
    )
    test_catt_session_type = models.TextField(
        "CATT session type door to door or on site",
        choices=SESSION_TYPE_CHOICES,
        null=True,
        blank=True,
    )
    test_clinical_sickness = models.IntegerField(
        "Maladie clinique", choices=GENERAL_TEST_RESULT_CHOICES, null=True, blank=True
    )
    test_ctcwoo = models.IntegerField(
        choices=GENERAL_TEST_RESULT_CHOICES, null=True, blank=True
    )
    test_ctcwoo_video_filename = models.TextField(
        "filename of CTCWOO test video", null=True, blank=True
    )
    test_dil = models.IntegerField(
        choices=GENERAL_TEST_RESULT_CHOICES, null=True, blank=True
    )
    test_ge = models.IntegerField(
        choices=GENERAL_TEST_RESULT_CHOICES, null=True, blank=True
    )
    test_ifat = models.IntegerField(
        choices=GENERAL_TEST_RESULT_CHOICES, null=True, blank=True
    )
    test_lcr = models.IntegerField(
        choices=GENERAL_TEST_RESULT_CHOICES, null=True, blank=True
    )
    test_lymph_node_puncture = models.IntegerField(
        "Ponction Ganglions", choices=GENERAL_TEST_RESULT_CHOICES, null=True, blank=True
    )
    test_maect = models.IntegerField(
        choices=GENERAL_TEST_RESULT_CHOICES, null=True, blank=True
    )
    test_maect_video_filename = models.TextField(
        "filename of mAECT test video", null=True, blank=True
    )
    test_parasit = models.IntegerField(
        choices=GENERAL_TEST_RESULT_CHOICES, null=True, blank=True
    )
    test_pg = models.IntegerField(
        choices=GENERAL_TEST_RESULT_CHOICES, null=True, blank=True
    )
    test_pg_video_filename = models.TextField(
        "filename of PG test video", null=True, blank=True
    )
    test_pl = models.IntegerField(
        choices=GENERAL_TEST_RESULT_CHOICES, null=True, blank=True
    )
    test_research_pl = models.IntegerField(
        choices=GENERAL_TEST_RESULT_CHOICES, null=True, blank=True
    )
    test_ielisa = models.IntegerField(
        choices=GENERAL_TEST_RESULT_CHOICES, null=True, blank=True
    )
    test_rdt = models.IntegerField(
        choices=GENERAL_TEST_RESULT_CHOICES, null=True, blank=True
    )
    test_rdt_session_type = models.TextField(
        "RDT session type door to door or on site",
        choices=SESSION_TYPE_CHOICES,
        null=True,
        blank=True,
    )
    test_rdt_picture_filename = models.TextField(
        "RDT picture filename", null=True, blank=True
    )
    test_sf = models.IntegerField(
        choices=GENERAL_TEST_RESULT_CHOICES, null=True, blank=True
    )
    test_sternal_puncture = models.IntegerField(
        "Test Ponction Sternale",
        choices=GENERAL_TEST_RESULT_CHOICES,
        null=True,
        blank=True,
    )
    test_other = models.IntegerField(
        "Autre test", choices=GENERAL_TEST_RESULT_CHOICES, null=True, blank=True
    )

    # Some of these could be used for validating the correctness of the pl_result.
    # The pl_result field is the only one of this that is actually used for aggregation.
    test_pl_liquid = models.TextField(null=True, blank=True)
    test_pl_trypanosome = models.TextField(null=True, blank=True)
    test_pl_gb_mm3 = models.TextField(null=True, blank=True)
    test_pl_albumine = models.TextField(null=True, blank=True)
    test_pl_lcr = models.TextField(null=True, blank=True)
    test_pl_comments = models.TextField(
        "Commentaire Ponction Lombaire", null=True, blank=True
    )
    test_pl_video_filename = models.TextField(
        "filename of PL test video", null=True, blank=True
    )
    PL_TEST_RESULT_CHOICES = (
        ("stage1", "Stage1"),
        ("stage2", "Stage2"),
        ("unknown", "Inconnu"),
    )
    test_pl_result = models.TextField(
        "Résultat de test PL", choices=PL_TEST_RESULT_CHOICES, null=True, blank=True
    )

    followup_done = models.NullBooleanField("Suivi effectué", blank=True)

    # fields for followup tests
    test_followup_pg = models.TextField("Suivi PG", null=True, blank=True)
    test_followup_sf = models.TextField("Suivi SF", null=True, blank=True)
    test_followup_ge = models.TextField("Suivi GE", null=True, blank=True)
    test_followup_woo = models.TextField("Suivi WOO", null=True, blank=True)
    test_followup_maect = models.TextField("Suivi MAECT", null=True, blank=True)
    test_followup_woo_maect = models.TextField("Suivi WOO MAECT", null=True, blank=True)
    test_followup_pl = models.TextField("Suivi PL", null=True, blank=True)
    test_followup_pl_trypanosome = models.TextField(
        "Suivi PL trypanosome", null=True, blank=True
    )
    test_followup_pl_gb = models.TextField("Suivi PL GB", null=True, blank=True)
    test_followup_decision = models.TextField("Suivi décision", null=True, blank=True)

    confirmed_case = models.NullBooleanField("Cas confirmé", default=False)
    # log field: used to know how many times has been updated
    version_number = models.PositiveIntegerField(default=0)
    mark_for_deletion = models.BooleanField(
        "Item is marked for deletion", default=False
    )

    latest_test_date = models.DateTimeField(null=True, blank=True, db_index=True)
    user_type = models.TextField(
        "Type d'utilisateur", choices=USER_TYPE_CHOICES, null=True, blank=True,
    )
    FILTER_ANY_PICTURE_FILENAME = Q(
        Q(test_catt_picture_filename__isnull=False)
        | Q(test_rdt_picture_filename__isnull=False)
    )
    FILTER_NO_PICTURE_FILENAME = Q(
        Q(test_catt_picture_filename__isnull=True)
        & Q(test_rdt_picture_filename__isnull=True)
    )
    FILTER_ANY_VIDEO_FILENAME = Q(
        Q(test_ctcwoo_video_filename__isnull=False)
        | Q(test_maect_video_filename__isnull=False)
        | Q(test_pg_video_filename__isnull=False)
        | Q(test_pl_video_filename__isnull=False)
    )
    FILTER_NO_VIDEO_FILENAME = Q(
        Q(test_ctcwoo_video_filename__isnull=True)
        & Q(test_maect_video_filename__isnull=True)
        & Q(test_pg_video_filename__isnull=True)
        & Q(test_pl_video_filename__isnull=True)
    )

    class Meta:
        abstract = True
        ordering = ["-id"]
        permissions = CASES_PERMISSIONS

    def confirmed(self):
        if self.test_pl == RES_POSITIVE:
            return True
        if self.test_research_pl == RES_POSITIVE:
            return True
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

    def update_from_test(self, new_test):
        """
        This method updates the Case with the new data from the test. This is not used in the regular tablet import
        flow but rather when manually typing in data and the test information doesn't flow from case to test but from
        test to case.
        :param new_test: test to update into Case
        :return: Nothing
        """
        if new_test.type == CATT:
            self.test_catt = new_test.result
            self.test_catt_level = new_test.level
            self.test_catt_index = new_test.index
            self.test_catt_picture_filename = new_test.image_filename
        elif new_test.type == IELISA:
            self.test_ielisa = new_test.result
        elif new_test.type == RDT:
            self.test_rdt = new_test.result
            self.test_rdt_picture_filename = new_test.image_filename
        elif new_test.type == PG:
            self.test_pg = new_test.result
            self.test_pg_video_filename = new_test.video_filename
        elif new_test.type == PL:
            self.test_pl = new_test.result
            self.test_pl_video_filename = new_test.video_filename
        elif new_test.type == RESEARCH_PL:
            self.test_research_pl = new_test.result
        elif new_test.type == CTCWOO:
            self.test_ctcwoo = new_test.result
            self.test_ctcwoo_video_filename = new_test.video_filename
        elif new_test.type == MAECT:
            self.test_maect = new_test.result
            self.test_maect_video_filename = new_test.video_filename
        elif new_test.type == SF:
            self.test_sf = new_test.result
        elif new_test.type == GE:
            self.test_ge = new_test.result
        elif new_test.type == SP:
            self.test_sp = new_test.result
        elif new_test.type == IFAT:
            self.test_ifat = new_test.result
        elif new_test.type == LCR:
            self.test_lcr = new_test.result
        elif new_test.type == DIL:
            self.test_dil = new_test.result
        elif new_test.type == LNP:
            self.test_lnp = new_test.result
        elif new_test.type == PARASIT:
            self.test_parasit = new_test.result
        elif new_test.type == CLINICAL_SICKNESS:
            self.test_clinical_sickness = new_test.result
        else:
            logger.warning(f"Unhandled test type {new_test.type}, ignoring")

    def __str__(self):
        return "%s - %s - %s" % (self.lastname, self.postname, self.prename)


class Case(CaseAbstract):
    """
    Implements :class:`hat.cases.models.CaseAbstract`

    **Permissions**

    - **import**            -- Can import data.
    - **import_reconciled** -- Can import reconciliation data.
    - **export**            -- Can export anonymized cases data.
    - **export_full**       -- Can export non anonymized cases data.
    - **view**              -- Can view anonymized cases data.
    - **view_full**         -- Can view non anonymized cases data.

    """

    class Meta:
        abstract = False
        ordering = ["-id"]
        permissions = CASES_PERMISSIONS

        indexes = [models.Index(fields=["device_id"], name="device_id_idx")]

    def as_dict(self, full=False, additional_fields=None):
        # Location
        normalized_as_dict = {
            "normalized_village_not_found": self.normalized_village_not_found
        }
        if self.normalized_AS:
            if isinstance(self, CaseView):
                ZS = self.normalized_zs_name
                AS = self.normalized_as_name
                province = self.normalized_province_name
            else:
                # It might be good to prefetch_related these fields
                ZS = self.normalized_AS.ZS.name
                AS = self.normalized_AS.name
                province = self.normalized_AS.ZS.province.name
            normalized_as_dict["as"] = self.normalized_AS.as_dict()
        else:
            ZS = self.ZS
            AS = self.AS
            province = self.province
        if self.normalized_village:
            village = self.normalized_village.name
            normalized_as_dict["village_id"] = self.normalized_village_id
            normalized_as_dict["village"] = self.normalized_village.as_dict()
        else:
            village = self.village

        device = None
        try:
            if self.device_id:
                device = DeviceDB.objects.get(device_id=self.device_id).as_dict(
                    full=True
                )
        except DeviceDB.DoesNotExist:
            pass

        d = {
            "id": self.id,
            "document_date": self.document_date,
            "location": {
                "normalized": normalized_as_dict,
                "ZS": ZS,
                "AS": AS,
                "village": village,
                "province": province,
                "record_location": {"lat": self.latitude, "long": self.longitude},
            },
            "user_type": self.user_type,
            "patient": self.normalized_patient.as_dict(),
            "hat_id": self.hat_id,
            "hat_document_id": self.document_id,
            "device_id": self.device_id,
            "device": device,
            "form_number": self.form_number,
            "form_year": self.form_year,
            "team": {
                "mobile_unit": self.mobile_unit,
                "normalized_team": self.normalized_team.as_dict_without_as()
                if self.normalized_team
                else None,
            },
            "source": self.source,
            "test_catt_session_type": self.test_catt_session_type,
            "test_pl_albumine": self.test_pl_albumine,
            "test_pl_gb_mm3": self.test_pl_gb_mm3,
            "test_pl_result": self.test_pl_result,
            "test_pl_lcr": self.test_pl_lcr,
            "test_pl_trypanosome": self.test_pl_trypanosome,
            "test_pl_comments": self.test_pl_comments,
            "circumstances_da_um": self.circumstances_da_um,
            "circumstances_dp_um": self.circumstances_dp_um,
            "circumstances_dp_cdtc": self.circumstances_dp_cdtc,
            "circumstances_dp_cs": self.circumstances_dp_cs,
            "circumstances_dp_hgr": self.circumstances_dp_hgr,
            "screening_type": self.screening_type,
            "latest_test_date": self.latest_test_date,
            "normalized_date": self.normalized_date
            if hasattr(self, "normalized_date")
            else (
                self.latest_test_date if self.latest_test_date else self.document_date
            ),
            "infection_location": self.infection_location.as_short_dict()
            if self.infection_location
            else None,
            "infection_location_as": self.infection_location_as.as_dict()
            if self.infection_location_as
            else None,
            "infection_location_type_display": self.get_infection_location_type_display(),
            "infection_location_type": self.infection_location_type,
        }

        if self.mark_for_deletion:
            d["mark_for_deletion"] = self.mark_for_deletion
            d["has_jsondocument"] = self.jsondocument_set.exists()

        if full and self.test_set:
            # Test results
            tests = [
                test.as_dict() if full else {"id": test.id, "date": test.date}
                for test in self.test_set.all()
            ]
            tests.sort(
                key=lambda item: item["date"] if item["date"] else ""
            )  # bisect.insort() doesn't play well with lists of dicts
            d["tests"] = tests

        # include fields that were added through annotate
        if additional_fields:
            for field in additional_fields:
                if hasattr(self, field):
                    d[field] = getattr(self, field)

        return d

    @classmethod
    def query_date_range(cls, queryset, date_from, date_to):
        if date_from or date_to:
            queryset = queryset.annotate(
                normalized_date_for_range=Coalesce("latest_test_date", "document_date")
            )
        if date_from:
            queryset = queryset.filter(normalized_date_for_range__gte=date_from)
        if date_to:
            queryset = queryset.filter(
                normalized_date_for_range__lte=datetime.strptime(date_to, DATE_FORMAT)
                + timedelta(days=1)
            )
        return queryset


def compute_confirmation(sender, instance: Case, **kwargs):
    instance.confirmed_case = instance.confirmed()


models.signals.pre_save.connect(compute_confirmation, sender=Case)


@receiver(pre_save, sender=Case)
def increase_case_version_number(sender, instance, *args, **kwargs):  # type: ignore
    instance.version_number = instance.version_number + 1


class CaseView(CaseAbstract):
    """
    References a postgresql view that extends :class:`hat.cases.models.CaseAbstract`
    with calculated properties.

    :ivar datetime document_date_day:   Taken **document_date** goes to the beginning of the day.
    :ivar datetime document_date_month: Taken **document_date** goes to the beginning of the month.
    :ivar datetime document_date_year:  Taken **document_date** goes to the beginning of the year.

    :ivar integer document_day:   Extracts **document_date** day.
    :ivar integer document_month: Extracts **document_date** month.
    :ivar integer document_year:  Extracts **document_date** year.

    :ivar text full_name:     Concats **lastname** **prename** **postname**.
    :ivar text full_location: Concats **province** - **ZS** - **AS** - **village**.

    :ivar integer screening_result: Takes the most significant result of the
        screening tests.

    :ivar integer confirmation_result: Takes the most significant result of the
        confirmation tests.

    :ivar text stage_result: Renames **test_pl_result**.

    .. seealso:: :any:`hat.cases.filters` to get the list of test classification.

    """

    # Avoid confusion with Case in reverse mapping
    infection_location = models.ForeignKey(
        Village, null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    infection_location_as = models.ForeignKey(
        "geo.AS", null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )

    # calculated fields
    document_date_day = models.DateTimeField(null=True)
    document_date_month = models.DateTimeField(null=True)
    document_date_year = models.DateTimeField(null=True)
    document_day = models.PositiveSmallIntegerField(null=True)
    document_month = models.PositiveSmallIntegerField(null=True)
    document_year = models.PositiveSmallIntegerField(null=True)

    normalized_date = models.DateTimeField(null=True)
    normalized_year = models.PositiveSmallIntegerField(null=True)
    normalized_month = models.PositiveSmallIntegerField(null=True)
    normalized_date_day = models.DateTimeField(null=True)
    normalized_date_month = models.DateTimeField(null=True)
    normalized_date_year = models.DateTimeField(null=True)

    full_name = models.TextField(null=True)
    full_location = models.TextField(null=True)
    normalized_province_name = models.TextField(null=True)
    normalized_zs_name = models.TextField(null=True)
    normalized_as_name = models.TextField(null=True)
    normalized_village_name = models.TextField(null=True)
    normalized_team_name = models.TextField(null=True)

    screening_result = models.IntegerField(null=True)
    confirmation_result = models.IntegerField(null=True)
    stage_result = models.TextField(null=True)

    approx_age = models.IntegerField(null=True)

    class Meta:
        managed = False
        db_table = "cases_case_view"
        # ordering = ['-document_date']
        permissions = CASES_PERMISSIONS

    def as_dict(self, full=False, additional_fields=None):
        return dict(
            Case.as_dict(self, full, additional_fields=additional_fields),
            **{
                "normalized_year": self.normalized_year,
                "normalized_province_name": self.normalized_province_name,
                "normalized_zs_name": self.normalized_zs_name,
                "normalized_as_name": self.normalized_as_name,
                "normalized_village_name": self.normalized_village_name,
                "normalized_team_name": self.normalized_team_name,
            },
        )

    caseview_additional_fields = [
        "normalized_village_name",
        "normalized_as_name",
        "normalized_zs_name",
        "normalized_province_name",
        "normalized_year",
        "normalized_team_name",
    ]

    @staticmethod
    def add_caseview_fields_to_case_queryset(queryset):
        result = queryset.annotate(
            normalized_team_name=Coalesce(
                Cast("normalized_team__name", models.TextField()), "mobile_unit"
            )
        )
        result = result.annotate(
            normalized_village_name=Coalesce(
                Cast("normalized_village__name", models.TextField()), "village"
            )
        )
        result = result.annotate(
            normalized_as_name=Coalesce(
                Cast("normalized_AS__name", models.TextField()), "AS"
            )
        )
        result = result.annotate(
            normalized_zs_name=Coalesce(
                Cast("normalized_AS__ZS__name", models.TextField()), "ZS"
            )
        )
        result = result.annotate(
            normalized_province_name=Coalesce(
                Cast("normalized_AS__ZS__province__name", models.TextField()),
                "province",
            )
        )
        result = result.annotate(
            normalized_year=Coalesce(
                Cast(ExtractYear("document_date"), models.PositiveSmallIntegerField()),
                "form_year",
            )
        )
        result = result.annotate(
            confirmation_result=Greatest(
                "test_pg",
                "test_ctcwoo",
                "test_maect",
                "test_pl",
                "test_ge",
                "test_lcr",
                "test_sf",
            )
        )
        result = result.annotate(
            screening_result=Greatest("test_catt", "test_rdt", "test_ielisa")
        )
        result = result.annotate(
            normalized_date=Coalesce("latest_test_date", "document_date")
        )
        return result

    @classmethod
    def query_date_range(cls, queryset, date_from, date_to):
        if date_from:
            queryset = queryset.filter(normalized_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(
                normalized_date__lte=datetime.strptime(date_to, DATE_FORMAT)
                + timedelta(days=1)
            )
        return queryset


class Location(models.Model):
    """
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
    """

    province = models.TextField(null=True)
    province_old = models.TextField(null=True)
    ZS = models.TextField(null=True)
    AS = models.TextField(null=True)
    AS_alt = models.TextField(null=True)
    village = models.TextField(null=True)
    village_alt = models.TextField(null=True)
    village_type = models.TextField(null=True)
    VILLAGE_OFFICIAL_CHOICES = (
        ("YES", "Villages from Z.S."),
        ("NO", "Villages not from Z.S."),
        ("OTHER", "Locations where people are found during campaigns"),
        ("NA", "Villages from satellite (unknown)"),
    )
    village_official = models.TextField(choices=VILLAGE_OFFICIAL_CHOICES, null=True)

    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True)
    gps_source = models.TextField(null=True)

    population = models.PositiveIntegerField(null=True)
    population_source = models.TextField(null=True)
    population_year = models.PositiveIntegerField(null=True)
    already_put_in_normalized_form = models.BooleanField(default=False)

    class Meta:
        permissions = (("import_locations", "Can import location data"),)

    def __str__(self):
        return "%s - %s - %s - %s" % (self.village, self.AS, self.ZS, self.village_type)


class TestGroup(models.Model):
    type = models.TextField()
    cases = models.ManyToManyField("Case")
    group_id = models.TextField(db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return "%s - %s - %s" % (self.type, self.group_id, self.created_at)
