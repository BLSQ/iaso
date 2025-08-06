from logging import getLogger

from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError

from iaso.models.base import Account
from iaso.models.org_unit import OrgUnit
from plugins.polio.models import Round
from plugins.polio.models.lqas_im import (
    LqasAbsenceStats,
    LqasActivityStats,
    LqasCareGiverStats,
    LqasEntry,
    LqasNoMarkStats,
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
                    # Create lqas models for round here
                    self._create_lqas_activity(round_obj, obr_name, round_data)
                    self._create_lqas_no_marks(round_obj, obr_name, round_data)
                    self._create_lqas_absences(round_obj, obr_name, round_data)
                    # Create district data for current round
                    districts_results = round_data.get("data", {}) or {}
                    for district_name, district_data in districts_results.items():
                        district_id = district_data["district"]
                        try:
                            district = districts.get(id=district_id)
                            lqas_entry = self._create_lqas_entry(
                                round_obj=round_obj, district=district, district_data=district_data
                            )
                            self._create_caregiver_stats(lqas_entry, district_data)
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
                except IntegrityError as e:
                    self.logger.warning(e)
                    total_failed += 1
                    total_parsed += 1
                    continue
                except ValidationError as e:
                    self.logger.warning(e)
                    total_failed += 1
                    total_parsed += 1
                    continue
        self.logger.info(f"Success: {total_created}/{total_parsed}")
        self.logger.info(f"Failures: {total_failed}/{total_parsed}")
        if len(districts_not_found):
            self.logger.warning("Some districts were not found which can lead to incomplete data for some rounds")
            self.logger.warning(f"DISTRICTS NOT FOUND: {districts_not_found}")
        if len(rounds_not_found) > 0:
            self.logger.warning(f"Rounds not found: {rounds_not_found}")

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
                    # Create lqas models for round here
                    self._update_lqas_activity(round_obj, round_data)
                    self._update_lqas_no_marks(round_obj, round_data)
                    self._update_lqas_absences(round_obj, round_data)
                    # Update district data
                    districts_results = round_data.get("data", {}) or {}
                    for district_name, district_data in districts_results.items():
                        district_id = district_data["district"]
                        try:
                            district = districts.get(id=district_id)
                            lqas_entry = self._update_lqas_entry(
                                round_obj=round_obj, district=district, district_data=district_data
                            )
                            self._update_caregiver_stats(lqas_entry, district_data)
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
        self.logger.info(f"Success: {total_updated}/{total_parsed}")
        self.logger.info(f"Failures: {total_failed}/{total_parsed}")
        if len(districts_not_found) > 0:
            self.logger.warning("Some districts were not found which can lead to incomplete data for some rounds")
            self.logger.warning(f"DISTRICTS NOT FOUND: {districts_not_found}")
        if len(rounds_not_found) > 0:
            self.logger.warning(f"Rounds not found: {rounds_not_found}")

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

    def _create_lqas_activity(self, round_obj: Round, obr_name: str, round_data, subactivity=None):
        try:
            LqasActivityStats.objects.create(
                round=round_obj,
                subactivity=subactivity,
                lqas_failed=round_data.get(LqasActivityStats.JSON_KEYS["lqas_failed"], 0) or 0,
                lqas_passed=round_data.get(LqasActivityStats.JSON_KEYS["lqas_passed"], 0) or 0,
                lqas_no_data=round_data.get(LqasActivityStats.JSON_KEYS["lqas_no_data"], 0) or 0,
                status=round_data.get(LqasActivityStats.JSON_KEYS["status"], LqasStatuses.INSCOPE)
                or LqasStatuses.INSCOPE,
            )

        except IntegrityError as e:
            self.logger.warning(
                f"LQAS activity data already exists for {obr_name} Round {round_data['number']} Subactivity {subactivity}"
            )
            self.logger.warning(e)
            raise e
        except ValidationError as e:
            self.logger.warning(
                f"LQAS activity data already exists for {obr_name} Round {round_data['number']} Subactivity {subactivity}"
            )
            self.logger.warning(e)
            raise e

    def _update_lqas_activity(self, round_obj: Round, round_data, subactivity=None):
        update_values = {
            "lqas_failed": round_data.get(LqasActivityStats.JSON_KEYS["lqas_failed"], 0) or 0,
            "lqas_passed": round_data.get(LqasActivityStats.JSON_KEYS["lqas_passed"], 0) or 0,
            "lqas_no_data": round_data.get(LqasActivityStats.JSON_KEYS["lqas_no_data"], 0) or 0,
            "status": round_data.get(LqasActivityStats.JSON_KEYS["status"], LqasStatuses.INSCOPE)
            or LqasStatuses.INSCOPE,
        }
        return self._safe_update_or_create(
            model_class=LqasActivityStats,
            lookup_kwargs={"round": round_obj, "subactivity": subactivity},
            update_values=update_values,
        )

    def _create_lqas_no_marks(self, round_obj: Round, obr_name: str, round_data, subactivity=None):
        no_mark_data = round_data.get("nfm_stats", {}) or {}
        try:
            LqasNoMarkStats.objects.create(
                round=round_obj,
                subactivity=subactivity,
                child_absent=no_mark_data.get(LqasNoMarkStats.JSON_KEYS["child_absent"], 0) or 0,
                other=no_mark_data.get(LqasNoMarkStats.JSON_KEYS["other"], 0) or 0,
                non_compliance=no_mark_data.get(LqasNoMarkStats.JSON_KEYS["non_compliance"], 0) or 0,
                child_was_asleep=no_mark_data.get(LqasNoMarkStats.JSON_KEYS["child_was_asleep"], 0) or 0,
                house_not_visited=no_mark_data.get(LqasNoMarkStats.JSON_KEYS["house_not_visited"], 0) or 0,
                child_is_a_visitor=no_mark_data.get(LqasNoMarkStats.JSON_KEYS["child_is_a_visitor"], 0) or 0,
                vaccinated_but_not_fm=no_mark_data.get(LqasNoMarkStats.JSON_KEYS["vaccinated_but_not_fm"], 0) or 0,
            )

        except IntegrityError as e:
            self.logger.warning(
                f"LQAS 'No mark' data already exists for {obr_name} Round {round_data['number']} Subactivity {subactivity}"
            )
            self.logger.warning(e)
            raise e
        except ValidationError as e:
            self.logger.warning(
                f"LQAS 'No mark' data already exists for {obr_name} Round {round_data['number']} Subactivity {subactivity}"
            )
            self.logger.warning(e)
            raise e

    def _update_lqas_no_marks(self, round_obj: Round, round_data, subactivity=None):
        no_mark_data = round_data.get("nfm_stats", {}) or {}
        update_values = {
            "vaccinated_but_not_fm": no_mark_data.get(LqasNoMarkStats.JSON_KEYS["vaccinated_but_not_fm"], 0) or 0,
            "child_is_a_visitor": no_mark_data.get(LqasNoMarkStats.JSON_KEYS["child_is_a_visitor"], 0) or 0,
            "house_not_visited": no_mark_data.get(LqasNoMarkStats.JSON_KEYS["house_not_visited"], 0) or 0,
            "child_was_asleep": no_mark_data.get(LqasNoMarkStats.JSON_KEYS["child_was_asleep"], 0) or 0,
            "non_compliance": no_mark_data.get(LqasNoMarkStats.JSON_KEYS["non_compliance"], 0) or 0,
            "child_absent": no_mark_data.get(LqasNoMarkStats.JSON_KEYS["child_absent"], 0) or 0,
            "other": no_mark_data.get(LqasNoMarkStats.JSON_KEYS["other"], 0) or 0,
        }
        return self._safe_update_or_create(
            model_class=LqasNoMarkStats,
            lookup_kwargs={"round": round_obj, "subactivity": subactivity},
            update_values=update_values,
        )

    def _create_lqas_absences(self, round_obj: Round, obr_name: str, round_data, subactivity=None):
        absence_data = round_data.get("nfm_abs_stats", {}) or {}

        try:
            LqasAbsenceStats.objects.create(
                round=round_obj,
                subactivity=subactivity,
                farm=absence_data.get(LqasAbsenceStats.JSON_KEYS["farm"], 0) or 0,
                other=absence_data.get(LqasAbsenceStats.JSON_KEYS["other"], 0) or 0,
                market=absence_data.get(LqasAbsenceStats.JSON_KEYS["market"], 0) or 0,
                school=absence_data.get(LqasAbsenceStats.JSON_KEYS["school"], 0) or 0,
                travelled=absence_data.get(LqasAbsenceStats.JSON_KEYS["travelled"], 0) or 0,
                in_playground=absence_data.get(LqasAbsenceStats.JSON_KEYS["in_playground"], 0) or 0,
                unknown=absence_data.get(LqasAbsenceStats.JSON_KEYS["unknown"], 0) or 0,
            )

        except IntegrityError as e:
            self.logger.warning(
                f"LQAS absence data already exists for {obr_name} Round {round_data['number']} Subactivity {subactivity}"
            )
            self.logger.warning(e)
            raise e
        except ValidationError as e:
            self.logger.warning(
                f"LQAS absence data already exists for {obr_name} Round {round_data['number']} Subactivity {subactivity}"
            )
            self.logger.warning(e)
            raise e

    def _update_lqas_absences(self, round_obj: Round, round_data, subactivity=None):
        absence_data = round_data.get("nfm_abs_stats", {}) or {}
        update_values = {
            "farm": absence_data.get(LqasAbsenceStats.JSON_KEYS["farm"], 0) or 0,
            "other": absence_data.get(LqasAbsenceStats.JSON_KEYS["other"], 0) or 0,
            "market": absence_data.get(LqasAbsenceStats.JSON_KEYS["market"], 0) or 0,
            "school": absence_data.get(LqasAbsenceStats.JSON_KEYS["school"], 0) or 0,
            "travelled": absence_data.get(LqasAbsenceStats.JSON_KEYS["travelled"], 0) or 0,
            "in_playground": absence_data.get(LqasAbsenceStats.JSON_KEYS["in_playground"], 0) or 0,
            "unknown": absence_data.get(LqasAbsenceStats.JSON_KEYS["unknown"], 0) or 0,
        }
        return self._safe_update_or_create(
            model_class=LqasAbsenceStats,
            lookup_kwargs={"round": round_obj, "subactivity": subactivity},
            update_values=update_values,
        )

    def _create_lqas_entry(self, round_obj: Round, district: OrgUnit, district_data, subactivity=None):
        try:
            lqas_entry = LqasEntry.objects.create(
                round=round_obj,
                subactivity=subactivity,
                district=district,
                total_children_fmd=district_data.get(LqasEntry.JSON_KEYS["total_children_fmd"], 0) or 0,
                total_children_checked=district_data.get(LqasEntry.JSON_KEYS["total_children_checked"], 0) or 0,
                total_sites_visited=district_data.get(LqasEntry.JSON_KEYS["total_sites_visited"], 0) or 0,
                status=district_data.get(LqasEntry.JSON_KEYS["status"], LqasStatuses.INSCOPE) or LqasStatuses.INSCOPE,
            )
            return lqas_entry

        except IntegrityError as e:
            self.logger.warning(
                f"LQAS entry already exists for {round_obj.campaign.obr_name} Round {round_obj.number} district {district.name} Subactivity {subactivity}"
            )
            self.logger.warning(e)
            raise e
        except ValidationError as e:
            self.logger.warning(
                f"LQAS entry already exists for {round_obj.campaign.obr_name} Round {round_obj.number} district {district.name} Subactivity {subactivity}"
            )
            self.logger.warning(e)
            raise e

    def _update_lqas_entry(self, round_obj: Round, district: OrgUnit, district_data, subactivity=None):
        update_values = {
            "total_children_fmd": district_data.get(LqasEntry.JSON_KEYS["total_children_fmd"], 0) or 0,
            "total_children_checked": district_data.get(LqasEntry.JSON_KEYS["total_children_checked"], 0) or 0,
            "total_sites_visited": district_data.get(LqasEntry.JSON_KEYS["total_sites_visited"], 0) or 0,
            "status": district_data.get(LqasEntry.JSON_KEYS["status"], LqasStatuses.INSCOPE) or LqasStatuses.INSCOPE,
        }
        return self._safe_update_or_create(
            model_class=LqasEntry,
            lookup_kwargs={"round": round_obj, "subactivity": subactivity, "district": district},
            update_values=update_values,
        )

    def _create_caregiver_stats(self, lqas_entry: LqasEntry, district_data):
        try:
            caregiver_data = district_data.get(LqasEntry.JSON_KEYS["care_giver_stats"], None)
            if caregiver_data:
                best_info_source_data = [
                    item
                    for item in caregiver_data.items()
                    if item[0] not in ["ratio", "caregivers_informed", "caregivers_informed_ratio"]
                ]  # TODO Test thoroughly
                best_info_source, best_info_source_ratio = best_info_source_data[0]
                LqasCareGiverStats.objects.create(
                    lqas_entry=lqas_entry,
                    ratio=caregiver_data.get("ratio", 0) or 0,
                    caregivers_informed=caregiver_data.get("caregivers_informed", 0) or 0,
                    caregivers_informed_ratio=caregiver_data.get("caregivers_informed_ratio", 0) or 0,
                    best_info_source=best_info_source,
                    best_info_ratio=best_info_source_ratio,
                )

        except IntegrityError as e:
            self.logger.warning(f"Care Giver stats already exist for LQAS entry already exists for {lqas_entry}")
            self.logger.warning(e)
            raise e
        except ValidationError as e:
            self.logger.warning(f"Care Giver stats already exist for LQAS entry already exists for {lqas_entry}")
            self.logger.warning(e)
            raise e

    def _update_caregiver_stats(self, lqas_entry: LqasEntry, district_data):
        caregiver_data = district_data.get(LqasEntry.JSON_KEYS["care_giver_stats"], None)
        if caregiver_data:
            best_info_source_data = [
                item
                for item in caregiver_data.items()
                if item[0] not in ["ratio", "caregivers_informed", "caregivers_informed_ratio"]
            ]  # TODO Test thoroughly
            best_info_source, best_info_source_ratio = best_info_source_data[0]
            update_values = {
                "ratio": caregiver_data.get("ratio", 0) or 0,
                "caregivers_informed": caregiver_data.get("caregivers_informed", 0) or 0,
                "caregivers_informed_ratio": caregiver_data.get("caregivers_informed_ratio", 0) or 0,
                "best_info_source": best_info_source,
                "best_info_ratio": best_info_source_ratio,
            }

            return self._safe_update_or_create(
                model_class=LqasCareGiverStats,
                lookup_kwargs={"lqas_entry": lqas_entry},
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
