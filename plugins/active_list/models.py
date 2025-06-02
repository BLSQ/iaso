import datetime

from django.contrib.auth.models import User
from django.db import models

from iaso.models import Entity, OrgUnit, Instance

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
TREATMENT_LINE_UNKNOWN = "UNKNOWN"

TREATMENT_CHOICES = [
    (TREATMENT_1STLINE, "1er Ligne"),
    (TREATMENT_2NDLINE, "2e Ligne"),
    (TREATMENT_3RDLINE, "3e Ligne"),
    (TREATMENT_LINE_UNKNOWN, "Inconnu"),
]

INACTIVE_DEATH = "DEATH"
INACTIVE_LOST = "LOST"
INACTIVE_ART_STOPPAGE = "ART_STOPPAGE"
INACTIVE_TRANSFER = "TRANSFER"

INACTIVE_REASONS = [
    (INACTIVE_DEATH, "Décès"),
    (INACTIVE_LOST, "Perte de suivi"),
    (INACTIVE_ART_STOPPAGE, "Arrêt du traitement ARV"),
    (INACTIVE_TRANSFER, "Transfert"),
]


class Import(models.Model):
    id = models.AutoField(primary_key=True)  # Django handles auto-incrementing IDs
    org_unit = models.ForeignKey(OrgUnit, on_delete=models.CASCADE)
    month = models.CharField(max_length=255, null=False)  # Use CharField for text
    creation_date = models.DateTimeField(auto_now_add=True)  # Sets current time on creation
    source = models.CharField(max_length=255, null=False)

    # additional information for Excel imports
    hash_key = models.TextField(null=True)
    file_name = models.TextField(unique=True, null=True)
    file = models.FileField(upload_to="uploads/%Y/%m/%d/", null=True)
    file_check = models.TextField(null=True)
    on_time = models.BooleanField(default=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True)


class Patient(models.Model):
    identifier_code = models.CharField(
        max_length=255, null=False, db_index=True, verbose_name="Code identifiant", unique=True
    )
    last_record = models.ForeignKey(
        "Record", on_delete=models.CASCADE, null=True, blank=True, related_name="last_record"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    active = models.BooleanField(default=True, verbose_name="Actif")
    loss_date = models.DateField(null=True, blank=True, verbose_name="Date de perte de suivi")
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return self.identifier_code

    def evaluate_loss(self, save=True):
        """
        Evaluate if the patient is lost based on the last record's discontinuation date.
        """
        print(
            "Evaluating loss for patient:",
            self.identifier_code,
            "Active status:",
            self.active,
            "last_record:",
            self.last_record,
        )
        if self.active and self.last_record and self.last_record.next_dispensation_date:
            print(
                "Last record next_dispensation_date:",
                self.last_record.next_dispensation_date,
                datetime.date.today() - datetime.timedelta(days=28),
            )
            if self.last_record.next_dispensation_date < datetime.date.today() - datetime.timedelta(days=28):
                self.loss_date = self.last_record.next_dispensation_date + datetime.timedelta(days=28)
                self.active = False

                if save:
                    event = PatientInactiveEvent(
                        patient=self,
                        org_unit=self.last_record.org_unit,
                        date=self.last_record.next_dispensation_date + datetime.timedelta(days=28),
                        last_patient_record_at_time_of_loss=self.last_record,
                        reason=INACTIVE_LOST,
                    )
                    event.save()
                    print("Patient inactive event saved:", event)
                    self.save()

        return self.active


class PatientInactiveEvent(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="lost_event")
    org_unit = models.ForeignKey(OrgUnit, on_delete=models.CASCADE, verbose_name="Unité organisationnelle")
    date = models.DateField(verbose_name="Date de perte de suivi")
    last_patient_record_at_time_of_loss = models.ForeignKey(
        "Record", on_delete=models.CASCADE, null=True, blank=True, related_name="last_patient_record_at_time_of_loss"
    )
    reason = models.TextField(verbose_name="Raison de la perte de suivi", choices=INACTIVE_REASONS)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Patient {self.patient.identifier_code} inactive on {self.date} for reason {self.reason}"


class Record(models.Model):
    number = models.IntegerField(null=False, verbose_name="Numéro")
    region = models.TextField(null=False, verbose_name="Région")
    district = models.TextField(null=False, verbose_name="District")
    code_ets = models.CharField(max_length=255, null=False, verbose_name="Code ETS")
    facility_name = models.TextField(null=False, verbose_name="Nom de l'établissement")
    period = models.TextField(db_index=True, verbose_name="Période")
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="patient")
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
    arv_stock_days = models.IntegerField(
        null=True, blank=True, verbose_name="Jours de stock ARV"
    )  # arv is anti retro viral
    received_arv = models.BooleanField(default=False, verbose_name="ARV reçu")

    # leaving
    transfer_out = models.BooleanField(verbose_name="Transfert sortant")
    death = models.BooleanField(verbose_name="Décès")
    art_stoppage = models.BooleanField(verbose_name="Arrêt du traitement ARV")  # stoppage for anti retro viral therapy
    served_elsewhere = models.BooleanField(verbose_name="Soigné ailleurs")

    import_source = models.ForeignKey(
        Import, on_delete=models.CASCADE, choices=SOURCE_CHOICES, verbose_name="Source d'importation"
    )

    org_unit = models.ForeignKey(
        OrgUnit, on_delete=models.CASCADE, verbose_name="Unité organisationnelle", related_name="records"
    )

    instance = models.ForeignKey(
        Instance, on_delete=models.CASCADE, verbose_name="Soumission", related_name="records", null=True
    )

PATIENT_LIST_DISPLAY_FIELDS = {
    "number": "Index",
    #  "region": "Région",
    # "district": "District",
    #  "code_ets": "Code établissement",
    #  "facility_name": "Nom établissement",
    #   "period": "Période",
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
}
SEARCH_LIST_DISPLAY_FIELDS = {
    "identifier_code": "Code identificateur",
    "sex": "Sexe",
    "age": "Âge",
    "weight": "Poids",
}


class Validation(models.Model):
    period = models.TextField(db_index=True, verbose_name="Période")
    org_unit = models.ForeignKey(OrgUnit, on_delete=models.CASCADE, verbose_name="Unité d'organisation")
    created_at = models.DateTimeField(auto_now_add=True)
    user_id = models.IntegerField(null=False)
    user_name = models.CharField(max_length=255, null=False)
    level = models.CharField(max_length=255, null=False, choices=LEVEL_CHOICES, verbose_name="Niveau de Validation")
    comment = models.TextField(verbose_name="Commentaire")
    validation_status = models.CharField(max_length=255, null=True, choices=VALIDATION_CHOICES, verbose_name="Statut")
