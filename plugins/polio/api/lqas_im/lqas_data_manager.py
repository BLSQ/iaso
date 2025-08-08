from logging import getLogger

from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError

from iaso.models.base import Account
from iaso.models.org_unit import OrgUnit
from plugins.polio.models import Round
from plugins.polio.models.lqas_im import (
    LqasDistrictData,
    LqasRoundData,
    LqasStatuses,
)


class LqasDataManager:
    """
    Manages the creation and updating of LQAS (Lot Quality Assurance Sampling) data from JSON.

    This class handles the parsing of LQAS JSON data and creates/updates the corresponding
    Django model instances. It supports both creation and update operations

    Expected JSON Structure:
    {
        "stats": {
            "[campaign_id]": {
                "rounds": [
                    {
                        "number": 1,
                        "lqas_failed": 2,
                        "lqas_passed": 8,
                        "lqas_no_data": 0,
                        "status": "inScope",
                        "nfm_stats": {
                            "childabsent": 5,
                            "Other": 2,
                            "Non_Compliance": 1,
                            "Child_was_asleep": 3,
                            "House_not_visited": 0,
                            "Child_is_a_visitor": 1,
                            "Vaccinated_but_not_FM": 2,
                        },
                        "nfm_abs_stats": {
                            "Farm": 3,
                            "Other": 1,
                            "Market": 2,
                            "School": 4,
                            "Travelled": 1,
                            "In_playground": 0,
                            "unknown": 1,
                        },
                        "data": {
                            "[district_code]": {
                                "status": "string",
                                "district": "number",
                                "total_child_fmd": "number",
                                "total_child_checked": "number",
                                "total_sites_visited": "number",
                                "care_giver_stats": {
                                    "ratio": "number",
                                    "caregivers_informed": "number",
                                    "caregivers_informed_ratio": "number",
                                    "[care_giver_type]": "number"
                                }
                            }
                        }
                    }
                ]
            }
        }
    }

    Note on SubActivity Parameter:
    The subactivity parameter is included in method signatures to support future functionality
    where subactivities will be extracted from the JSON data but is not used in practice
    """

    def __init__(self, account=None, account_id=None):
        self.logger = getLogger(__name__)

        # Validate input
        if account is not None and account_id is not None:
            raise ValueError("Cannot specify both account and account_id")

        # Handle account object
        if account is not None:
            if not isinstance(account, Account):
                raise TypeError("account must be an Account instance")
            self.account = account

        # Handle account ID
        elif account_id is not None:
            if not isinstance(account_id, int):
                raise TypeError("account_id must be an integer")
            try:
                self.account = Account.objects.get(id=account_id)
            except Account.DoesNotExist:
                raise ValueError(f"Account with ID {account_id} does not exist")

        # No account specified
        else:
            self.account = None

        # Require an account for the manager to work
        if self.account is None:
            raise ValueError("An Account is required. Please provide either account or account_id parameter.")

    def parse_json_and_create_lqas_activities(self, lqas_json_data):
        data_to_parse = lqas_json_data["stats"]
        rounds, districts = self._prefetch_rounds_and_districts(lqas_json_data)
        total_created = 0
        total_failed = 0
        total_parsed = 0
        districts_not_found = []
        rounds_not_found = []
        for obr_name, campaign_data in data_to_parse.items():
            for round_data in campaign_data.get("rounds", []) or []:
                try:
                    round_obj = rounds.get(number=round_data["number"], campaign__obr_name=obr_name)
                    self._create_round_data(round_obj, obr_name, round_data)
                    # Create district data for current round
                    districts_results = round_data.get("data", {}) or {}
                    for district_name, district_data in districts_results.items():
                        district_id = district_data["district"]
                        try:
                            district = districts.get(id=district_id)
                            self._create_district_data(
                                round_obj=round_obj, district=district, district_data=district_data
                            )
                        except OrgUnit.DoesNotExist as e:
                            self.logger.warning(f"No district found for {district_name}, id:{district_id} ")
                            districts_not_found.append(district_id)
                            continue
                    total_created += 1
                    total_parsed += 1
                except Round.DoesNotExist as e:
                    self.logger.warning(
                        f"Could not add LQAS data for {obr_name} Round {round_data['number']}: Round not found"
                    )
                    self.logger.warning(e)
                    rounds_not_found.append(f"{obr_name} Round {round_data['number']}")
                    total_failed += 1
                    total_parsed += 1
                    continue
                except (IntegrityError, ValidationError) as e:
                    self.logger.warning(e)
                    total_failed += 1
                    total_parsed += 1
                    continue
        self.logger.info(f"Success: {total_created}/{total_parsed}- {obr_name}")
        self.logger.info(f"Failures: {total_failed}/{total_parsed}- {obr_name}")
        if len(districts_not_found):
            self.logger.warning("Some districts were not found which can lead to incomplete data for some rounds")
            self.logger.warning(f"DISTRICTS NOT FOUND: {districts_not_found}- {obr_name}")
        if len(rounds_not_found) > 0:
            self.logger.warning(f"Rounds not found: {rounds_not_found}- {obr_name}")

    def parse_json_and_update_lqas_activities(self, lqas_json_data):
        data_to_parse = lqas_json_data["stats"]
        rounds, districts = self._prefetch_rounds_and_districts(lqas_json_data)
        total_updated = 0
        total_failed = 0
        total_parsed = 0
        districts_not_found = []
        rounds_not_found = []
        for obr_name, campaign_data in data_to_parse.items():
            for round_data in campaign_data.get("rounds", []) or []:
                try:
                    round_obj = rounds.get(number=round_data["number"], campaign__obr_name=obr_name)
                    self._update_round_data(round_obj, round_data)
                    # Update district data
                    districts_results = round_data.get("data", {}) or {}
                    for district_name, district_data in districts_results.items():
                        district_id = district_data["district"]
                        try:
                            district = districts.get(id=district_id)
                            self._update_district_data(
                                round_obj=round_obj, district=district, district_data=district_data
                            )

                        except OrgUnit.DoesNotExist as e:
                            self.logger.warning(f"No district found for {district_name}, id:{district_id}")
                            districts_not_found.append(district_id)
                            continue
                    total_updated += 1
                    total_parsed += 1
                except Round.DoesNotExist as e:
                    self.logger.warning(
                        f"Could not update LQAS data for {obr_name} Round {round_data['number']}: Round not found"
                    )
                    self.logger.warning(e)
                    rounds_not_found.append(f"{obr_name} Round {round_data['number']}")
                    total_failed += 1
                    total_parsed += 1
                    continue
        self.logger.info(f"Success: {total_updated}/{total_parsed} - {obr_name}")
        self.logger.info(f"Failures: {total_failed}/{total_parsed} - {obr_name}")
        if len(districts_not_found) > 0:
            self.logger.warning("Some districts were not found which can lead to incomplete data for some rounds")
            self.logger.warning(f"DISTRICTS NOT FOUND: {districts_not_found} - {obr_name}")
        if len(rounds_not_found) > 0:
            self.logger.warning(f"Rounds not found: {rounds_not_found} - {obr_name}")

    def _prefetch_rounds_and_districts(self, lqas_json_data):
        data_to_parse = lqas_json_data["stats"]
        obr_names = data_to_parse.keys()
        rounds = Round.objects.filter(
            campaign__obr_name__in=obr_names, campaign__account=self.account
        ).prefetch_related(
            "campaign",
            "campaign__scopes",
            "campaign__scopes__group__org_units",
            "sub_activities",
            "sub_activities__scopes",
            "sub_activities__scopes__group__org_units",
        )
        all_district_ids = set()
        for campaign_data in data_to_parse.values():
            for round_data in campaign_data.get("rounds", []) or []:
                for district_data in round_data.get("data", {}).values() or []:
                    all_district_ids.add(district_data["district"])

        districts = (
            OrgUnit.objects.filter(org_unit_type__name="DISTRICT")
            .filter(id__in=all_district_ids)
            .filter_for_account(self.account)
            .prefetch_related("parent")
        )
        return rounds, districts

    def _create_round_data(self, round_obj: Round, obr_name: str, round_data, subactivity=None):
        nfm_data = round_data.get("nfm_stats", {}) or {}
        absence_data = round_data.get("nfm_abs_stats", {}) or {}
        try:
            LqasRoundData.objects.create(
                round=round_obj,
                subactivity=subactivity,
                lqas_failed=round_data.get(LqasRoundData.JSON_KEYS["lqas_failed"], 0) or 0,
                lqas_passed=round_data.get(LqasRoundData.JSON_KEYS["lqas_passed"], 0) or 0,
                lqas_no_data=round_data.get(LqasRoundData.JSON_KEYS["lqas_no_data"], 0) or 0,
                status=round_data.get(LqasRoundData.JSON_KEYS["status"], LqasStatuses.INSCOPE) or LqasStatuses.INSCOPE,
                nfm_child_absent=nfm_data.get(LqasRoundData.NFM_JSON_KEYS["nfm_child_absent"], 0) or 0,
                nfm_other=nfm_data.get(LqasRoundData.NFM_JSON_KEYS["nfm_other"], 0) or 0,
                nfm_non_compliance=nfm_data.get(LqasRoundData.NFM_JSON_KEYS["nfm_non_compliance"], 0) or 0,
                nfm_child_was_asleep=nfm_data.get(LqasRoundData.NFM_JSON_KEYS["nfm_child_was_asleep"], 0) or 0,
                nfm_house_not_visited=nfm_data.get(LqasRoundData.NFM_JSON_KEYS["nfm_house_not_visited"], 0) or 0,
                nfm_child_is_a_visitor=nfm_data.get(LqasRoundData.NFM_JSON_KEYS["nfm_child_is_a_visitor"], 0) or 0,
                nfm_vaccinated_but_not_fm=nfm_data.get(LqasRoundData.NFM_JSON_KEYS["nfm_vaccinated_but_not_fm"], 0)
                or 0,
                abs_farm=absence_data.get(LqasRoundData.ABS_JSON_KEYS["abs_farm"], 0) or 0,
                abs_other=absence_data.get(LqasRoundData.ABS_JSON_KEYS["abs_other"], 0) or 0,
                abs_market=absence_data.get(LqasRoundData.ABS_JSON_KEYS["abs_market"], 0) or 0,
                abs_school=absence_data.get(LqasRoundData.ABS_JSON_KEYS["abs_school"], 0) or 0,
                abs_travelled=absence_data.get(LqasRoundData.ABS_JSON_KEYS["abs_travelled"], 0) or 0,
                abs_in_playground=absence_data.get(LqasRoundData.ABS_JSON_KEYS["abs_in_playground"], 0) or 0,
                abs_unknown=absence_data.get(LqasRoundData.ABS_JSON_KEYS["abs_unknown"], 0) or 0,
            )

        except (IntegrityError, ValidationError) as e:
            self.logger.warning(
                f"LQAS activity data already exists for {obr_name} Round {round_data['number']} Subactivity {subactivity}"
            )
            self.logger.warning(e)
            raise e

    def _update_round_data(self, round_obj: Round, round_data, subactivity=None):
        nfm_data = round_data.get("nfm_stats", {}) or {}
        absence_data = round_data.get("nfm_abs_stats", {}) or {}
        update_values = {
            "lqas_failed": round_data.get(LqasRoundData.JSON_KEYS["lqas_failed"], 0) or 0,
            "lqas_passed": round_data.get(LqasRoundData.JSON_KEYS["lqas_passed"], 0) or 0,
            "lqas_no_data": round_data.get(LqasRoundData.JSON_KEYS["lqas_no_data"], 0) or 0,
            "status": round_data.get(LqasRoundData.JSON_KEYS["status"], LqasStatuses.INSCOPE) or LqasStatuses.INSCOPE,
            "nfm_vaccinated_but_not_fm": nfm_data.get(LqasRoundData.NFM_JSON_KEYS["nfm_vaccinated_but_not_fm"], 0) or 0,
            "nfm_child_is_a_visitor": nfm_data.get(LqasRoundData.NFM_JSON_KEYS["nfm_child_is_a_visitor"], 0) or 0,
            "nfm_house_not_visited": nfm_data.get(LqasRoundData.NFM_JSON_KEYS["nfm_house_not_visited"], 0) or 0,
            "nfm_child_was_asleep": nfm_data.get(LqasRoundData.NFM_JSON_KEYS["nfm_child_was_asleep"], 0) or 0,
            "nfm_non_compliance": nfm_data.get(LqasRoundData.NFM_JSON_KEYS["nfm_non_compliance"], 0) or 0,
            "nfm_child_absent": nfm_data.get(LqasRoundData.NFM_JSON_KEYS["nfm_child_absent"], 0) or 0,
            "nfm_other": nfm_data.get(LqasRoundData.NFM_JSON_KEYS["nfm_other"], 0) or 0,
            "abs_farm": absence_data.get(LqasRoundData.ABS_JSON_KEYS["abs_farm"], 0) or 0,
            "abs_other": absence_data.get(LqasRoundData.ABS_JSON_KEYS["abs_other"], 0) or 0,
            "abs_market": absence_data.get(LqasRoundData.ABS_JSON_KEYS["abs_market"], 0) or 0,
            "abs_school": absence_data.get(LqasRoundData.ABS_JSON_KEYS["abs_school"], 0) or 0,
            "abs_travelled": absence_data.get(LqasRoundData.ABS_JSON_KEYS["abs_travelled"], 0) or 0,
            "abs_in_playground": absence_data.get(LqasRoundData.ABS_JSON_KEYS["abs_in_playground"], 0) or 0,
            "abs_unknown": absence_data.get(LqasRoundData.ABS_JSON_KEYS["abs_unknown"], 0) or 0,
        }
        return self._safe_update_or_create(
            model_class=LqasRoundData,
            lookup_kwargs={"round": round_obj, "subactivity": subactivity},
            update_values=update_values,
        )

    def _get_best_info_source(self, caregiver_data):
        best_info_source_data = [
            item
            for item in caregiver_data.items()
            if item[0]
            not in [
                LqasDistrictData.CG_JSON_KEYS["cg_ratio"],
                LqasDistrictData.CG_JSON_KEYS["cg_caregivers_informed"],
                LqasDistrictData.CG_JSON_KEYS["cg_caregivers_informed_ratio"],
            ]
        ]
        if len(best_info_source_data) == 0:
            return None, None

        return best_info_source_data[0]

    def _create_district_data(self, round_obj: Round, district: OrgUnit, district_data, subactivity=None):
        try:
            caregiver_data = district_data.get(LqasDistrictData.JSON_KEYS["care_giver_stats"], {})

            best_info_source, best_info_ratio = self._get_best_info_source(caregiver_data)

            ratio = caregiver_data.get(LqasDistrictData.CG_JSON_KEYS["cg_ratio"], 0) or 0
            caregivers_informed = caregiver_data.get(LqasDistrictData.CG_JSON_KEYS["cg_caregivers_informed"], 0) or 0
            caregivers_informed_ratio = (
                caregiver_data.get(LqasDistrictData.CG_JSON_KEYS["cg_caregivers_informed_ratio"], 0) or 0
            )

            lqas_entry = LqasDistrictData.objects.create(
                round=round_obj,
                subactivity=subactivity,
                district=district,
                total_children_fmd=district_data.get(LqasDistrictData.JSON_KEYS["total_children_fmd"], 0) or 0,
                total_children_checked=district_data.get(LqasDistrictData.JSON_KEYS["total_children_checked"], 0) or 0,
                total_sites_visited=district_data.get(LqasDistrictData.JSON_KEYS["total_sites_visited"], 0) or 0,
                status=district_data.get(LqasDistrictData.JSON_KEYS["status"], LqasStatuses.INSCOPE)
                or LqasStatuses.INSCOPE,
                cg_ratio=ratio,
                cg_best_info_source=best_info_source,
                cg_best_info_ratio=best_info_ratio,
                cg_caregivers_informed=caregivers_informed,
                cg_caregivers_informed_ratio=caregivers_informed_ratio,
            )
            print("ENTRY", lqas_entry)
            return lqas_entry

        except (IntegrityError, ValidationError) as e:
            self.logger.warning(
                f"LQAS entry already exists for {round_obj.campaign.obr_name} Round {round_obj.number} district {district.name} Subactivity {subactivity}"
            )
            self.logger.warning(e)
            raise e

    def _update_district_data(self, round_obj: Round, district: OrgUnit, district_data, subactivity=None):
        caregiver_data = district_data.get(LqasDistrictData.JSON_KEYS["care_giver_stats"], {})
        best_info_source, best_info_source_ratio = self._get_best_info_source(caregiver_data)

        update_values = {
            "total_children_fmd": district_data.get(LqasDistrictData.JSON_KEYS["total_children_fmd"], 0) or 0,
            "total_children_checked": district_data.get(LqasDistrictData.JSON_KEYS["total_children_checked"], 0) or 0,
            "total_sites_visited": district_data.get(LqasDistrictData.JSON_KEYS["total_sites_visited"], 0) or 0,
            "status": district_data.get(LqasDistrictData.JSON_KEYS["status"], LqasStatuses.INSCOPE)
            or LqasStatuses.INSCOPE,
            "cg_ratio": caregiver_data.get(LqasDistrictData.CG_JSON_KEYS["cg_ratio"], 0) or 0,
            "cg_caregivers_informed": caregiver_data.get("caregivers_informed", 0) or 0,
            "cg_caregivers_informed_ratio": caregiver_data.get("caregivers_informed_ratio", 0) or 0,
            "cg_best_info_source": best_info_source,
            "cg_best_info_ratio": best_info_source_ratio,
        }
        return self._safe_update_or_create(
            model_class=LqasDistrictData,
            lookup_kwargs={"round": round_obj, "subactivity": subactivity, "district": district},
            update_values=update_values,
        )

    def _safe_update_or_create(self, model_class, lookup_kwargs, update_values):
        """Safely update or create a model instance, handling race conditions."""
        try:
            instance, created = model_class.objects.update_or_create(defaults=update_values, **lookup_kwargs)
            return instance
        except IntegrityError:
            # Handle the case where another process created it first
            instance = model_class.objects.get(**lookup_kwargs)
            for key, value in update_values.items():
                setattr(instance, key, value)
            instance.save()
            return instance
