"""Filtering of personal data (PII) in submissions.

A form lists the questions that do NOT contain personal data in `Form.non_pii_fields` (a whitelist). Users without
the `iaso_submissions_pii` permission only see those questions. Forms where `non_pii_fields` is null have no PII
configuration and are not filtered, so that existing forms keep working unchanged.
"""

import re
import typing
import unicodedata

from django.contrib.auth.models import AnonymousUser, User

from iaso.permissions.core_permissions import CORE_SUBMISSIONS_PII_PERMISSION


# Technical keys added by ODK / IASO that never contain personal data. `meta/instanceName` is deliberately not
# listed: it is often computed from names.
TECHNICAL_KEYS = frozenset({"_version", "instanceID", "deprecatedID", "meta"})
# An answer that looks like an attachment file name (photo, audio, document...)
FILE_NAME_RE = re.compile(r"\.[A-Za-z][A-Za-z0-9]{1,4}$")


def user_can_view_pii(user: typing.Optional[typing.Union[User, AnonymousUser]]) -> bool:
    return bool(user and user.is_authenticated and user.has_perm(CORE_SUBMISSIONS_PII_PERMISSION.full_name()))


def get_allowed_fields(form, user) -> typing.Optional[typing.FrozenSet[str]]:
    """Return the allowed question names when the form must be filtered for this user, None otherwise."""
    if form is None or form.non_pii_fields is None or user_can_view_pii(user):
        return None
    return frozenset(name.lower() for name in form.non_pii_fields) | {key.lower() for key in TECHNICAL_KEYS}


def filter_pii(data: typing.Any, allowed: typing.FrozenSet[str]) -> typing.Any:
    """Keep only the whitelisted questions of a (flat) submission JSON.

    Groups (dicts) and repeat groups (lists of dicts) are kept with their whitelisted children only, and dropped
    when nothing is left in them. Question names are compared case insensitively, like in the database.
    """
    if isinstance(data, dict):
        result = {}
        for key, value in data.items():
            if isinstance(value, (dict, list)) and not _is_list_of_values(value):
                filtered = filter_pii(value, allowed)
                if filtered:
                    result[key] = filtered
            elif str(key).lower() in allowed:
                result[key] = value
        return result
    if isinstance(data, list):
        return [item for item in (filter_pii(item, allowed) for item in data) if item]
    return data


def _is_list_of_values(value) -> bool:
    return isinstance(value, list) and all(not isinstance(item, (dict, list)) for item in value)


def filter_submission_json(json: typing.Optional[dict], form, user) -> typing.Optional[dict]:
    """Filter a submission JSON for the given user, according to the PII configuration of its form."""
    allowed = get_allowed_fields(form, user)
    if allowed is None or json is None:
        return json
    return filter_pii(json, allowed)


def _slugify_value(value: str) -> str:
    """Same transformation as `slugifyValue` in the frontend, used to match attachments to their question."""
    decomposed = unicodedata.normalize("NFD", value)
    without_accents = "".join(c for c in decomposed if not unicodedata.combining(c))
    return re.sub(r"\s+", "_", re.sub(r"[(),]", "", without_accents))


def filter_submission_files(files: typing.List[typing.Optional[str]], filtered_json: typing.Optional[dict]):
    """Keep only the attachments referenced by a question that remained after filtering (e.g. a whitelisted photo).

    Attachments are matched like in the frontend: the stored file name contains the (slugified) answer.
    """
    referenced = set()

    def collect(value):
        if isinstance(value, dict):
            for item in value.values():
                collect(item)
        elif isinstance(value, list):
            for item in value:
                collect(item)
        elif isinstance(value, str) and FILE_NAME_RE.search(value):
            slug = _slugify_value(value)
            referenced.update({slug, slug.replace(".jpg", ".webp")})

    collect(filtered_json or {})
    kept = []
    for url in files:
        if not url:
            continue
        file_name = url.split("?")[0].rsplit("/", 1)[-1]
        if any(value in file_name for value in referenced):
            kept.append(url)
    return kept


