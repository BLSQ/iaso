import json
import logging
import uuid

from typing import Any, Optional, TypeVar, Union

from django.contrib.auth.models import User
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core import serializers
from django.db import models

from hat.audit.modifications import get_values_serializer


logger = logging.getLogger(__name__)


BULK_UPLOAD = "bulk_upload"
BULK_UPLOAD_MERGED_ENTITY = "bulk_upload_merged_entity"
CAMPAIGN_API = "campaign_api"
DJANGO_ADMIN = "django_admin"
ENTITY_API = "entity_api"
ENTITY_DUPLICATE_MERGE = "entity_duplicate_merge"
FORM_API = "form_api"
GPKG_IMPORT = "gpkg_import"
GROUP_SET_API = "group_set_api"
INSTANCE_API = "instance_api"
INSTANCE_API_BULK = "instance_api_bulk"
ORG_UNIT_API = "org_unit_api"
ORG_UNIT_API_BULK = "org_unit_api_bulk"
ORG_UNIT_CHANGE_REQUEST = "org_unit_change_request"
ORG_UNIT_CHANGE_REQUEST_API = "org_unit_change_request_api"
ORG_UNIT_CHANGE_REQUEST_CONFIGURATION_API = "org_unit_change_request_configuration_api"
PASSWORD_API = "password_api"
PATIENT_API = "patient_api"
PAYMENT_API = "payment_api"
PAYMENT_API_BULK = "payment_api_bulk"
PAYMENT_LOT_API = "payment_lot_api"
PROFILE_API = "profile_api"
PROFILE_API_BULK = "profile_api_bulk"
SETUP_ACCOUNT_API = "setup_account_api"


AnyModelInstance = TypeVar("AnyModelInstance", bound=models.Model)


def dict_compare(d1, d2):
    d1_keys = set(d1.keys())
    d2_keys = set(d2.keys())
    shared_keys = d1_keys.intersection(d2_keys)
    added = d2_keys - d1_keys
    removed = d1_keys - d2_keys
    modified_values = {k: {"before": d1.get(k), "after": d2.get(k)} for k in shared_keys if d1[k] != d2[k]}
    added_values = {k: {"before": None, "after": d2[k]} for k in added}
    removed_values = {k: {"before": d1[k], "after": None} for k in removed}
    return {"added": added_values, "removed": removed_values, "modified": modified_values}


def serialize_instance(instance: AnyModelInstance) -> list[dict[str, Any]]:
    """
    Django's serializer doesn't support reverse relationships.

    It means we're not able to track changes made to e.g. `org_unit.groups`.
    """
    serialized_instance = serializers.serialize("json", [instance])
    return json.loads(serialized_instance)


class IasoJsonEncoder(json.JSONEncoder):
    """This Encoder is needed for object that use UUID as their primary id
    e.g. Campaign"""

    def default(self, o):
        if isinstance(o, uuid.UUID):
            return str(o)
        return json.JSONEncoder.default(self, o)


