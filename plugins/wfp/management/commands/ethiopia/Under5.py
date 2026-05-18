import logging

from itertools import groupby
from operator import itemgetter

from django.core.paginator import Paginator

from iaso.models import *
from plugins.wfp.common import ETL
from plugins.wfp.models import *


logger = logging.getLogger(__name__)


class ET_Under5:
    PROGRAMME_TYPE = "U5"
    ENTITY_TYPE_CODE = "ethiopia_under5"
    PAGE_SIZE = 5000

    def run(self, updated_entity_ids, entity_type_code=None, task_name="etl_eth"):
        code = entity_type_code or self.ENTITY_TYPE_CODE
        elt = ETL(code)
        account = elt.get_account()

        page_size = self.PAGE_SIZE
        paginator = Paginator(updated_entity_ids, page_size)
        pages = paginator.page_range

        logger.info(
            f"Processing {len(updated_entity_ids)} entities Child Under 5 across {paginator.num_pages} pages for {account}"
        )
        for page in pages:
            submissions, page_info = ETL._retrieve_submissions(
                code, updated_entity_ids, page_size=page_size, page_number=page
            )
            logger.info(f"Processing {len(page_info.object_list)} entities on page {page} for {account}")
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
                result = elt._process_entity(self.PROGRAMME_TYPE, entity_id, entity_subs, account, existing_entity_ids)
                if result is None:
                    skipped_count += 1
                    continue

                beneficiary, journeys, visits, steps = result
                if beneficiary is not None:
                    all_beneficiaries.append(beneficiary)
                all_journeys.extend(journeys)
                all_visits.extend(visits)
                all_steps.extend(steps)

                if entity_count % page_size == 0:
                    logger.info(f"Processed {entity_count} entities ({skipped_count} skipped)")

            logger.info(
                f"Processed {entity_count} entities total ({skipped_count} skipped) for {self.PROGRAMME_TYPE}. "
                f"Creating: {len(all_beneficiaries)} beneficiaries, "
                f"{len(all_journeys)} journeys, "
                f"{len(all_visits)} visits, "
                f"{len(all_steps)} steps \n"
            )

            task = Task(
                name=f"{task_name} for {code} on page {page}",
                account=account,
                status="QUEUED",
            )
            elt._save_all(
                all_beneficiaries,
                all_journeys,
                all_visits,
                all_steps,
                account,
                current_entity_id,
                task,
            )
