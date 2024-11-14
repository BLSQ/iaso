import logging
from datetime import datetime, timedelta
from beanstalk_worker import task_decorator
from plugins.polio.api.vaccines.stock_management import VaccineStockCalculator
from plugins.polio.models import Round, VaccineStock, VaccineStockHistory
from plugins.polio.models.base import VACCINES
from django.db.models import Q
from django.db.utils import IntegrityError


logger = logging.getLogger(__name__)


def archive_stock_for_round(round, vaccine_stock, reference_date, country=None):
    vaccine_stock_for_vaccine = vaccine_stock
    if not country:
        vaccine_stock_for_vaccine = vaccine_stock_for_vaccine.filter(country=round.campaign.country.id)

    if vaccine_stock_for_vaccine.exists():
        vaccine_stock_for_vaccine = vaccine_stock_for_vaccine.first()
        calculator = VaccineStockCalculator(vaccine_stock_for_vaccine)
        total_usable_vials_in, total_usable_doses_in = calculator.get_total_of_usable_vials(reference_date)
        total_unusable_vials_in, total_unusable_doses_in = calculator.get_total_of_unusable_vials(reference_date)
        try:
            VaccineStockHistory.objects.create(
                vaccine_stock=vaccine_stock_for_vaccine,
                round=round,
                usable_vials_in=total_usable_vials_in,
                usable_doses_in=total_usable_doses_in,
                unusable_vials_in=total_unusable_vials_in,
                unusable_doses_in=total_unusable_doses_in,
            )
        # TODO: rmeove dupliacte rounds, improve error handling
        except IntegrityError:
            print("--------------------------------------------")
            print(f"Error with {round.campaign.obr_name}, round {round.number}")
            print(f"usable_vials_in={total_usable_vials_in}")
            print(f"usable_doses_in={total_usable_doses_in}")
            print(f"unusable_vials_in={total_unusable_vials_in}")
            print(f"unusable_doses_in={total_unusable_doses_in}")
            print("--------------------------------------------")


@task_decorator(task_name="archive_vaccine_stock")
def archive_vaccine_stock_for_rounds(date=None, country=None, campaign=None, vaccine=None, task=None):
    task_start = datetime.now()
    account = task.launcher.iaso_profile.account
    reference_date = datetime.strptime(date, "%Y-%m-%d") if date else task_start
    round_end_date = reference_date - timedelta(days=14)

    rounds_qs = Round.objects.filter(ended_at__lte=round_end_date, campaign__account=account)

    if country:
        rounds_qs = rounds_qs.filter(campaign__country__id=country)

    if campaign:
        rounds_qs = rounds_qs.filter(campaign__obr_name=campaign)

    vaccines = [v[0] for v in VACCINES]

    if vaccine:
        vaccines = [vaccine]

    for vax in vaccines:
        vax_rounds_qs = rounds_qs.filter(
            (Q(campaign__separate_scopes_per_round=False) & Q(campaign__scopes__vaccine=vax))
            | (Q(campaign__separate_scopes_per_round=True) & Q(scopes__vaccine=vax))
        )

        # Exclude rounds that already have a history entry for this vaccine
        vax_rounds_qs = vax_rounds_qs.exclude(
            id__in=VaccineStockHistory.objects.filter(vaccine_stock__vaccine=vax).values("round_id")
        )
        vaccine_stock = VaccineStock.objects.filter(vaccine=vax)
        if country:
            vaccine_stock = VaccineStock.objects.filter(country__id=country)
        for r in vax_rounds_qs:
            print("ROUND", r.number)
            archive_stock_for_round(
                round=r, reference_date=reference_date, vaccine_stock=vaccine_stock, country=country
            )
