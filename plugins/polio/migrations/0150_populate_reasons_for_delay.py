from django.db import migrations, models

from plugins.polio.models import DelayReasons

TRANSLATIONS = {
    "INITIAL_DATA": {"en": "Initial data", "fr": "Données initiales"},
    "ENCODING_ERROR": {"en": "Encoding error", "fr": "Erreur d'encodage"},
    "PUBLIC_HOLIDAY": {"en": "Delayed to observe public holiday", "fr": "Retardé pour observer un jour férié"},
    "OTHER_ACTIVITIES": {
        "en": "Integrate with other vaccination activities",
        "fr": "Intégration à d'autres activités de vaccination",
    },
    "MOH_DECISION": {"en": "Decision from MOH", "fr": "Décision du Ministère de la Santé"},
    "CAMPAIGN_SYNCHRONIZATION": {"en": "Campaigns synchronization", "fr": "Synchonisation des campagnes"},
    "PREPAREDNESS_LEVEL_NOT_REACHED": {
        "en": "Preparedness level not reached",
        "fr": "Niveau de préparation non-atteint",
    },
    "FUNDS_NOT_RECEIVED_OPS_LEVEL": {
        "en": "Funds not received at operational level",
        "fr": "Fonds non reçus au niveau opérationnel",
    },
    "FUNDS_NOT_ARRIVED_IN_COUNTRY": {"en": "Funds not arrived in country", "fr": "Fonds non arrivés dans le pays"},
    "VACCINES_NOT_DELIVERED_OPS_LEVEL": {
        "en": "Vaccines not delivered at operational level",
        "fr": "Vaccins non délivrés au niveau opérationnel",
    },
    "VACCINES_NOT_ARRIVED_IN_COUNTRY": {
        "en": "Vaccines not arrived in country",
        "fr": "Vaccins non arrivés dans le pays",
    },
    "SECURITY_CONTEXT": {"en": "Security context", "fr": "Contexte sécuritaire"},
    "CAMPAIGN_MOVED_FORWARD_BY_MOH": {
        "en": "Campaign moved forward by MOH",
        "fr": "Campagne avancée par le Ministère de la Santé",
    },
    "VRF_NOT_SIGNED": {"en": "VRF not signed", "fr": "VRF non signée"},
    "FOUR_WEEKS_GAP_BETWEEN_ROUNDS": {
        "en": "Four weeks gap between rounds to be respected",
        "fr": "Intervalle de 4 semaines entre les rounds à respecter",
    },
    "OTHER_VACCINATION_CAMPAIGNS": {"en": "Other vaccination campaigns", "fr": "Autres campagnes de vaccination"},
    "PENDING_LIQUIDATION_OF_PREVIOUS_SIA_FUNDING": {
        "en": "Pending liquidation of previous SIA funding",
        "fr": "Liquidation des fonds de la SIA précédente en attente",
    },
}


def create_reasons_for_delay(apps, schema_editor):
    ReasonForDelay = apps.get_model("polio", "ReasonForDelay")
    Account = apps.get_model("iaso", "Account")
    polio_account = Account.objects.filter(pk=1).first()
    if polio_account:
        text_choice_keys = [choice.name for choice in DelayReasons]
        for choice_key in text_choice_keys:
            ReasonForDelay.objects.create(
                key_name=choice_key,
                name_en=TRANSLATIONS[choice_key]["en"],
                name_fr=TRANSLATIONS[choice_key]["fr"],
                account=polio_account,
            )
        RoundDateHistoryEntry = apps.get_model("polio", "RoundDateHistoryEntry")
        round_date_history_entries = RoundDateHistoryEntry.objects.all()
        for entry in round_date_history_entries:
            reason_for_delay = ReasonForDelay.objects.filter(key_name=entry.reason).first()
            entry.reason_for_delay = reason_for_delay
            entry.save()


def remove_reasons_for_delay(apps, schema_editor):
    ReasonForDelay = apps.get_model("polio", "ReasonForDelay")
    reasons_for_delay = ReasonForDelay.objects.all()
    for reason in reasons_for_delay:
        reason.delete()


class Migration(migrations.Migration):
    dependencies = [
        ("polio", "0149_auto_20231012_1456"),
    ]

    operations = [migrations.RunPython(create_reasons_for_delay, remove_reasons_for_delay)]
