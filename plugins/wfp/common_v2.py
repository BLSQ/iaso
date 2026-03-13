"""WFP ETL v2 - Under 5 children, South Sudan

Rewrite of the ETL process for structuring IASO submission data
into the WFP analytics models (Beneficiary, Journey, Visit, Step).

Key improvements over v1:
- Supports unlimited journeys per beneficiary (v1 was limited to 2)
- Correctly tracks weight per journey (not per entity)
- Does not mutate source submission data
- Handles defaulters as journey-ending events
- Cleaner journey boundary detection based on admission forms
- Better code structure with clear separation of concerns

Usage:
    docker-compose run iaso manage etl_ssd_v2 all_data
"""

import logging
import traceback

from datetime import date, datetime, timedelta

import sentry_sdk

from dateutil.relativedelta import relativedelta
from django.core.paginator import Paginator
from django.db.models import Case, CharField, Count, F, FloatField, Func, Q, Sum, Value, When
from django.db.models.functions import Cast, Concat, ExtractMonth, ExtractYear

from iaso.models import EntityType, TaskLog
from iaso.models.base import Instance
from plugins.wfp.models import Beneficiary, Journey, MonthlyStatistics, Step, Visit


logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Form classification
# ---------------------------------------------------------------------------

# Forms that definitively start a new journey (admission-only anthropometric
# forms). These are NOT used as followup forms.
JOURNEY_STARTING_FORMS = frozenset(
    [
        "Anthropometric visit child",
        "Anthropometric visit child_2",
        "Anthropometric visit child_U6",
        "wfp_coda_pbwg_anthropometric",
    ]
)

# All admission anthropometric forms (including ones also used as followup).
ADMISSION_FORMS = frozenset(JOURNEY_STARTING_FORMS | {"Anthropometric_BSFP_child_2", "PBWG_BSFP"})

# Anthropometric followup forms.
FOLLOWUP_FORMS = frozenset(
    [
        "child_antropometric_followUp_tsfp",
        "child_antropometric_followUp_otp",
        "child_antropometric_followUp_tsfp_2",
        "child_antropometric_followUp_otp_2",
        "antropometric_followUp_otp_u6",
        "Anthropometric_BSFP_child_2",
        "PBWG_BSFP",
        "wfp_coda_pbwg_luctating_followup_anthro",
        "wfp_coda_pbwg_followup_anthro",
    ]
)

# All anthropometric forms (both admission and followup).
ALL_ANTHROPOMETRIC_FORMS = ADMISSION_FORMS | FOLLOWUP_FORMS

# Assistance forms (used for step extraction and defaulter detection).
ASSISTANCE_FORMS = frozenset(
    [
        "child_assistance_2nd_visit_tsfp",
        "child_assistance_follow_up",
        "child_assistance_follow_up_2",
        "assistance_admission_otp",
        "assistance_admission_2nd_visit_otp",
        "child_assistance_admission",
        "child_assistance_admission_2",
        "child_assistance_admission_2_u6",
        "assistance_u6",
        "Anthropometric_BSFP_child_2",
        "PBWG_BSFP",
        "wfp_coda_pbwg_assistance",
        "wfp_coda_pbwg_assistance_followup",
    ]
)


# ---------------------------------------------------------------------------
# Field extraction helpers
# ---------------------------------------------------------------------------


def _first_of(data, *keys):
    """Return the first non-None, non-empty value for the given *keys*."""
    for key in keys:
        val = data.get(key)
        if val is not None and val != "":
            return val
    return None


def _safe_int(val, default=0):
    try:
        return int(val)
    except (ValueError, TypeError):
        return default


def _safe_float(val, default=None):
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


def extract_programme(data):
    """Extract the nutrition programme from form JSON.

    Replicates the logic of ``ETL.program_mapper`` but without mutating state.
    """
    if not data:
        return None

    # for field in ("programme", "_programme", "program", "programme_select_red", "overwrite_program"):
    for field in ("programme", "_programme", "program"):
        val = data.get(field)
        if val is not None:
            return val if val != "NONE" else ""

    program = data.get("program")
    if program is not None:
        if program == "NONE":
            prev = data.get("previous_discharge_program")
            if prev is not None:
                return prev
            return ""
        return program

    program2 = data.get("program_two")
    if program2 is not None and program2 != "NONE":
        return program2

    discharge = data.get("discharge_program")
    if discharge is not None and discharge != "NONE":
        return discharge

    new_prog = data.get("new_programme")
    if new_prog is not None and new_prog != "NONE":
        return new_prog
    return None


def extract_admission_type(data):
    """Extract admission type from form JSON."""
    raw = _first_of(
        data,
        "admission_type",
        "admission_type_red",
        "admission_TSFP",
        "admission_type_yellow",
        "_admission_type",
    )
    if raw is None:
        defaulter_type = data.get("_defaulter_admission_type")
        if defaulter_type not in (None, ""):
            raw = defaulter_type
    return _convert_admission_type(raw)


_ADMISSION_TYPE_MAP = {
    "referred_from_other_otp": "referred_from_otp_sam",
    "referred_from_tsfp": "referred_from_tsfp_mam",
    "referred_from_sc_itp": "referred_from_sc",
    "returned_from_sc": "referred_from_sc",
    "returnee": "returned_referral",
}


def _convert_admission_type(admission_type):
    """Normalize admission type values."""
    return _ADMISSION_TYPE_MAP.get(admission_type, admission_type)


def extract_admission_criteria(data):
    """Extract admission criteria from form JSON."""
    return _first_of(
        data,
        "Admission_choice",
        "admission_choice",
        "admission_criteria",
        "admission_criteria_yellow",
        "admission_criteria_red",
        "admission_criteria_red_no_oedema",
        "_admission_criteria",
    )