class Modification(models.Model):
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    # This is a charField and not a number field so it can also fit uuid
    object_id = models.CharField(max_length=40, db_index=True)
    content_object = GenericForeignKey("content_type", "object_id")
    past_value = models.JSONField(encoder=IasoJsonEncoder)
    new_value = models.JSONField(encoder=IasoJsonEncoder)
    source = models.TextField()
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    # Enables to go back to the original change request when `source == ORG_UNIT_CHANGE_REQUEST`.
    org_unit_change_request = models.ForeignKey(
        "iaso.OrgUnitChangeRequest", null=True, blank=True, on_delete=models.SET_NULL
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return "%s - %s - %s - %s" % (
            self.content_type,
            self.object_id,
            self.user,
            self.created_at,
        )

    def as_dict(self):
        values_serializer = get_values_serializer(self.content_object)
        return {
            "id": self.id,
            "content_type": self.content_type.app_label,
            "object_id": self.object_id,
            "past_value": values_serializer.serialize(self.past_value),
            "new_value": values_serializer.serialize(self.new_value),
            "source": self.source,
            "user": self.user.iaso_profile.as_dict() if self.user else None,
            "created_at": self.created_at,
            "org_unit_change_request_id": self.org_unit_change_request.id if self.org_unit_change_request else None,
        }

    def as_list(self, fields):
        dict_list = {
            "id": self.id,
            "content_type": self.content_type.app_label,
            "object_id": self.object_id,
            "source": self.source,
            "user": self.user.iaso_profile.as_short_dict() if self.user else None,
            "created_at": self.created_at,
            "org_unit_change_request_id": self.org_unit_change_request.id if self.org_unit_change_request else None,
        }
        if "past_value" in fields:
            dict_list["past_value"] = self.past_value
        if "new_value" in fields:
            dict_list["new_value"] = self.new_value
        if "field_diffs" in fields:
            dict_list["field_diffs"] = self.field_diffs()

        return dict_list

    def field_diffs(self):
        past_values = self.past_value or []
        new_values = self.new_value or []
        past_value = past_values[0] if len(past_values) > 0 else {}
        new_value = new_values[0] if len(new_values) > 0 else {}
        past_fields = past_value.get("fields") or {}
        new_fields = new_value.get("fields") or {}
        return dict_compare(past_fields, new_fields)

    @staticmethod
    def make_json_schema(past_value_schema, new_value_schema):
        """Convenience method to generate json_schema when writing tests"""

        return {
            "type": "object",
            "properties": {
                "id": {"type": "number"},
                "content_type": {"type": "string"},
                "object_id": {"type": "string"},
                "source": {"type": "string"},
                "user": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "number"},
                        "first_name": {"type": ["string", "null"]},
                        "user_name": {"type": "string"},
                        "last_name": {"type": ["string", "null"]},
                        "email": {"type": ["string", "null"]},
                        "language": {"type": ["string", "null"]},
                        "user_id": {"type": "number"},
                        "phone_number": {"type": ["string", "null"]},
                        "country_code": {"type": ["string", "null"]},
                        "editable_org_unit_type_ids": {"type": "array", "items": {"type": "number"}},
                        "user_roles_editable_org_unit_type_ids": {"type": "array", "items": {"type": "number"}},
                    },
                    "required": ["id", "user_name", "user_id"],
                },
                "created_at": {"type": "string"},
                "org_unit_change_request_id": {"type": ["string", "null"]},
                "past_value": {"type": "array", "items": past_value_schema},
                "new_value": {"type": "array", "items": new_value_schema},
            },
            "required": ["id", "content_type", "object_id", "source", "user", "created_at", "past_value", "new_value"],
        }


def log_modification(
    # `v1` should be either a deepcopy or a serialized instance.
    v1: Optional[Union[AnyModelInstance, list[dict[str, Any]]]],
    v2: Optional[AnyModelInstance],
    source: Optional[str],
    user: User = None,
    org_unit_change_request_id: int = None,
) -> Modification:
    modification = Modification()
    modification.past_value = []
    modification.new_value = []
    modification.source = source
    modification.user = user

    if source == ORG_UNIT_CHANGE_REQUEST:
        modification.org_unit_change_request_id = org_unit_change_request_id

    if v1:
        # If `v1` is a list, it means it's already been serialized.
        # This avoids issues related to the `call-by-sharing` evaluation strategy of Python
        # where two instances are sharing the same m2m objects.
        if isinstance(v1, list):
            modification.object_id = v1[0]["pk"]
            modification.past_value = v1
        else:
            modification.object_id = v1.id
            modification.past_value = serialize_instance(v1)
    elif v2:
        modification.object_id = v2.id

    if v2:
        modification.content_object = v2
        modification.new_value = serialize_instance(v2)
    elif v1:
        modification.content_object = v1

    if v1 and v2:
        diffs = modification.field_diffs()
        added = diffs["added"]
        removed = diffs["removed"]
        modified = diffs["modified"]

        # Nothing to log.
        if not any([added, removed, modified]):
            logger.warning("log_modification() is empty.", extra={"modification": modification})

        # Only `updated_at` was modified.
        # This can happen in e.g. the org unit bulk update when someone updates the status to VALID
        # for all the org units but some of them are already in the VALID status.
        if not any([added, removed]) and len(modified.keys()) == 1 and "updated_at" in modified:
            logger.warning("log_modification() called with only `updated_at`.", extra={"modification": modification})

    modification.save()
    return modification
