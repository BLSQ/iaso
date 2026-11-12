import logging

from collections.abc import Collection, Iterator
from dataclasses import dataclass, field
from typing import Any, Callable, Optional

from iaso.models import FeatureFlag
from iaso.tasks.mobile_app_setup.assets import AssetFile, form_attachment_files, form_version_files, report_files
from iaso.utils.iaso_api_client import IasoClient


logger = logging.getLogger(__name__)


@dataclass
class Page:
    """The response of an API call, saved in the zip as `filename`."""

    filename: str
    payload: Any
    # 1-based page number, None when the call isn't paginated.
    number: Optional[int] = None
    total_pages: int = 1


@dataclass(frozen=True)
class ApiCall:
    """A call that reproduces what the mobile app does when syncing data on initial setup."""

    path: str
    # Name of the file(s) in the zip: `<filename>.json`, or `<filename>-<page>.json` when paginated.
    filename: str
    default_params: dict = field(default_factory=dict)
    # The call is skipped when the app doesn't have this feature flag.
    required_feature_flag: Optional[str] = None
    paginated: bool = False
    # The `limit` sent to a paginated endpoint (the server's default otherwise).
    page_size: Optional[int] = None
    # The share of the task's progress bar for this call, spread over its pages.
    sub_steps: int = 1
    # asset_files(payload, app_id): callable that rewrites the URLs of the files in the response
    asset_files: Optional[Callable[[Any, str], list[AssetFile]]] = None

    def is_enabled(self, feature_flags: Collection[str]) -> bool:
        return self.required_feature_flag is None or self.required_feature_flag in feature_flags

    def fetch_pages(self, client: IasoClient, app_id: str) -> Iterator[Page]:
        """Perform the api call and retrieve a single or multiple pages."""
        params = {**self.default_params, "app_id": app_id}

        if not self.paginated:
            yield Page(filename=f"{self.filename}.json", payload=client.get_json(self.path, params))
            return

        number = 1
        while True:
            page_params = {**params, "page": number}
            if self.page_size:
                page_params["limit"] = self.page_size
            payload = client.get_json(self.path, page_params)

            is_dict = isinstance(payload, dict)
            if is_dict:
                logger.info(f"\tTotal count: {payload.get('count')}, total pages: {payload.get('pages')}")
            yield Page(
                filename=f"{self.filename}-{number}.json",
                payload=payload,
                number=number,
                total_pages=(is_dict and payload.get("pages")) or 1,
            )

            if not (is_dict and payload.get("has_next", False)):
                return
            number += 1


# API calls in the order the export makes them.
API_CALLS = (
    ApiCall(path="/api/orgunittypes/", filename="orgunittypes"),
    ApiCall(path="/api/mobile/groups/", filename="groups", default_params={"showDeleted": "true"}),
    ApiCall(path="/api/mobile/group_sets/", filename="groupsets", default_params={"showDeleted": "true"}),
    ApiCall(
        path="/api/mobile/forms/",
        filename="forms",
        default_params={
            "fields": "id,name,form_id,org_unit_types,period_type,single_per_period,periods_before_allowed,periods_after_allowed,latest_form_version,label_keys,possible_fields,predefined_filters,has_attachments,created_at,updated_at,reference_form_of_org_unit_types"
        },
    ),
    ApiCall(
        path="/api/formversions/",
        filename="formversions",
        default_params={
            "fields": "id,version_id,form_id,form_name,full_name,file,mapped,start_period,end_period,mapping_versions,descriptor,created_at,updated_at"
        },
        asset_files=form_version_files,
    ),
    ApiCall(path="/api/formattachments/", filename="formattachments", asset_files=form_attachment_files),
    ApiCall(
        path="/api/mobile/orgunits/changes/",
        filename="orgunitchanges",
        required_feature_flag=FeatureFlag.MOBILE_ORG_UNIT_REGISTRY,
    ),
    ApiCall(path="/api/mobile/plannings/", filename="plannings", required_feature_flag=FeatureFlag.PLANNING),
    ApiCall(
        path="/api/mobile/storage/passwords/", filename="storage-passwords", required_feature_flag=FeatureFlag.ENTITY
    ),
    ApiCall(
        path="/api/mobile/storage/blacklisted/",
        filename="storage-blacklisted",
        required_feature_flag=FeatureFlag.ENTITY,
    ),
    ApiCall(
        path="/api/mobile/entitytypes/",
        filename="entitytypes",
        required_feature_flag=FeatureFlag.ENTITY,
        paginated=True,
    ),
    ApiCall(
        path="/api/mobile/reports/",
        filename="reports",
        required_feature_flag=FeatureFlag.REPORTS,
        asset_files=report_files,
    ),
    ApiCall(path="/api/mobile/workflows/", filename="workflows", required_feature_flag=FeatureFlag.ENTITY),
    ApiCall(
        path="/api/mobile/orgunits/",
        filename="orgunits",
        default_params={"shapes": "0"},
        paginated=True,
        page_size=5000,
        sub_steps=20,
    ),
    ApiCall(
        path="/api/mobile/entities/",
        filename="entities",
        required_feature_flag=FeatureFlag.ENTITY,
        paginated=True,
        sub_steps=50,
    ),
    ApiCall(
        path="/api/mobile/entities/deleted/",
        filename="deletedentities",
        required_feature_flag=FeatureFlag.ENTITY,
        paginated=True,
    ),
)
