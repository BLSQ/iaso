import logging

from itertools import groupby
from operator import itemgetter

from django.db.models import Q

from plugins.wfp.common import ETL
from plugins.wfp.models import ScreeningData


logger = logging.getLogger(__name__)

FORMS = ["screening_tally"]


class Screening:
    def run(self, account, update_at):
        entity_type = ETL([type])
        instances = entity_type.get_screening_data(FORMS, account, update_at)
        pages = instances.page_range

        logger.info(f"Screening data for {account}")
        all_screening_data = []

        for page in pages:
            data = sorted(
                list(instances.page(page).object_list),
                key=itemgetter("org_unit"),
            )
            submissions = self.group_submissions_by_org_unit(account, data)
            all_screening_data.extend(submissions)
        self.clean_screening_data(all_screening_data)
        exit()
        logger.info(f"Inserted {len(all_screening_data)} rows for Screening data")
        ScreeningData.objects.bulk_create(all_screening_data)

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

    def clean_screening_data(self, all_screening_data):
        rows_to_delete = ScreeningData.objects
        print("SCREENING ...:", all_screening_data)
        for row in all_screening_data:
            print("EACH ROW ...:", row, row.org_unit, row.period)
            rows_to_delete = rows_to_delete.filter(Q(org_unit=row.org_unit, period=row.period))