def extract_exit_type(data):
    """Extract exit type from form JSON.

    Replicates the logic of ``ETL.exit_type``.
    """
    exit_type = None

    # new_programme set to NONE -> reason for not continuing
    if data.get("new_programme") == "NONE":
        exit_type = data.get("reason_for_not_continuing")

    # Transfer to TSFP
    elif (data.get("new_programme") == "TSFP" and data.get("transfer__int__") == "1") or data.get(
        "eligible_for_TSFP"
    ) == "1":
        exit_type = "transfer_to_tsfp"

    # Transfer to OTP
    elif (data.get("new_programme") == "OTP" and data.get("transfer__int__") == "1") or data.get(
        "eligible_for_OTP"
    ) == "1":
        exit_type = "transfer_to_otp"

    # Transfer flags (alternative field names)
    elif data.get("_transfer_to_tsfp") == "1" or data.get("transfer_from_otp__bool__") == "1":
        exit_type = "transfer_to_tsfp"
    elif data.get("_transfer_to_otp") == "1" or data.get("transfer_from_tsfp__bool__") == "1":
        exit_type = "transfer_to_otp"

    # Reason for not continuing (various field names)
    elif data.get("reason_for_not_continuing") not in (None, ""):
        exit_type = data["reason_for_not_continuing"]
    elif data.get("reasons_not_continuing") not in (None, ""):
        exit_type = data["reasons_not_continuing"]
    elif data.get("reason_not_continue") not in (None, ""):
        exit_type = data["reason_not_continue"]
    elif data.get("not_continue") not in (None, ""):
        exit_type = data["not_continue"]

    # Non-respondent
    elif data.get("non_respondent") == "1" or data.get("non_respondent__int__") == "1":
        exit_type = "non_respondent"

    # Cured (discharge note or green visits)
    elif (
        data.get("discharge_note") == "yes"
        or data.get("discharge_note__int__") == "1"
        or (data.get("_number_of_green_visits") is not None and _safe_int(data.get("_number_of_green_visits"), 0) > 1)
    ):
        exit_type = "cured"

    # Defaulter flag
    elif data.get("_defaulter") == "1":
        exit_type = "defaulter"

    # Cured (alternative flag)
    elif data.get("_cured") == "1":
        exit_type = "cured"

    return _convert_exit_type(exit_type)


_EXIT_TYPE_MAP = {
    "dismissedduetocheating": "dismissed_due_to_cheating",
    "dismissal": "dismissed_due_to_cheating",
    "transferredout": "transferred_out",
    "voluntarywithdrawal": "voluntary_withdrawal",
}


def _convert_exit_type(exit_type):
    """Normalize exit type values."""
    return _EXIT_TYPE_MAP.get(exit_type, exit_type)


def extract_weight(data):
    """Extract weight from form data (kg)."""
    weight = data.get("weight_kgs")
    if weight is not None and weight != "":
        return _safe_float(weight)
    if weight == "":
        return 0.0
    prev_weight = data.get("previous_weight_kgs__decimal__")
    if prev_weight is not None:
        return _safe_float(prev_weight)
    return None


def extract_visit_date(submission):
    """Extract the best available date from a submission dict."""
    return submission.get("source_created_at") or submission.get("created_at")


def extract_muac(data):
    """Extract MUAC measurement from form data."""
    return _first_of(data, "muac", "muac_size")


def extract_visit_entry_point(submission):
    """Extract the entry point for a beneficiary to know if she/he has been refered from community health worker."""
    return (
        submission.get("who_referred_green")
        or submission.get("entry_point")
        or submission.get("who_referred_severe")
        or submission.get("_who_referred")
    )


def extract_whz_color(data):
    """Extract WHZ color from form data and normalize to full word."""
    raw = _first_of(data, "_Xwhz_color", "_Xfinal_color_result")
    return {"Y": "Yellow", "R": "Red", "G": "Green"}.get(raw, raw)


def extract_oedema(data):
    """Extract oedema indicator from form data."""
    val = data.get("oedema")
    if val is not None:
        return _safe_float(val)
    return None


def calculate_birth_date(data):
    """Calculate birth date from form data fields.

    Tries ``actual_birthday__date__`` first, then falls back to computing
    from ``age_entry`` + ``age__int__`` + ``registration_date``.
    """
    actual = data.get("actual_birthday__date__")
    if actual not in (None, ""):
        try:
            return datetime.strptime(actual[:10], "%Y-%m-%d").date()
        except (ValueError, TypeError):
            pass

    age_entry = data.get("age_entry")
    age = data.get("age__int__")
    registration_date = data.get("registration_date")

    if age_entry in (None, "") or age in (None, "") or registration_date in (None, ""):
        return None

    try:
        beneficiary_age = int(age)
        registered_at = datetime.strptime(registration_date[:10], "%Y-%m-%d").date()
        if age_entry == "years":
            return registered_at - relativedelta(years=beneficiary_age)
        if age_entry == "months":
            return registered_at - relativedelta(months=beneficiary_age)
    except (ValueError, TypeError):
        pass

    return None


def extract_gender(data):
    """Extract and normalize gender from form data."""
    raw = data.get("gender", data.get("_gender"))
    if raw == "F":
        return "Female"
    if raw == "M":
        return "Male"
    return raw


