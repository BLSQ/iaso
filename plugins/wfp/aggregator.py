import json
import logging

from collections import defaultdict

from django.core.paginator import Paginator

from plugins.wfp.common_v2 import ETLV2

from .management.commands.south_sudan.Dhis2 import Dhis2


logger = logging.getLogger(__name__)

DATA_SET_ID = "m2GaBFDJDeV"
FIELDS = [
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
    "community_health_worker_muac_under_11_5",
    "community_health_worker_muac_11_5_12_4",
    "community_health_worker_oedema",
    "community_health_worker_muac_under_23",
    "community_health_worker_muac_above_23",
]
PAGE_SIZE = 5000


class Aggregator:
    @staticmethod
    def aggregate_monthly_data_by_org_unit(account, org_units_with_updated_data, programme_type):
        page_size = PAGE_SIZE
        paginator = Paginator(org_units_with_updated_data, page_size)
        pages = paginator.page_range

        logger.info(
            f"Processing monthly data for {len(org_units_with_updated_data)} org units on {programme_type} across {paginator.num_pages} pages for {account}"
        )
        for page in pages:
            rows, page_info = ETLV2._retrieve_aggregated_journeys_data(
                account,
                programme_type,
                org_units_with_updated_data,
                page_size,
                page,
            )
            org_unit_ids = page_info.object_list
            logger.info(f"Processing data for {len(org_unit_ids)} org unit on page {page} for {account}")

            if rows is None:
                continue

            records = ETLV2._process_monthly_data(programme_type, rows, account)
            logger.info(f"Processed {len(records)} records for {len(org_unit_ids)} org units.")

    @staticmethod
    def _group_data_by_org_unit_period(rows):
        """Groups flat rows into {(dhis2_org_unit_id, period): {program_name: [entries]}}"""
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
        group_map = mapper.get(program_name, {}).get(target_group, {})

        for field in FIELDS:
            data_value = entry.get(field)
            mapping_template = group_map.get(field)

            if data_value is not None and mapping_template:
                data_values.append({**mapping_template, "value": data_value})
        return data_values

    def aggregate_by_nutrition_program(self, account, org_unit_ids, external_credential):
        page_size = PAGE_SIZE
        paginator = Paginator(org_unit_ids, page_size)
        pages = paginator.page_range
        dhis2 = Dhis2()

        with open("plugins/wfp/dhis2_mapper.json") as mapper:
            mapper_config = json.load(mapper)

        for page in pages:
            monthly_data, page_info = ETLV2.group_data_to_push_to_dhis2(
                account, org_unit_ids, page_size=page_size, page_number=page
            )
            logger.info(f"Processing push data for {len(page_info.object_list)} org unit on page {page} for {account}")

            grouped_data = self._group_data_by_org_unit_period(monthly_data)
            data_sets = []
            for (dhis2_id, period), programs in grouped_data.items():
                data_set = self._build_dhis2_payload(dhis2_id, period, programs, mapper_config)
                data_sets.append(data_set)
            if len(data_sets) == 0:
                continue

            pushed_data = dhis2.save_dhis2_sync_results(external_credential, account, data_sets)
            logger.info(
                f"------------------------ Processed push to DHIS2 for page {page} on U5 and PBW for {len(pushed_data)} rows aggregated per year, month and org unit-------------------------"
            )
