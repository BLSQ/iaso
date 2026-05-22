import logging

from functools import reduce
from itertools import groupby
from operator import itemgetter, or_

from django.db.models import Q

from plugins.wfp.common import ETL
from plugins.wfp.models import ScreeningData


logger = logging.getLogger(__name__)

FORMS = ["screening_tally"]


class Screening:
    def run(self, account, updated_at):
        instances = ETL._get_screening_raw_data(FORMS, account, updated_at)
        pages = instances.page_range
        logger.info(f"Screening data for {account}")
        for page in pages:
            data = sorted(
                list(instances.page(page).object_list),
                key=itemgetter("org_unit"),
            )
            submissions = self.group_submissions_by_org_unit(account, data)
            instances_by_org_unit_period = list(
                map(lambda row: Q(org_unit=row.org_unit, period=row.period), submissions)
            )
            logger.info(f"Processing {len(submissions)} rows on page {page}")
            if len(instances_by_org_unit_period) > 0:
                ScreeningData.objects.filter(reduce(or_, instances_by_org_unit_period)).delete()
                logger.info(f"Inserted {len(submissions)} rows for Screening data")
                ScreeningData.objects.bulk_create(submissions)

    def group_submissions_by_org_unit(self, account, submissions):
        instances = []
        instances_by_org_unit = groupby(list(submissions), key=itemgetter("org_unit"))
        for org_unit_parent_id, instance in instances_by_org_unit:
            for item in instance:
                row = ScreeningData()
                row.account = account
                row.org_unit_id = org_unit_parent_id
                row.period = item.get("period")
                row.date = item.get("date")
                row.year = item.get("year")
                row.month = item.get("month")
                row.u5_male_green = item.get("u5_male_green")
                row.u5_female_green = item.get("u5_female_green")
                row.u5_male_yellow = item.get("u5_male_yellow")
                row.u5_female_yellow = item.get("u5_female_yellow")
                row.u5_male_red = item.get("u5_male_red")
                row.u5_female_red = item.get("u5_female_red")
                row.pregnant_w_muac_gt_23 = item.get("pregnant_w_muac_gt_23")
                row.pregnant_w_muac_lte_23 = item.get("pregnant_w_muac_lte_23")
                row.lactating_w_muac_gt_23 = item.get("lactating_w_muac_gt_23")
                row.lactating_w_muac_lte_23 = item.get("lactating_w_muac_lte_23")
                instances.append(row)
        return instances