def extract_pbwg_physiology(data):
    """Extract PBWG physiology status (pregnant or breastfeeding)."""

    def normalize(value):
        return (value or "").strip().lower()

    is_pregnant = normalize(data.get("is_pregnant"))
    pregnant = normalize(data.get("pregnant"))
    lactating = normalize(data.get("luctating") or data.get("lactating"))
    physiology = normalize(data.get("physiology_status") or data.get("woman_status"))

    if "yes" in (is_pregnant, pregnant) or physiology == "pregnant":
        return "pregnant"

    if is_pregnant != "yes" and (lactating == "yes" or physiology == "breastfeeding"):
        return "breastfeeding"

    return None


# ---------------------------------------------------------------------------
# Assistance / Step extraction
# ---------------------------------------------------------------------------
def extract_assistance(data):
    """Extract all assistance items from form data.

    Returns a list of dicts with keys: type, quantity, ration_size.
    Replicates the logic of ``ETL.map_assistance_step``.
    """
    items = []

    # --- Non-food items ---
    if data.get("net_given") == "yes" or data.get("net_given__bool__") == "1" or data.get("_net") == "1":
        items.append({"type": "Mosquito Net", "quantity": 1})

    if data.get("soap_given") == "yes" or data.get("soap_given__bool__") == "1" or data.get("_soap") == "1":
        items.append({"type": "Soap", "quantity": 1})

    if data.get("ors_given") in ("Yes", "yes"):
        items.append({"type": "ORS", "quantity": 1})

    # --- Medicines ---
    med = data.get("medicine_given")
    if med is not None:
        items.append({"type": med, "quantity": 1})

    medication = data.get("medication")
    if medication not in (None, ""):
        for med_item in medication.split(" "):
            if med_item:
                items.append({"type": med_item, "quantity": 1})

    med2 = data.get("medicine_given_2")
    if med2 not in (None, ""):
        items.append({"type": med2, "quantity": 1})

    medication2 = data.get("medication_2")
    if medication2 not in (None, ""):
        for med_item in medication2.split(" "):
            if med_item:
                items.append({"type": med_item, "quantity": 1})

    if data.get("vitamins_given") == "1":
        items.append({"type": "Vitamin", "quantity": 1})

    if data.get("ab_given") == "1":
        items.append({"type": "albendazole", "quantity": 1})

    if data.get("measles_vacc") == "1":
        items.append({"type": "Measles vaccination", "quantity": 1})

    if data.get("art_given") == "1":
        items.append({"type": "ART", "quantity": 1})

    anti_helminth = data.get("anti_helminth_given")
    if anti_helminth not in (None, ""):
        items.append({"type": anti_helminth, "quantity": 1})

    # --- Rations ---
    items.extend(_extract_rations(data))

    return [item for item in items if item.get("type") and item["type"] != ""]


def _extract_rations(data):
    """Extract ration / food assistance from form data."""
    items = []

    # Primary ration fields (ration_to_distribute / ration)
    if data.get("ration_to_distribute") is not None or data.get("ration") is not None:
        quantity = _safe_float(data.get("quantity"), 0)
        if data.get("_total_number_of_sachets") not in (None, ""):
            quantity = _safe_float(data["_total_number_of_sachets"], 0)
        elif data.get("_csb_packets") is not None:
            quantity = _safe_float(data["_csb_packets"], 0)

        ration_type = data.get("ration_to_distribute") or data.get("ration") or ""
        ration_size = data.get("ration_size") or data.get("ration_limit")

        if ration_type:
            items.append(
                {
                    "type": ration_type,
                    "quantity": quantity or 0,
                    "ration_size": ration_size,
                }
            )

    # TSFP-specific ration
    if data.get("ration_type_tsfp") is not None:
        quantity = 0
        if data.get("_total_number_of_sachets") not in (None, ""):
            quantity = _safe_float(data["_total_number_of_sachets"], 0)
        items.append(
            {
                "type": data["ration_type_tsfp"],
                "quantity": quantity,
                "ration_size": data.get("ration_size") or data.get("ration_limit"),
            }
        )
    # OTP-specific ration
    elif data.get("ration_type_otp") is not None:
        quantity = 0
        if data.get("_total_number_of_sachets") not in (None, ""):
            quantity = _safe_float(data["_total_number_of_sachets"], 0)
        items.append(
            {
                "type": data["ration_type_otp"],
                "quantity": quantity,
            }
        )
    # Generic ration type (ration_type field or others not handled above)
    elif any(data.get(f) not in (None, "") for f in ("ration_type", "ration", "ration_type_tsfp", "ration_type_otp")):
        ration_type = data.get("ration_type") or data.get("ration") or ""
        quantity = 0
        ration_size = ""

        if ration_type in ("csb", "csb1", "csb2"):
            quantity = _safe_float(data.get("_csb_packets"), data.get("_total_number_of_sachets", 0))
        elif ration_type == "lndf":
            quantity = _safe_float(data.get("_lndf_kgs"), 0)
        elif _get_ration_type_any(data) == "cbt":
            ration_size = data.get("ration_size") or data.get("ration_limit")
        elif ration_type in ("rusf", "rutf"):
            sachets = data.get("_total_number_of_sachets")
            sachets_rutf = data.get("_total_number_of_sachets_rutf")
            if sachets in ("", ".") or (sachets_rutf is not None and sachets_rutf in ("", ".")):
                quantity = 0
            else:
                quantity = _safe_float(sachets or sachets_rutf, 0)

        if ration_type:
            items.append(
                {
                    "type": ration_type,
                    "quantity": quantity,
                    "ration_size": ration_size or None,
                }
            )

    return items


def _get_ration_type_any(data):
    """Get ration type from any of the possible fields."""
    return data.get("ration_type_tsfp") or data.get("ration") or data.get("ration_type") or data.get("ration_type_otp")