def is_field_allowed(name: str, allowed: typing.Optional[typing.FrozenSet[str]]) -> bool:
    """Whether a question can be shown, `allowed` being the result of `get_allowed_fields`."""
    return allowed is None or str(name).lower() in allowed


def filter_instance_payload(payload: dict, form, user) -> dict:
    """Filter a serialized submission (`Instance.as_dict()` / `as_full_model()` output) in place.

    Besides the answers (`file_content`), the link to the raw XML file (`file_url`) is removed since it contains
    all the answers, and only the attachments of the remaining questions are kept (`files`).
    """
    allowed = get_allowed_fields(form, user)
    if allowed is None or not isinstance(payload, dict):
        return payload
    if payload.get("file_content") is not None:
        payload["file_content"] = filter_pii(payload["file_content"], allowed)
    if "file_url" in payload:
        payload["file_url"] = None
    if payload.get("files"):
        payload["files"] = filter_submission_files(payload["files"], payload.get("file_content"))
    return payload


def filter_entity_payload(payload: dict, entity, user) -> dict:
    """Filter the attributes (reference form submission) of a serialized entity in place."""
    if not isinstance(payload, dict) or entity is None or entity.attributes is None:
        return payload
    attributes = payload.get("attributes")
    if isinstance(attributes, dict):
        filter_instance_payload(attributes, entity.attributes.form, user)
    return payload


def filter_serialized_instance_values(values, form, user):
    """Filter audit log snapshots of a submission (`Modification.past_value` / `new_value`).

    These are Django serializations (`[{"model": "iaso.instance", "fields": {"json": ..., "file": ...}}]`), the
    answers are filtered and the raw XML file is removed, like for the API payloads.
    """
    allowed = get_allowed_fields(form, user)
    if allowed is None or not values:
        return values
    filtered = []
    for value in values:
        fields = dict(value.get("fields") or {})
        if fields.get("json") is not None:
            fields["json"] = filter_pii(fields["json"], allowed)
        if "file" in fields:
            fields["file"] = None
        filtered.append({**value, "fields": fields})
    return filtered


# ---------------------------------------------------------------------------
# Queries: filtering, searching or sorting on hidden questions would reveal their values
# ---------------------------------------------------------------------------


def jsonlogic_vars(logic) -> typing.Set[str]:
    """Names of the questions used in a JsonLogic expression (`{"var": "name"}`)."""
    names = set()
    if isinstance(logic, dict):
        for operator, operand in logic.items():
            if operator == "var":
                name = operand[0] if isinstance(operand, list) and operand else operand
                if isinstance(name, str):
                    names.add(name)
            else:
                names |= jsonlogic_vars(operand)
    elif isinstance(logic, list):
        for item in logic:
            names |= jsonlogic_vars(item)
    return names


def restricted_forms_for_user(user, form_ids=None) -> list:
    """Forms of the user's account whose PII is hidden from this user (optionally limited to `form_ids`)."""
    from iaso.models import Form

    if user_can_view_pii(user) or not hasattr(user, "iaso_profile"):
        return []
    forms = Form.objects.filter(non_pii_fields__isnull=False, projects__account=user.iaso_profile.account)
    if form_ids:
        forms = forms.filter(id__in=form_ids)
    return list(forms.distinct().only("id", "name", "non_pii_fields"))


def _is_name_allowed(name: str, allowed) -> bool:
    # JsonLogic and ordering may add a type suffix to the question name (e.g. `age__int__`)
    return is_field_allowed(name, allowed) or is_field_allowed(name.split("__")[0], allowed)


def ensure_fields_allowed(names: typing.Iterable[str], forms: list, user) -> None:
    """Refuse a query using questions that are hidden from the user in one of `forms`."""
    from rest_framework.exceptions import PermissionDenied

    for form in forms:
        allowed = get_allowed_fields(form, user)
        hidden = sorted(name for name in names if not _is_name_allowed(name, allowed))
        if hidden:
            raise PermissionDenied(
                f"You don't have the permission to query the personal data of form '{form.name}': {', '.join(hidden)}"
            )


def is_field_allowed_in_forms(name: str, forms: list, user) -> bool:
    return all(_is_name_allowed(name, get_allowed_fields(form, user)) for form in forms)
