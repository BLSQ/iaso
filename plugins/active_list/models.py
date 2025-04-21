from django.db import models
from iaso.models import OrgUnit

VALIDATION_STATUS_WAITING_FOR_VALIDATION = "WAITING_FOR_VALIDATION"
VALIDATION_STATUS_DISTRICT_VALIDATED = "DISTRICT_VALIDATED"
VALIDATION_STATUS_REGION_VALIDATED = "REGION_VALIDATED"

VALIDATION_STATUS_CHOICES = [
    (VALIDATION_STATUS_WAITING_FOR_VALIDATION, "En attente de Validation"),
    (VALIDATION_STATUS_DISTRICT_VALIDATED, "Validé par District"),
    (VALIDATION_STATUS_REGION_VALIDATED, "Validé par la Région"),
]

VALIDATION_OK = "OK"
VALIDATION_INVALID = "INVALID"

VALIDATION_CHOICES = [
    (VALIDATION_OK, "Validé"),
    (VALIDATION_INVALID, "Invalide"),
]

LEVEL_REGION = "REGION"
LEVEL_DISTRICT = "DISTRICT"

LEVEL_CHOICES = [
    (LEVEL_REGION, "Région"),
    (LEVEL_DISTRICT, "District"),
]

SEX_MALE = "MALE"
SEX_FEMALE = "FEMALE"

SEX_CHOICES = [
    (SEX_MALE, "H"),
    (SEX_FEMALE, "F"),
]

HIV_HIV1 = "HIV1"
HIV_HIV2 = "HIV2"
HIV_HIV1_AND_2 = "HIV 1&2"
HIV_UNKNOWN = "UNKNOWN"

HIV_CHOICES = [
    (HIV_HIV1, "VIH 1"),
    (HIV_HIV2, "VIH 2"),
    (HIV_HIV1_AND_2, "VIH 1+ VIH 2"),
    (HIV_UNKNOWN, ""),
]

SOURCE_IASO = "IASO"
SOURCE_EXCEL = "EXCEL"

SOURCE_CHOICES = [
    (SOURCE_IASO, "IASO"),
    (SOURCE_EXCEL, "Excel"),
]

TREATMENT_1STLINE = "1STLINE"
TREATMENT_2NDLINE = "2NDLINE"
TREATMENT_3RDLINE = "3RDLINE"

TREATMENT_CHOICES = [
    (TREATMENT_1STLINE, "1er Ligne"),
    (TREATMENT_2NDLINE, "2e Ligne"),
    (TREATMENT_3RDLINE, "3e Ligne"),
]


class Import(models.Model):
    id = models.AutoField(primary_key=True)  # Django handles auto-incrementing IDs
    org_unit = models.ForeignKey(OrgUnit, on_delete=models.CASCADE)
    month = models.CharField(max_length=255, null=False)  # Use CharField for text
    creation_date = models.DateTimeField(auto_now_add=True)  # Sets current time on creation
    source = models.CharField(max_length=255, null=False)

    # additional information for Excel imports
    hash_key = models.TextField(null=False)
    file_name = models.TextField(unique=True, null=False)
    file_check = models.TextField(null=False)
    on_time = models.BooleanField(default=False)

    class Meta:
        db_table = "import"