# ---------------------------------------------------------------------------
# Weight computation
# ---------------------------------------------------------------------------
def compute_weight_gain(initial_weight, current_weight, duration_days):
    """Compute weight gain/loss metrics.

    Both gain and loss are expressed in **g/kg/day**, the standard
    nutrition metric for assessing recovery in malnourished children.

    Formula: abs(weight_diff_grams) / (initial_weight_kg * duration_days)

    Returns (weight_gain, weight_loss) where exactly one of the two is
    non-zero.  Both are >= 0.
    """
    if not initial_weight or not current_weight:
        return 0.0, 0.0

    initial = float(initial_weight)
    current = float(current_weight)

    if initial <= 0 or duration_days <= 0:
        return 0.0, 0.0

    diff_grams = round((current - initial) * 1000, 4)
    rate = round(abs(diff_grams) / (initial * float(duration_days)), 4)

    if diff_grams >= 0:
        return rate, 0.0
    return 0.0, rate


# ---------------------------------------------------------------------------
# Defaulter detection helpers
# ---------------------------------------------------------------------------


def _extract_next_visit_info(data):
    """Extract next visit date and interval from an assistance form."""
    next_visit_date = _first_of(
        data,
        "next_visit__date__",
        "new_next_visit__date__",
        "next_visit_date__date__",
    )

    next_visit_days = _first_of(data, "next_visit_days", "number_of_days__int__")

    if next_visit_days in (None, ""):
        for field in (
            "OTP_next_visit",
            "TSFP_next_visit",
            "tsfp_next_visit",
            "otp_next_visit",
        ):
            val = data.get(field)
            if val not in (None, "", "--"):
                next_visit_days = val
                break

    if next_visit_days in (None, ""):
        val = data.get("number_of_days__int__")
        if val not in (None, "", "--"):
            next_visit_days = val

    return next_visit_date, _safe_int(next_visit_days, 0)


def _to_date(dt):
    """Convert datetime or date to date."""
    if dt is None:
        return None
    if isinstance(dt, datetime):
        return dt.date()
    return dt


def _format_date(dt):
    """Format a datetime/date as a ``YYYY-MM-DD`` string, or *None*."""
    if dt is None:
        return None
    if isinstance(dt, (datetime, date)):
        return dt.strftime("%Y-%m-%d")
    return str(dt)[:10]


