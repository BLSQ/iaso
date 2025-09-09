import logging

from datetime import datetime, timedelta

from django.db.models import Q
from django.db.utils import IntegrityError

from beanstalk_worker import task_decorator
from plugins.polio.models import Round, VaccineStock, VaccineStockHistory
from plugins.polio.models.base import VACCINES, VaccineStockCalculator


logger = logging.getLogger(__name__)


def archive_stock_for_round(round, vaccine_stock, reference_date, country=None):
    vaccine_stock_for_vaccine = vaccine_stock

    if vaccine_stock_for_vaccine:
        if not country:
            vaccine_stock_for_vaccine = vaccine_stock_for_vaccine.filter(country=round.campaign.country)
        if vaccine_stock_for_vaccine:
            vaccine_stock_for_vaccine = vaccine_stock_for_vaccine.first()
            calculator = VaccineStockCalculator(vaccine_stock_for_vaccine)
            total_usable_vials_in, total_usable_doses_in = calculator.get_total_of_usable_vials(reference_date)
            total_unusable_vials_in, total_unusable_doses_in = calculator.get_total_of_unusable_vials(reference_date)
            VaccineStockHistory.objects.create(
                vaccine_stock=vaccine_stock_for_vaccine,
                round=round,
                usable_vials_in=total_usable_vials_in,
                usable_doses_in=total_usable_doses_in,
                unusable_vials_in=total_unusable_vials_in,
                unusable_doses_in=total_unusable_doses_in,
            )


@task_decorator(task_name="archive_vaccine_stock")
def archive_vaccine_stock_for_rounds(date=None, country=None, campaign=None, vaccine=None, task=None):
    task_start = datetime.now()
    account = task.launcher.iaso_profile.account
    reference_date = datetime.strptime(date, "%Y-%m-%d") if date else task_start
    round_end_date = reference_date - timedelta(days=14)

    rounds_qs = Round.objects.filter(ended_at__lte=round_end_date, campaign__account=account).select_related(
        "campaign__country"
    )

    if country:
        rounds_qs = rounds_qs.filter(campaign__country__id=country)

    if campaign:
        rounds_qs = rounds_qs.filter(campaign__obr_name=campaign)

    vaccines = [v[0] for v in VACCINES]

    if vaccine:
        vaccines = [vaccine]
    vax_dict = {}

    # Save the queryset for each vaccine in a queryset, so we can compute the total of stock histories created
    # Merging the querysets wouldn't work as it would remove duplicate rounds and some rounds need to be updatred for
    # multiple vaccines
    for vax in vaccines:
        vax_rounds_qs = rounds_qs.filter(
            (Q(campaign__separate_scopes_per_round=False) & Q(campaign__scopes__vaccine=vax))
            | (Q(campaign__separate_scopes_per_round=True) & Q(scopes__vaccine=vax))
        )

        # Exclude rounds that already have a history entry for this vaccine
        vax_dict[vax] = vax_rounds_qs.exclude(
            id__in=VaccineStockHistory.objects.filter(vaccine_stock__vaccine=vax).values("round_id")
        )
    count = sum(qs.count() for qs in vax_dict.values())
    i = 0
    for vax in vaccines:
        qs = vax_dict[vax]

        for r in qs:
            i += 1
            vaccine_stock = VaccineStock.objects.filter(vaccine=vax)
            if vaccine_stock:
                try:
                    archive_stock_for_round(round=r, reference_date=reference_date, vaccine_stock=vaccine_stock)
                    task.report_progress_and_stop_if_killed(
                        progress_value=i,
                        end_value=count,
                        progress_message=f"Stock history added for {r.pk} and vaccine {vax}",
                    )
                except IntegrityError:
                    task.report_progress_and_stop_if_killed(
                        progress_value=i,
                        end_value=count,
                        progress_message=f"Could not add stock history for round {r.pk} vaccine {vax}. History already exists",
                    )
