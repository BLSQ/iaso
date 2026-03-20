import json
import logging

from collections import defaultdict
from functools import reduce
from operator import or_

from django.core.paginator import Paginator

from plugins.wfp.common import ETL
from plugins.wfp.models import MonthlyStatistics

from .management.commands.south_sudan.Dhis2 import Dhis2


logger = logging.getLogger(__name__)

DATA_SET_ID = "m2GaBFDJDeV"
SCREENING_FIELDS = [
    "u5_male_green",
    "u5_male_yellow",
    "u5_male_red",
    "u5_female_green",
    "u5_female_yellow",
    "u5_female_red",
    "muac_lte_23",
    "muac_gt_23",
]
HEALTH_WORKERS_FIELDS = [
    "community_health_worker_muac_under_11_5_male",
    "community_health_worker_muac_under_11_5_female",
    "community_health_worker_muac_11_5_12_4_male",
    "community_health_worker_muac_11_5_12_4_female",
    "community_health_worker_oedema_male",
    "community_health_worker_oedema_female",
    "community_health_worker_muac_under_23_pregnant",
    "community_health_worker_muac_under_23_breastfeeding",
]

DEFAULT_FIELDS = [
    "oedema",
    "muac_under_11_5",
    "muac_11_5_12_4",
    "muac_above_12_5",
    "muac_under_23",
    "muac_above_23",
    "whz_score_2",
    "whz_score_3",
    "whz_score_3_2",
    "new_case",
    "relapse",
    "returned_defaulter",
    "returned_referral",
    "transfer_from_other_tsfp",
    "admission_sc_itp_otp",
    "transfer_sc_itp_otp",
    "transfer_in_from_other_tsfp",
    "cured",
    "death",
    "defaulter",
    "non_respondent",
]

PAGE_SIZE = 5000


class Aggregator:
    @staticmethod
    def reset_monthly_statistics(account, programme_type, org_units):
        """
        Deletes MonthlyStatistics records for a specific account, programme type,
            and set of organizational units.
        """
        pages = org_units.page_range
        logger.info(f"Cleaning monthly statistics data for {org_units.count} rows on {account}")
        for page in pages:
            current_page_org_units = list(org_units.page(page).object_list)

            if len(current_page_org_units) == 0:
                continue

            deleted_count, deleted = (
                MonthlyStatistics.objects.filter(account=account, programme_type=programme_type)
                .filter(reduce(or_, current_page_org_units))
                .delete()
            )
            logger.info(f"Page {page}: Deleted {deleted_count} Monthly statistics records")

    @staticmethod
    def aggregate_monthly_data_by_org_unit(account, org_units, programme_type):
        """
        Aggregates monthly data by streaming org_units and period and store the result in monthly statistics table.
        """
        org_units_pages = org_units.page_range
        page_size = PAGE_SIZE
        for org_units_page in org_units_pages:
            current_page_org_units = list(org_units.page(org_units_page).object_list)
            paginator = Paginator(current_page_org_units, page_size)
            pages = paginator.page_range

            logger.info(
                f"Processing monthly data for {len(current_page_org_units)} org units on {programme_type} across {paginator.num_pages} pages for {account}"
            )
            for page in pages:
                logger.info(f"Processing data org unit on sub page {page}")

                rows, page_info = ETL._retrieve_aggregated_journeys_data(
                    account,
                    programme_type,
                    current_page_org_units,
                    page_size,
                    page,
                )
                org_unit_ids = page_info.object_list
                logger.info(f"Processing data for {len(org_unit_ids)} org unit on page {page} for {account}")

                if rows is None:
                    continue

                records = ETL._process_monthly_data(programme_type, rows, account)
                logger.info(f"Processed {len(records)} records for {len(org_unit_ids)} org units.")

    @staticmethod
    def _aggregate_data_by_org_unit_and_period(rows):
        """Groups flat rows into {(dhis2_org_unit_id, period): {nutrition_programme: [entries]}}"""
        groups = defaultdict(lambda: defaultdict(list))
        for row in rows:
            key = (row["dhis2_id"], row["period"])
            groups[key][row["nutrition_programme"]].append(row)
        return groups

    @staticmethod
    def _build_dhis2_payload(dhis2_id, period, programs, mapper):
        """Constructs a single DHIS2 payload for a specific org unit and period."""
        payload = {"dataSet": DATA_SET_ID, "orgUnit": dhis2_id, "period": period, "dataValues": []}

        for program_name, entries in programs.items():
            if not payload.get("orgUnitId") and entries:
                payload["orgUnitId"] = entries[0].get("orgUnitId")

            for entry in entries:
                group = entry["target_group"]
                logger.info(
                    f"-----------------------{group} for {program_name} on org unit {dhis2_id} for {period} ----------------"
                )
                data_values = Aggregator._map_fields(entry, program_name, mapper)
                payload["dataValues"].extend(data_values)
        return payload

    @staticmethod
    def _map_fields(entry, program_name, mapper):
        """Extracts valid data values based on the dhis2 mapper file."""
        data_values = []
        target_group = entry.get("target_group")
        all_fields = DEFAULT_FIELDS + SCREENING_FIELDS + HEALTH_WORKERS_FIELDS
        for field in all_fields:
            if field in HEALTH_WORKERS_FIELDS:
                prog = "community_health_worker"
            elif field in SCREENING_FIELDS:
                prog = "screening_reporting"
            else:
                prog = program_name

            mapping_template = mapper.get(prog, {}).get(target_group, {}).get(field)

            if prog == program_name:
                data_value = entry.get(field)
            else:
                data_value = entry.get(prog, {}).get(target_group, {}).get(field)

            if data_value is not None and mapping_template:
                data_values.append({**mapping_template, "value": data_value})
        return data_values

    def aggregate_by_nutrition_program(self, account, org_unit_ids, external_credential):
        """Group monthly statistics by org unit and period to make a payload to send to dhis2"""

        org_units_pages = org_unit_ids.page_range
        page_size = PAGE_SIZE
        dhis2 = Dhis2()

        with open("plugins/wfp/dhis2_mapper.json") as mapper:
            mapper_config = json.load(mapper)

        for org_units_page in org_units_pages:
            current_page_org_units = list(org_unit_ids.page(org_units_page).object_list)
            paginator = Paginator(current_page_org_units, page_size)
            pages = paginator.page_range

            logger.info(
                f"----------------------------- Aggregating monthly data to push to DHIS2 for {len(current_page_org_units)} across {paginator.num_pages} pages org unit on {account} -----------------------------"
            )

            for page in pages:
                monthly_data, page_info = ETL.group_data_to_push_to_dhis2(
                    account, current_page_org_units, page_size=page_size, page_number=page
                )
                logger.info(
                    f"Processing push data for {len(page_info.object_list)} org unit on page {page} for {account}"
                )

                aggregated_data = self._aggregate_data_by_org_unit_and_period(monthly_data)
                data_sets = []
                for (dhis2_id, period), programs in aggregated_data.items():
                    data_set = self._build_dhis2_payload(dhis2_id, period, programs, mapper_config)
                    data_sets.append(data_set)
                if len(data_sets) == 0:
                    continue

                pushed_data = dhis2.save_dhis2_sync_results(external_credential, account, data_sets)
                logger.info(
                    f"------------------------ Processed push to DHIS2 for page {page} on U5 and PBW for {len(pushed_data)} rows aggregated per year, month and org unit-------------------------"
                )