# ---------------------------------------------------------------------------
# Main ETL class
# ---------------------------------------------------------------------------
class ETLV2:
    """ETL processor for South Sudan Under-5 children, version 2.

    Improvements over v1
    --------------------
    * Supports an unlimited number of journeys per beneficiary.
    * Correctly tracks initial/discharge weight **per journey**.
    * Never mutates source (Instance.json) data.
    * Detects defaulters as journey-ending events.
    * Journey boundaries are determined by admission forms, with
      post-transfer continuation handled via ``transfer_info``.
    """

    def __init__(self, entity_type=None):
        self.entity_type = entity_type

    def get_account(self):
        entity_type = EntityType.objects.select_related("account").filter(code=self.entity_type).first()
        return entity_type.account

    @staticmethod
    def _retrieve_submissions(entity_type_code, entity_ids, page_size=5000, page_number=1):
        """Retrieve Instance records for the given entity type,
           paginated by entity_id batches to avoid memory overhead.
        Returns a (queryset, page_object) tuple.
        """
        entity_ids = sorted(list(entity_ids))
        paginator = Paginator(entity_ids, page_size)

        current_page = paginator.get_page(page_number)
        current_page_entity_ids = current_page.object_list

        query_set = (
            Instance.objects.filter(
                entity__entity_type__code=entity_type_code,
                json__isnull=False,
                form__isnull=False,
            )
            .exclude(deleted=True)
            .exclude(entity__deleted_at__isnull=False)
        )
        if current_page_entity_ids is not None:
            query_set = query_set.filter(entity_id__in=current_page_entity_ids)

        query_set = query_set.values(
            "id",
            "entity_id",
            "json",
            "form__form_id",
            "org_unit_id",
            "source_created_at",
            "created_at",
        ).order_by("entity_id", "source_created_at", "created_at")
        return query_set, current_page

    # ------------------------------------------------------------------
    # Entity processing
    # ------------------------------------------------------------------
    def _process_entity(self, program_type, entity_id, submissions, account, existing_entity_ids):
        """Process all submissions for a single entity.

        Returns ``(beneficiary_or_None, journeys, visits, steps)`` where
        ``beneficiary_or_None`` is a **new** (unsaved) ``Beneficiary``
        instance when the entity was not previously known, or ``None``
        when the entity already had a record.

        Returns ``None`` (single value) when the entity should be skipped
        entirely (invalid data, no journeys, etc.).
        """
        beneficiary_info = self._extract_beneficiary_info(submissions)

        if not self._is_valid_beneficiary(beneficiary_info):
            return None

        is_new = entity_id not in existing_entity_ids
        if is_new:
            beneficiary = Beneficiary(
                entity_id=entity_id,
                gender=beneficiary_info["gender"],
                birth_date=beneficiary_info["birth_date"],
                account=account,
                guidelines=beneficiary_info.get("guidelines", "OLD"),
            )
        else:
            beneficiary = Beneficiary.objects.filter(entity_id=entity_id).first()
            if beneficiary is None:
                return None

        journey_groups = self._split_into_journeys(submissions)
        if not journey_groups:
            return None

        all_journeys = []
        all_visits = []
        all_steps = []

        # transfer_info carries context from a journey that ended with a
        # transfer to the next journey group (which may lack an explicit
        # admission form).
        transfer_info = None

        for journey_subs in journey_groups:
            result = self._process_journey(program_type, journey_subs, beneficiary, transfer_info)
            transfer_info = None  # consumed

            if result is None:
                continue

            journey, visits, steps = result
            all_journeys.append(journey)
            all_visits.extend(visits)
            all_steps.extend(steps)

            # If this journey ended with a transfer, prepare info for the
            # next journey group.
            if journey.exit_type in ("transfer_to_tsfp", "transfer_to_otp"):
                transfer_info = self._build_transfer_info(journey)

        if not all_journeys:
            return None

        # Require the first journey to have a nutrition programme.
        if all_journeys[0].nutrition_programme is None:
            return None

        new_beneficiary = beneficiary if is_new else None
        return new_beneficiary, all_journeys, all_visits, all_steps

    # ------------------------------------------------------------------
    # Beneficiary info
    # ------------------------------------------------------------------
    @staticmethod
    def _extract_beneficiary_info(submissions):
        """Scan all submissions and keep the latest valid values."""
        info = {
            "gender": None,
            "birth_date": None,
            "guidelines": None,
            "physiology": None,
        }
        for sub in submissions:
            data = sub.get("json")
            if not data:
                continue

            gender = extract_gender(data)
            if gender in ("Male", "Female"):
                info["gender"] = gender
            else:
                info["physiology"] = extract_pbwg_physiology(data)
                info["gender"] = None
            birth_date = calculate_birth_date(data)
            if birth_date is not None:
                info["birth_date"] = birth_date

            guidelines = data.get("guidelines")
            if guidelines:
                info["guidelines"] = guidelines

        return info

    @staticmethod
    def _is_valid_beneficiary(info):
        return info["birth_date"] is not None and (
            info["gender"] in ("Male", "Female") or info["physiology"] in ("pregnant", "breastfeeding", None)
        )

    # ------------------------------------------------------------------
    # Journey splitting
    # ------------------------------------------------------------------
    def _split_into_journeys(self, submissions):
        """Split an entity's submissions into journey groups.

        Rules
        -----
        * A form in ``JOURNEY_STARTING_FORMS`` (admission-only forms)
          **always** starts a new journey group.
        * After an exit event is detected in the current group, the next
          anthropometric form (even if it is a followup-type form like
          BSFP) starts a new journey group.  This handles transfers where
          the post-transfer programme uses a form that doubles as
          followup.
        * Only groups containing at least one admission form (or any
          anthropometric form if ``transfer_info`` will fill in the gap)
          are kept.
        """
        journeys = []
        current = []
        current_has_exit = False

        for sub in submissions:
            form_id = sub.get("form__form_id")

            should_split = False

            # Admission-only form always starts a new journey.
            if (
                form_id in JOURNEY_STARTING_FORMS
                and current
                or (form_id in ALL_ANTHROPOMETRIC_FORMS and current_has_exit and current)
            ):
                should_split = True

            if should_split:
                journeys.append(current)
                current = []
                current_has_exit = False

            current.append(sub)

            # Detect exit events so we know to split on the next
            # anthropometric form.
            if form_id in ALL_ANTHROPOMETRIC_FORMS:
                data = sub.get("json", {})
                et = extract_exit_type(data)
                if et is not None and et != "":
                    current_has_exit = True

        if current:
            journeys.append(current)

        # Keep groups that have at least one anthropometric form (they
        # will have either an explicit admission or will be handled via
        # transfer_info).
        return [j for j in journeys if any(s.get("form__form_id") in ALL_ANTHROPOMETRIC_FORMS for s in j)]

    # ------------------------------------------------------------------
    # Journey processing
    # ------------------------------------------------------------------

    def _process_journey(self, program_type, submissions, beneficiary, transfer_info=None):
        """Build a Journey and its Visits / Steps from a group of submissions.

        Parameters
        ----------
        submissions : list[dict]
            Submission dicts forming this journey.
        beneficiary : Beneficiary
            Parent beneficiary (saved or unsaved).
        transfer_info : dict, optional
            If this journey follows a transfer, provides programme,
            admission_type, admission_criteria, start_date, and
            initial_weight from the preceding journey.

        Returns ``(Journey, [Visit], [Step])`` or ``None``.
        """
        # --- Locate the admission form (or use transfer info) -----------
        admission_sub = None
        admission_data = None
        for sub in submissions:
            if sub.get("form__form_id") in ADMISSION_FORMS:
                admission_sub = sub
                admission_data = sub.get("json", {})
                break

        if admission_data is None and transfer_info is None:
            # No admission and no transfer context — cannot create journey.
            return None

        if admission_data is not None:
            programme = extract_programme(admission_data)
            physiology_status = extract_pbwg_physiology(admission_data)
            admission_type = extract_admission_type(admission_data)
            admission_criteria = extract_admission_criteria(admission_data)
            start_date = extract_visit_date(admission_sub)
            initial_weight = extract_weight(admission_data)
            instance_id = admission_sub["id"]
        else:
            # Post-transfer journey without an explicit admission form.
            programme = transfer_info["nutrition_programme"]
            physiology_status = transfer_info["physiology_status"]
            admission_type = transfer_info["admission_type"]
            admission_criteria = transfer_info.get("admission_criteria")
            start_date = transfer_info.get("start_date")
            initial_weight = transfer_info.get("initial_weight")
            instance_id = submissions[0]["id"] if submissions else None

        # --- Walk through all submissions to detect exit & final weight --
        exit_type = None
        end_date = None
        discharge_weight = initial_weight
        last_visit_date = start_date

        for sub in submissions:
            data = sub.get("json", {})
            form_id = sub.get("form__form_id")

            w = extract_weight(data)
            if w is not None:
                discharge_weight = w

            vd = extract_visit_date(sub)
            if vd is not None:
                last_visit_date = vd

            if form_id in ALL_ANTHROPOMETRIC_FORMS:
                et = extract_exit_type(data)
                if et is not None and et != "":
                    exit_type = et
                    end_date = vd

        # --- Defaulter detection (from assistance forms) ----------------
        if exit_type is None:
            defaulter_date = self._check_defaulter(submissions)
            if defaulter_date is not None:
                exit_type = "defaulter"
                end_date = defaulter_date

        # --- Weight & duration ------------------------------------------
        duration = None
        weight_gain = 0.0
        weight_loss = 0.0
        effective_end = end_date or last_visit_date

        start_d = _to_date(start_date)
        end_d = _to_date(effective_end)

        if start_d and end_d:
            try:
                duration = (end_d - start_d).days
            except TypeError:
                duration = None

        # Weight gain only computed for cured and certain transfer exits.
        if exit_type in ("cured", "transfer_to_tsfp") and duration is not None:
            weight_gain, weight_loss = compute_weight_gain(initial_weight, discharge_weight, duration)

        # --- Create Journey object --------------------------------------
        journey = Journey(
            beneficiary=beneficiary,
            programme_type=program_type,
            physiology_status=physiology_status,
            nutrition_programme=programme,
            admission_type=admission_type,
            admission_criteria=admission_criteria,
            muac_size=extract_muac(admission_data) if admission_data else None,
            whz_score=(admission_data.get("whz_score") if admission_data else None),
            initial_weight=initial_weight,
            discharge_weight=(discharge_weight if exit_type in ("cured", "transfer_to_tsfp") else None),
            weight_gain=weight_gain,
            weight_loss=weight_loss,
            start_date=_format_date(start_date),
            end_date=_format_date(end_date) if exit_type else None,
            duration=duration if exit_type else None,
            exit_type=exit_type,
            instance_id=instance_id,
        )

        # --- Build Visits & Steps ---------------------------------------
        visit_groups = self._group_into_visits(submissions)
        visits = []
        steps = []

        for visit_num, visit_subs in enumerate(visit_groups):
            visit_result = self._process_visit(visit_subs, journey, visit_num)
            if visit_result is None:
                continue
            visit, visit_steps = visit_result
            visits.append(visit)
            steps.extend(visit_steps)

        if not visits:
            return None

        return journey, visits, steps

    # ------------------------------------------------------------------
    # Transfer info
    # ------------------------------------------------------------------

    @staticmethod
    def _build_transfer_info(journey):
        """Prepare context for a post-transfer journey."""
        if journey.exit_type == "transfer_to_tsfp":
            programme = "TSFP"
            admission_type = "referred_from_otp_sam"
        elif journey.exit_type == "transfer_to_otp":
            programme = "OTP"
            admission_type = "referred_from_tsfp_mam"
        else:
            return None

        if journey.nutrition_programme == "BSFP":
            admission_type = "referred_from_BSFP"

        return {
            "nutrition_programme": programme,
            "physiology_status": journey.physiology_status,
            "admission_type": admission_type,
            "admission_criteria": journey.admission_criteria,
            "start_date": journey.end_date,
            "initial_weight": journey.discharge_weight or journey.initial_weight,
        }

    # ------------------------------------------------------------------
    # Defaulter detection
    # ------------------------------------------------------------------

    @staticmethod
    def _check_defaulter(submissions):
        """Check whether the entity defaulted during this journey.

        Looks at the **last** assistance form.  If its scheduled next
        visit date (+ buffer days) has passed and there is no subsequent
        anthropometric visit, the entity is considered a defaulter.

        Returns the estimated default date, or ``None``.
        """
        # Walk backwards to find the last assistance form with next-visit info.
        last_assistance_idx = None
        last_assistance_data = None

        for idx in range(len(submissions) - 1, -1, -1):
            sub = submissions[idx]
            form_id = sub.get("form__form_id")
            if form_id in ASSISTANCE_FORMS:
                data = sub.get("json", {})
                nv_date, _ = _extract_next_visit_info(data)
                if nv_date:
                    last_assistance_idx = idx
                    last_assistance_data = data
                    break

        if last_assistance_data is None:
            return None

        next_visit_date_str, next_visit_days = _extract_next_visit_info(last_assistance_data)
        if not next_visit_date_str:
            return None

        try:
            next_visit_date = datetime.strptime(next_visit_date_str[:10], "%Y-%m-%d").date()
        except (ValueError, TypeError):
            return None

        # Deadline = next visit date + interval (default 14 days).
        buffer_days = next_visit_days if next_visit_days > 0 else 14
        deadline = next_visit_date + timedelta(days=buffer_days)

        if date.today() <= deadline:
            return None

        # Check if there is any anthropometric form AFTER this assistance form.
        has_later_anthro = any(
            submissions[i].get("form__form_id") in ALL_ANTHROPOMETRIC_FORMS
            for i in range(last_assistance_idx + 1, len(submissions))
        )

        if has_later_anthro:
            return None

        return deadline

    # ------------------------------------------------------------------
    # Visit grouping
    # ------------------------------------------------------------------

    @staticmethod
    def _group_into_visits(submissions):
        """Group a journey's submissions into visit groups.

        Each anthropometric form anchors a new visit.  Non-anthropometric
        forms are attached to the most recent (preceding) anthropometric
        form's visit group.
        """
        visits = []
        current = []

        for sub in submissions:
            form_id = sub.get("form__form_id")
            if form_id in ALL_ANTHROPOMETRIC_FORMS and current:
                visits.append(current)
                current = []
            current.append(sub)

        if current:
            visits.append(current)

        # Only keep groups that actually contain an anthropometric form.
        return [v for v in visits if any(s.get("form__form_id") in ALL_ANTHROPOMETRIC_FORMS for s in v)]

    # ------------------------------------------------------------------
    # Visit processing
    # ------------------------------------------------------------------

    @staticmethod
    def _process_visit(submissions, journey, visit_number):
        """Create a Visit and its Steps from a visit group.

        Returns ``(Visit, [Step])`` or ``None``.
        """
        anthro_sub = None
        anthro_data = None
        for sub in submissions:
            if sub.get("form__form_id") in ALL_ANTHROPOMETRIC_FORMS:
                anthro_sub = sub
                anthro_data = sub.get("json", {})
                break

        if anthro_sub is None:
            return None

        visit = Visit(
            journey=journey,
            date=extract_visit_date(anthro_sub),
            number=visit_number,
            muac_size=extract_muac(anthro_data),
            whz_color=extract_whz_color(anthro_data),
            oedema=extract_oedema(anthro_data),
            org_unit_id=anthro_sub.get("org_unit_id"),
            instance_id=anthro_sub["id"],
            entry_point=extract_visit_entry_point(anthro_data),
        )

        steps = []
        for sub in submissions:
            data = sub.get("json", {})
            for item in extract_assistance(data):
                step = Step(
                    visit=visit,
                    assistance_type=item["type"],
                    quantity_given=_safe_float(item.get("quantity"), 0) or 0,
                    ration_size=item.get("ration_size"),
                    instance_id=sub["id"],
                )
                steps.append(step)

        return visit, steps

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------

    @staticmethod
    def _save_all(beneficiaries, journeys, visits, steps, account, last_entity_id, task):
        """Bulk-save all ETL objects.

        Objects are saved in dependency order (Beneficiary -> Journey ->
        Visit -> Step) so that foreign-key IDs are available at each
        stage (PostgreSQL ``bulk_create`` sets PKs on the returned
        objects).
        """
        task.save()
        try:
            Beneficiary.objects.bulk_create(beneficiaries)
            Journey.objects.bulk_create(journeys)
            Visit.objects.bulk_create(visits)
            Step.objects.bulk_create(steps)
            status = "SUCCESS"
            logger.info(
                f"Saved: {len(beneficiaries)} beneficiaries, "
                f"{len(journeys)} journeys, "
                f"{len(visits)} visits, "
                f"{len(steps)} steps"
            )
        except Exception as err:
            sentry_sdk.capture_exception(err)
            task.result = {
                "message": str(err),
                "error": traceback.format_exc(),
            }
            status = "ERRORED"
            logger.error(f"Error saving ETL data: {err}", exc_info=True)
            TaskLog.objects.create(
                task=task,
                message=f"{err} for {account} on beneficiary {last_entity_id}",
            )
        task.status = status
        task.save()

    # --------------------------------------------------------------------------------------------------------
    # Aggregating beneficiary journeys data by org unit and period(month and year extracted from visite date)
    # --------------------------------------------------------------------------------------------------------
    @staticmethod
    def _retrieve_aggregated_journeys_data(
        account, program_type, org_unit_with_updated_data, page_size=5000, page_number=1
    ):

        org_units = sorted(list(org_unit_with_updated_data))
        paginator = Paginator(org_units, page_size)
        current_page = paginator.get_page(page_number)
        current_page_org_units = current_page.object_list

        queryset = Visit.objects.filter(
            date__isnull=False,
            journey__programme_type=program_type,
            journey__beneficiary__account=account,
        ).select_related("journey", "org_unit")

        if current_page_org_units is not None:
            queryset = queryset.filter(org_unit_id__in=current_page_org_units)

        queryset = queryset.annotate(
            year=ExtractYear("journey__visit__date"),
            month=ExtractMonth("journey__visit__date"),
            muac_numeric=Cast("muac_size", output_field=FloatField()),
            dhis2_id=F("org_unit__source_ref"),
            nutrition_programme=F("journey__nutrition_programme"),
            programme_type=F("journey__programme_type"),
        ).annotate(
            period=Concat(
                F("year"),
                Func(
                    Cast(F("month"), CharField()),
                    Value(2),
                    Value("0"),
                    function="LPAD",
                ),
                output_field=CharField(),
            )
        )

        # Fields for Group By
        fields = ["period", "org_unit_id", "dhis2_id", "programme_type", "nutrition_programme", "year", "month"]

        if program_type == "U5":
            queryset = queryset.annotate(
                gender=F("journey__beneficiary__gender"),
            )
            fields.append("gender")

        elif program_type == "PLW":
            queryset = queryset.annotate(
                physiology_status=F("journey__physiology_status"),
            )
            fields.append("physiology_status")

        queryset = (
            queryset.values(*fields)
            .annotate(
                muac_under_11_5=Count(
                    "journey__beneficiary_id",
                    filter=Q(journey__programme_type="U5", muac_numeric__lt=11.5),
                    distinct=True,
                ),
                muac_11_5_12_4=Count(
                    "journey__beneficiary_id",
                    filter=Q(journey__programme_type="U5", muac_numeric__range=(11.5, 12.4)),
                    distinct=True,
                ),
                muac_above_12_5=Count(
                    "journey__beneficiary_id",
                    filter=Q(journey__programme_type="U5", muac_numeric__gte=12.5),
                    distinct=True,
                ),
                muac_under_23=Count(
                    "journey__beneficiary_id",
                    filter=Q(journey__programme_type="PLW", muac_numeric__lt=23),
                    distinct=True,
                ),
                muac_above_23=Count(
                    "journey__beneficiary_id",
                    filter=Q(journey__programme_type="PLW", muac_numeric__gte=23),
                    distinct=True,
                ),
                whz_score_2=Count("journey__beneficiary_id", filter=Q(whz_color="Green"), distinct=True),
                whz_score_3=Count(
                    "journey__beneficiary_id", filter=Q(journey__programme_type="U5", whz_color="Red"), distinct=True
                ),
                whz_score_3_2=Count(
                    "journey__beneficiary_id", filter=Q(journey__programme_type="U5", whz_color="Yellow"), distinct=True
                ),
                oedema=Count(
                    "journey__beneficiary_id",
                    filter=Q(journey__programme_type="U5", journey__admission_criteria="oedema"),
                    distinct=True,
                ),
                admission_type_new_case=Count(
                    "journey__beneficiary_id", filter=Q(journey__admission_type="new_case"), distinct=True
                ),
                admission_type_relapse=Count(
                    "journey__beneficiary_id", filter=Q(journey__admission_type="relapse"), distinct=True
                ),
                admission_type_returned_defaulter=Count(
                    "journey__beneficiary_id", filter=Q(journey__admission_type="returned_defaulter"), distinct=True
                ),
                admission_type_returned_referral=Count(
                    "journey__beneficiary_id", filter=Q(journey__admission_type="returned_referral"), distinct=True
                ),
                admission_type_transfer_from_other_tsfp=Count(
                    "journey__beneficiary_id",
                    filter=Q(journey__admission_type="transfer_from_other_tsfp"),
                    distinct=True,
                ),
                admission_type_admission_sc_itp_otp=Count(
                    "journey__beneficiary_id",
                    filter=Q(journey__admission_type__in=["referred_from_sc", "referred_from_otp_sam"]),
                    distinct=True,
                ),
                admission_type_transfer_sc_itp_otp=Count(
                    "journey__beneficiary_id",
                    filter=Q(journey__exit_type__in=["transfer_to_sc_itp", "transferred_to_otp"]),
                    distinct=True,
                ),
                exit_type_transfer_in_from_other_tsfp=Count(
                    "journey__beneficiary_id",
                    filter=Q(journey__exit_type__in=["transfer_from_other_tsfp", "transfer_to_tsfp"]),
                    distinct=True,
                ),
                exit_type_cured=Count("journey__beneficiary_id", filter=Q(journey__exit_type="cured"), distinct=True),
                exit_type_death=Count("journey__beneficiary_id", filter=Q(journey__exit_type="death"), distinct=True),
                exit_type_defaulter=Count(
                    "journey__beneficiary_id", filter=Q(journey__exit_type="defaulter"), distinct=True
                ),
                exit_type_non_respondent=Count(
                    "journey__beneficiary_id", filter=Q(journey__exit_type="non_respondent"), distinct=True
                ),
                pregnant=Count(
                    "journey__beneficiary_id", filter=Q(journey__physiology_status="pregnant"), distinct=True
                ),
                breastfeeding=Count(
                    "journey__beneficiary_id", filter=Q(journey__physiology_status="breastfeeding"), distinct=True
                ),
                number_visits=Count("id", distinct=True),
            )
            .order_by("org_unit_id")
        )
        return queryset, current_page

    # ------------------------------------------------------------------
    # Recording aggregated monthly data by org unit and program type (U5 or PLW)
    # ------------------------------------------------------------------
    @staticmethod
    def _process_monthly_data(program_type, aggregated_data, account):
        all_journeys = []
        for row in aggregated_data:
            journey_by_org_unit_period = MonthlyStatistics(
                account=account,
                programme_type=program_type,
                org_unit_id=row["org_unit_id"],
                dhis2_id=row["dhis2_id"],
                month=row["month"],
                year=row["year"],
                period=row["period"],
                gender=row.get("gender"),
                physiology_status=row.get("physiology_status"),
                nutrition_programme=row["nutrition_programme"],
                # --- Clinical Indicators ---
                oedema=row["oedema"],
                muac_under_11_5=row.get("muac_under_11_5"),
                muac_11_5_12_4=row.get("muac_11_5_12_4"),
                muac_above_12_5=row.get("muac_above_12_5"),
                muac_under_23=row.get("muac_under_23"),
                muac_above_23=row.get("muac_above_23"),
                whz_score_2=row.get("whz_score_2"),
                whz_score_3=row.get("whz_score_3"),
                whz_score_3_2=row.get("whz_score_3_2"),
                # --- Admissions ---
                admission_type_new_case=row["admission_type_new_case"],
                admission_type_relapse=row["admission_type_relapse"],
                admission_type_returned_defaulter=row["admission_type_returned_defaulter"],
                admission_type_returned_referral=row["admission_type_returned_referral"],
                admission_type_transfer_from_other_tsfp=row["admission_type_transfer_from_other_tsfp"],
                admission_type_admission_sc_itp_otp=row["admission_type_admission_sc_itp_otp"],
                admission_type_transfer_sc_itp_otp=row["admission_type_transfer_sc_itp_otp"],
                exit_type_transfer_in_from_other_tsfp=row["exit_type_transfer_in_from_other_tsfp"],
                # --- Exits ---
                exit_type_cured=row["exit_type_cured"],
                exit_type_death=row["exit_type_death"],
                exit_type_defaulter=row["exit_type_defaulter"],
                exit_type_non_respondent=row["exit_type_non_respondent"],
                pregnant=row["pregnant"],
                breastfeeding=row["breastfeeding"],
                number_visits=row["number_visits"],
            )
            all_journeys.append(journey_by_org_unit_period)
        return MonthlyStatistics.objects.bulk_create(all_journeys)
