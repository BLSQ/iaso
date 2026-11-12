import logging

from collections.abc import Sequence
from typing import Optional

from iaso.tasks.mobile_app_setup.api_calls import ApiCall
from iaso.tasks.mobile_app_setup.archive import ZipArchive
from iaso.tasks.mobile_app_setup.hooks import PayloadTransformer
from iaso.tasks.mobile_app_setup.progress import ExportProgress
from iaso.utils.iaso_api_client import HttpClient, IasoClient


logger = logging.getLogger(__name__)


def export_app_setup(
    client: IasoClient,
    storage: HttpClient,
    archive: ZipArchive,
    app_id: str,
    api_calls: Sequence[ApiCall],
    progress: ExportProgress,
    access_token: str,
    payload_transformers: Sequence[PayloadTransformer] = (),
    options: Optional[dict] = None,
):
    """Mimic the API calls of the mobile app's initial sync, and writes their responses and files to the archive."""
    # Public endpoint, no auth needed
    app_info = client.get_json("/api/apps/current/", params={"app_id": app_id})
    archive.write_json("app.json", app_info)
    feature_flags = {flag["code"] for flag in app_info["feature_flags"]}
    logger.info(
        f"App {app_info['name']} ({app_info['app_id']}): needs authentication: {app_info['needs_authentication']}, "
        f"min version: {app_info.get('min_version')}, feature flags: {', '.join(sorted(feature_flags))}"
    )
    progress.app_info_done()

    if app_info["needs_authentication"]:
        client.authenticate_with_token(access_token)
    progress.authenticated()

    for call in api_calls:
        if not call.is_enabled(feature_flags):
            logger.info(f"{call.filename}: skipped, feature flag {call.required_feature_flag} missing")
            progress.call_done(call)
            continue

        progress.call_started(call)
        for page in call.fetch_pages(client, app_id):
            if call.asset_files:
                for file in call.asset_files(page.payload, app_id):
                    content = (client if file.from_api else storage).get_bytes(file.url)
                    archive.write_bytes(file.path, file.rewrite(content) if file.rewrite else content)
            for transform in payload_transformers:
                transform(call.filename, page.payload, options or {})
            archive.write_json(page.filename, page.payload)
            progress.page_done(call, page)
        progress.call_done(call)
