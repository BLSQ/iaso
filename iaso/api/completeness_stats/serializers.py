from typing import Any, List, Mapping, Optional, TypedDict, Union

import rest_framework.fields

from django.contrib.auth.models import User
from django.db.models import QuerySet
from rest_framework import serializers
from rest_framework.serializers import ModelSerializer
from typing_extensions import Annotated

from iaso.models import Form, Group, OrgUnit, OrgUnitType, Project

from ...models.microplanning import Planning
from ...models.team import Team
from ...periods import Period


class OrgUnitTypeSerializer(ModelSerializer):
    class Meta:
        model = OrgUnitType
        fields = ["id", "name", "depth"]


class FormStatDict(TypedDict):
    name: str  # name of the form. for debug
    descendants: int  # number of descendant org unit that should fill this form
    descendants_ok: int  # number of descendants org unit that have this form filled
    percent: int  # descendants_ok / descendants
    total_instances: int  # total submissions for this for on descendant and itself
    itself_target: int  # does the orgunit need to fill the form
    itself_has_instances: int  # does the orgunit have any submission for this form
    itself_instances_count: int  # how many submission for this form are on this instance


class FormStatAnnotation(TypedDict):
    # Key is a slug for a form e.g `form_12`
    form_stats: Mapping[str, FormStatDict]


OrgUnitWithFormStat = Annotated[OrgUnit, FormStatAnnotation]


class Params(TypedDict):
    org_unit_types: Optional[List[OrgUnitType]]
    parent_org_unit: Optional[OrgUnit]
    forms: QuerySet[Form]
    planning: Optional[Planning]
    period: Optional[str]  # might migrate to Period in the future
    order: List[str]
    org_unit_group: Optional[Group]
    without_submissions: bool
    org_unit_validation_status: List[str]
    teams: Optional[List[Team]]


class PrimaryKeysRelatedField(serializers.ManyRelatedField):
    """Primary key separated by , like we do often in iaso"""

    def get_value(self, dictionary: Mapping[Any, str]) -> Union[Any, List[Any]]:
        if self.field_name not in dictionary:
            return rest_framework.fields.empty
        value: str
        value = dictionary[self.field_name]
        return value.split(",")


# noinspection PyMethodMayBeStatic
class ParamSerializer(serializers.Serializer):
    """Serializer for the get params"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        request = self.context.get("request")
        # filter on what the user has access to. Guard against an unauthenticated (e.g.
        # AnonymousUser, as used by schema generation) user: filter_for_user() et al. below
        # assume a real iaso_profile.
        if request and request.user.is_authenticated:
            user = request.user
            # we could filter but since it's an additional it probably just a waste
            self.fields["org_unit_type_ids"].child_relation.queryset = OrgUnitType.objects.filter_for_user_and_app_id(
                user, None
            ).distinct()
            self.fields["org_unit_group_id"].queryset = Group.objects.filter_for_user(user)
            self.fields["parent_org_unit_id"].queryset = OrgUnit.objects.filter_for_user(user)
            # Forms to take into account: we take everything for the user's account, then filter by the form_ids if provided
            self.fields["form_id"].default = Form.objects.filter_for_user_and_app_id(user).distinct()[:5]
            self.fields["form_id"].child_relation.queryset = Form.objects.filter_for_user_and_app_id(user).distinct()
            self.fields["planning_id"].queryset = Planning.objects.filter_for_user(user)
            self.fields["team_ids"].child_relation.queryset = Team.objects.filter_for_user(user).distinct()
            self.fields["user_ids"].child_relation.queryset = User.objects.filter(
                iaso_profile__account=user.iaso_profile.account
            ).distinct()

            self.fields["project_ids"].child_relation.queryset = Project.objects.filter(
                account=user.iaso_profile.account
            ).distinct("id")

    org_unit_type_ids = PrimaryKeysRelatedField(
        child_relation=serializers.PrimaryKeyRelatedField(queryset=OrgUnitType.objects.none()),
        source="org_unit_types",
        required=False,
        help_text="Group the submissions per this org unit type",
    )
    parent_org_unit_id = serializers.PrimaryKeyRelatedField(
        queryset=OrgUnit.objects.none(),
        source="parent_org_unit",
        required=False,
        help_text="Use this as the root. If not present will take the root per users",
    )
    form_id = PrimaryKeysRelatedField(
        required=False,
        source="forms",
        help_text="Filter on these form ids (list separated by ','",
        child_relation=serializers.PrimaryKeyRelatedField(
            queryset=Form.objects.none(),
        ),
    )
    planning_id = serializers.PrimaryKeyRelatedField(
        source="planning", queryset=Planning.objects.none(), required=False, help_text="Filter on this planning"
    )
    order = serializers.CharField(default="name")  # actually a list in validated data
    period = serializers.CharField(required=False, help_text="Filter period in this instances")
    without_submissions = serializers.BooleanField(
        default=False, help_text="Only return orgunit without direct submissions"
    )
    org_unit_group_id = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.none(),
        source="org_unit_group",
        required=False,
        help_text="Filter the orgunit used for count on this group",
    )

    org_unit_validation_status = serializers.CharField(
        default="VALID",
        help_text="Filter org unit on theses validation status"
        " (both for returned orgunit and count), can specify multiple status, separated by a ','",
    )
    as_location = serializers.CharField(required=False, help_text="Filter only org units with geo locations")

    team_ids = PrimaryKeysRelatedField(
        child_relation=serializers.PrimaryKeyRelatedField(queryset=Team.objects.none()),
        source="teams",
        required=False,
        help_text="filter on teams",
    )

    project_ids = PrimaryKeysRelatedField(
        child_relation=serializers.PrimaryKeyRelatedField(queryset=Project.objects.none()),
        source="projects",
        required=False,
        help_text="filter on projects",
    )

    user_ids = PrimaryKeysRelatedField(
        child_relation=serializers.PrimaryKeyRelatedField(queryset=User.objects.none()),
        source="users",
        required=False,
        help_text="filter on users",
    )

    def validate_org_unit_validation_status(self, statuses):
        statuses = statuses.split(",")
        for status in statuses:
            # TODO: this should come from , OrgUnit.VALIDATION_STATUS_CHOICES
            if status not in (OrgUnit.VALIDATION_VALID, OrgUnit.VALIDATION_NEW, OrgUnit.VALIDATION_REJECTED):
                raise serializers.ValidationError("Invalid status")
        return statuses

    def validate_order(self, order):
        return order.split(",")

    def validate_period(self, period_value):
        try:
            Period.from_string(period_value)
        except ValueError:
            raise serializers.ValidationError("Invalid period")
        return period_value

    def validate_form_id(self, forms: Union[List[Form], QuerySet[Form]]):
        # reconvert this to a queryset, if this is a List.
        # resolve problem with duplicate Form if form is in multiple project
        # This method seems faster than using a distinct()
        return Form.objects.filter(id__in=[f.id for f in forms])
