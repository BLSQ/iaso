import logging

from itertools import groupby
from operator import itemgetter

from iaso.models import Task
from plugins.wfp.common_v2 import ETLV2
from plugins.wfp.models import Beneficiary


logger = logging.getLogger(__name__)


class Under5:
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

    PROGRAMME_TYPE = "U5"
    ENTITY_TYPE_CODE = "ssd_under5"
    
    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def run(self, updated_entity_ids, entity_type_code=None, task_name="etl_ssd"):
        """Main entry point for the ETL.

        Parameters
        ----------
        entity_type_code : str, optional
            Override entity type code (defaults to ``ssd_under5``).
        updated_entity_ids : iterable of int, optional
            If given, only process these entities.
        task_name : str
            Name for the IASO Task log entry.
        """
        code = entity_type_code or self.ENTITY_TYPE_CODE
        elt_v2 = ETLV2(code)
        account = elt_v2.get_account()
        submissions = ETLV2._retrieve_submissions(code, updated_entity_ids)

        all_beneficiaries = []
        all_journeys = []
        all_visits = []
        all_steps = []

        existing_entity_ids = set(
            Beneficiary.objects.filter(account=account).exclude(entity_id=None).values_list("entity_id", flat=True)
        )

        current_entity_id = None
        entity_count = 0
        skipped_count = 0

        for entity_id, entity_submissions in groupby(submissions, key=itemgetter("entity_id")):
            current_entity_id = entity_id
            entity_count += 1

            entity_subs = list(entity_submissions)
            result = elt_v2._process_entity(self.PROGRAMME_TYPE, entity_id, entity_subs, account, existing_entity_ids)
            if result is None:
                skipped_count += 1
                continue

            beneficiary, journeys, visits, steps = result
            if beneficiary is not None:
                all_beneficiaries.append(beneficiary)
            all_journeys.extend(journeys)
            all_visits.extend(visits)
            all_steps.extend(steps)

            if entity_count % 5000 == 0:
                logger.info(f"Processed {entity_count} entities ({skipped_count} skipped)")

        logger.info(
            f"Processed {entity_count} entities total ({skipped_count} skipped) for {self.PROGRAMME_TYPE}. "
            f"Creating: {len(all_beneficiaries)} beneficiaries, "
            f"{len(all_journeys)} journeys, "
            f"{len(all_visits)} visits, "
            f"{len(all_steps)} steps \n"
        )

        task = Task(
            name=f"{task_name} for {code}",
            account=account,
            status="QUEUED",
        )
        elt_v2._save_all(
            all_beneficiaries,
            all_journeys,
            all_visits,
            all_steps,
            account,
            current_entity_id,
            task,
        )
