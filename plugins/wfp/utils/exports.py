"""Beneficiary exports of the dashboard page, built in the request and downloaded right away."""

import tempfile

from django.utils import timezone

from iaso.exports.cleaning_file_response import CleaningFileResponse

from .coda_export import build_xlsx
from .eligible_export import build_eligible_xlsx
from .raw_export import build_raw_xlsx


KIND_CODA = "coda"
KIND_RAW = "raw"
KIND_ELIGIBLE = "eligible"
BUILDERS = {
    KIND_CODA: (build_xlsx, "coda-2-export"),
    KIND_RAW: (build_raw_xlsx, "wfp-raw-data"),
    KIND_ELIGIBLE: (build_eligible_xlsx, "eligible-beneficiaries"),
}


def export_response(user, kind: str, beneficiaries, org_units=None, **options) -> CleaningFileResponse:
    """The xlsx file of `beneficiaries`, with what `user` may see (PII fields included or not).

    With an org unit scope (an org unit group, or users restricted to some org units), only the visits made in these
    org units are exported. `options` are passed to the builder of the export (e.g. the period of the eligible
    beneficiaries). The temporary file is deleted once sent.
    """
    build, prefix = BUILDERS[kind]
    tmp = tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False)
    tmp.close()
    build(beneficiaries, user, tmp.name, org_units, **options)
    filename = f"{prefix}-{timezone.now():%Y-%m-%d-%H-%M}.xlsx"
    return CleaningFileResponse(tmp.name, as_attachment=True, filename=filename)