class ActivePatientsList(models.Model):
    number = models.IntegerField(null=False, verbose_name="Numéro")
    region = models.TextField(null=False, verbose_name="Région")
    district = models.TextField(null=False, verbose_name="District")
    code_ets = models.CharField(max_length=255, null=False, verbose_name="Code ETS")
    facility_name = models.TextField(null=False, verbose_name="Nom de l'établissement")
    period = models.TextField(db_index=True, verbose_name="Période")
    identifier_code = models.CharField(max_length=255, null=False, db_index=True, verbose_name="Code identifiant")
    sex = models.TextField(choices=SEX_CHOICES, verbose_name="Sexe")
    age = models.IntegerField(verbose_name="Âge")
    weight = models.IntegerField(null=True, verbose_name="Poids")
    new_inclusion = models.BooleanField(verbose_name="Nouvelle inclusion")
    transfer_in = models.BooleanField(verbose_name="Transfert entrant")
    return_to_care = models.BooleanField(verbose_name="Retour aux soins")
    tb_hiv = models.BooleanField(verbose_name="TB/VIH")  # patient has HIV and Tuberculosis
    hiv_type = models.TextField(choices=HIV_CHOICES, verbose_name="Type de VIH")
    treatment_line = models.TextField(choices=TREATMENT_CHOICES, verbose_name="Ligne de traitement")

    last_dispensation_date = models.DateField(null=True, verbose_name="Date de dernière dispensation")
    days_dispensed = models.IntegerField(null=True, verbose_name="Jours dispensés")
    next_dispensation_date = models.DateField(null=True, verbose_name="Date de prochaine dispensation")
    regimen = models.TextField(null=True, verbose_name="Régime")
    stable = models.IntegerField(null=True, verbose_name="Stable")  # Needs further clarification for better naming

    discontinuation_date = models.DateField(null=True, blank=True, verbose_name="Date d'arrêt du traitement")
    arv_stock_days = models.IntegerField(null=True, blank=True, verbose_name="Jours de stock ARV")  # arv is anti retro viral

    # leaving
    transfer_out = models.BooleanField(verbose_name="Transfert sortant")
    death = models.BooleanField(verbose_name="Décès")
    art_stoppage = models.BooleanField(verbose_name="Arrêt du traitement ARV")  # stoppage for anti retro viral therapy
    served_elsewhere = models.BooleanField(verbose_name="Soigné ailleurs")

    active = models.BooleanField(default=True, verbose_name="Actif")  # denormalized information
    import_source = models.ForeignKey(Import, on_delete=models.CASCADE, choices=SOURCE_CHOICES, verbose_name="Source d'importation")
    validation_status = models.CharField(
        max_length=255, null=True, choices=VALIDATION_STATUS_CHOICES, default="WAITING_FOR_VALIDATION", verbose_name="Statut de validation"
    )
    org_unit = models.ForeignKey(OrgUnit, on_delete=models.CASCADE, verbose_name="Unité organisationnelle")
    received_arv = models.BooleanField(default=False, verbose_name="ARV reçu")
    disappeared = models.BooleanField(default=False, verbose_name="Disparu")

    # cas aes ou patient mobile: what does it mean?
    class Meta:
        db_table = "active_list"  # Optional: to match the exact table name


PATIENT_LIST_DISPLAY_FIELDS = {
    "number": "Index",
    #  "region": "Région",
    # "district": "District",
    #  "code_ets": "Code établissement",
    #  "facility_name": "Nom établissement",
    #   "period": "Période",
    "identifier_code": "Code identificateur",
    "sex": "Sexe",
    "age": "Âge",
    "weight": "Poids",
    "new_inclusion": "Nouvelle inclusion",
    "transfer_in": "Transfert entrant",
    "return_to_care": "Retour aux soins",
    "tb_hiv": "TB/VIH",
    "hiv_type": "Type de VIH",
    "treatment_line": "Ligne de traitement",
    "last_dispensation_date": "Date de dernière dispensation",
    "days_dispensed": "Jours dispensés",
    "regimen": "Régime",
    "stable": "Stable",
    "transfer_out": "Transfert sortant",
    "death": "Décès",
    "art_stoppage": "Arrêt du TAR",
    "served_elsewhere": "Servi ailleurs",
    "active": "Actif",
}

PATIENT_HISTORY_DISPLAY_FIELDS = {
    #  "region": "Région",
    # "district": "District",
    #  "code_ets": "Code établissement",
    #  "facility_name": "Nom établissement",
    "sex": "Sexe",
    "age": "Âge",
    "weight": "Poids",
    "new_inclusion": "Nouvelle inclusion",
    "transfer_in": "Transfert entrant",
    "return_to_care": "Retour aux soins",
    "tb_hiv": "TB/VIH",
    "hiv_type": "Type de VIH",
    "treatment_line": "Ligne de traitement",
    "last_dispensation_date": "Date de dernière dispensation",
    "days_dispensed": "Jours dispensés",
    "regimen": "Régime",
    "stable": "Stable",
    "transfer_out": "Transfert sortant",
    "death": "Décès",
    "art_stoppage": "Arrêt du TAR",
    "served_elsewhere": "Servi ailleurs",
    "active": "Actif",
}
SEARCH_LIST_DISPLAY_FIELDS = {
    "identifier_code": "Code identificateur",
    "sex": "Sexe",
    "age": "Âge",
    "weight": "Poids",
}

class Validation(models.Model):
    source_import = models.ForeignKey(Import, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    user_id = models.IntegerField(null=False)
    user_name = models.CharField(max_length=255, null=False)
    level = models.CharField(max_length=255, null=False, choices=LEVEL_CHOICES, verbose_name="Niveau de Validation")
    comment = models.TextField(verbose_name="Commentaire")
    validation_status = models.CharField(max_length=255, null=True, choices=VALIDATION_CHOICES, verbose_name="Statut")

    class Meta:
        db_table = "validation"  # Optional: to match the exact table name


class Month(models.Model):
    value = models.CharField(max_length=10, null=False, blank=False, unique=True)
