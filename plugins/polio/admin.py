import gspread.utils  # type: ignore

from django import forms
from django.contrib import admin, messages
from django.contrib.admin import widgets
from django.db import models
from django.db.models import Count
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.utils.translation import gettext_lazy as _
from translated_fields import TranslatedFieldAdmin

from iaso.admin import IasoJSONEditorWidget
from plugins.polio.api.vaccines.supply_chain import validate_rounds_and_campaign
from plugins.polio.models.base import VaccineStockHistory
from plugins.polio.preparedness.display_utils import (
    MISSING_CAMPAIGN_LABEL,
    format_campaign_country,
    format_campaign_obr_name,
    format_round_campaign_obr_name,
    format_vaccine_stock_country,
    format_vaccine_stock_vaccine,
)

from .budget.models import BudgetProcess, BudgetStep, BudgetStepFile, BudgetStepLink, MailTemplate, WorkflowModel
from .models import (
    ROUND_DEPRECATED_VACCINE_MANAGEMENT_FIELD_NAMES,
    ROUND_DEPRECATED_VACCINE_MANAGEMENT_HELP,
    Campaign,
    CampaignGroup,
    CampaignType,
    Chronogram,
    ChronogramTask,
    ChronogramTemplateTask,
    CountryUsersGroup,
    DestructionReport,
    EarmarkedStock,
    IncidentReport,
    Notification,
    NotificationImport,
    OutgoingStockMovement,
    ReasonForDelay,
    Round,
    RoundDateHistoryEntry,
    SpreadSheetImport,
    SubActivity,
    SubActivityScope,
    URLCache,
    VaccineArrivalReport,
    VaccineAuthorization,
    VaccinePreAlert,
    VaccineRequestForm,
    VaccineStock,
    create_polio_notifications_async,
)
from .models.performance_thresholds import PerformanceThresholds


class VaccineStockAdminDisplayMixin:
    @admin.display(description="Country", ordering="vaccine_stock__country__name", empty_value=MISSING_CAMPAIGN_LABEL)
    def get_country(self, obj):
        return format_vaccine_stock_country(obj.vaccine_stock)

    @admin.display(description="Vaccine", ordering="vaccine_stock__vaccine", empty_value=MISSING_CAMPAIGN_LABEL)
    def get_vaccine(self, obj):
        return format_vaccine_stock_vaccine(obj.vaccine_stock)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("vaccine_stock__country")


class CampaignRoundVaccineStockAdminDisplayMixin(VaccineStockAdminDisplayMixin):
    def _alternate_campaign_name(self, obj):
        return ""

    @admin.display(description="Campaign (OBR)", ordering="campaign__obr_name", empty_value=MISSING_CAMPAIGN_LABEL)
    def get_campaign_obr_name(self, obj):
        return format_campaign_obr_name(
            obj.campaign if obj.campaign_id else None,
            non_obr_name=self._alternate_campaign_name(obj),
        )

    @admin.display(description="Round", ordering="round__number", empty_value=MISSING_CAMPAIGN_LABEL)
    def get_round_number(self, obj):
        if obj.round_id and obj.round.number is not None:
            return obj.round.number
        return MISSING_CAMPAIGN_LABEL

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("campaign", "round")


class RoundRelatedAdminDisplayMixin:
    """Display helpers for models with a ``round`` FK (datelogs, sub-activities, etc.)."""

    @admin.display(
        description="Campaign (OBR)",
        ordering="round__campaign__obr_name",
        empty_value=MISSING_CAMPAIGN_LABEL,
    )
    def get_campaign_obr_name(self, obj):
        return format_round_campaign_obr_name(obj.round)

    @admin.display(description="Round", ordering="round__number", empty_value=MISSING_CAMPAIGN_LABEL)
    def get_round_number(self, obj):
        if obj.round_id and obj.round.number is not None:
            return obj.round.number
        return MISSING_CAMPAIGN_LABEL

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("round__campaign")


class IntegratedCampaignsInline(admin.TabularInline):
    """Inline to show/edit campaigns that integrate into this campaign"""

    model = Campaign
    fk_name = "integrated_to"
    extra = 0
    fields = ["obr_name"]
    raw_id_fields = ("integrated_to",)
    can_delete = True
    show_change_link = True
    verbose_name_plural = "Integrated Campaigns"

    def get_queryset(self, request):
        """Optimize queryset"""
        qs = super().get_queryset(request)
        return qs.select_related("account", "initial_org_unit")

    def has_add_permission(self, request, obj=None):
        """Prevent adding new campaigns through the inline - they must be created separately and then linked"""
        return False


@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = (
        "obr_name",
        "get_country",
        "virus",
        "detection_status",
        "is_test",
        "on_hold",
        "is_planned",
        "updated_at",
    )
    list_display_links = ("obr_name",)
    search_fields = ("obr_name", "epid")
    list_filter = (
        "virus",
        "detection_status",
        "risk_assessment_status",
        "budget_status",
        "campaign_types",
        "is_test",
        "on_hold",
    )
    raw_id_fields = ("account", "country", "initial_org_unit", "integrated_to")
    readonly_fields = ("id", "created_at", "updated_at", "geojson")
    date_hierarchy = "updated_at"
    formfield_overrides = {
        models.ForeignKey: {"widget": widgets.AdminTextInputWidget},
    }
    inlines = [IntegratedCampaignsInline]

    @admin.display(description="Country", ordering="country__name", empty_value=MISSING_CAMPAIGN_LABEL)
    def get_country(self, obj):
        return format_campaign_country(obj)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("country")

    # Exclude old budget tool fields
    exclude = (
        "ra_completed_at_WFEDITABLE",
        "who_sent_budget_at_WFEDITABLE",
        "unicef_sent_budget_at_WFEDITABLE",
        "gpei_consolidated_budgets_at_WFEDITABLE",
        "submitted_to_rrt_at_WFEDITABLE",
        "feedback_sent_to_gpei_at_WFEDITABLE",
        "re_submitted_to_rrt_at_WFEDITABLE",
        "submitted_to_orpg_operations1_at_WFEDITABLE",
        "feedback_sent_to_rrt1_at_WFEDITABLE",
        "re_submitted_to_orpg_operations1_at_WFEDITABLE",
        "submitted_to_orpg_wider_at_WFEDITABLE",
        "submitted_to_orpg_operations2_at_WFEDITABLE",
        "feedback_sent_to_rrt2_at_WFEDITABLE",
        "re_submitted_to_orpg_operations2_at_WFEDITABLE",
        "submitted_for_approval_at_WFEDITABLE",
        "feedback_sent_to_orpg_operations_unicef_at_WFEDITABLE",
        "feedback_sent_to_orpg_operations_who_at_WFEDITABLE",
        "approved_by_who_at_WFEDITABLE",
        "approved_by_unicef_at_WFEDITABLE",
        "approved_at_WFEDITABLE",
        "approval_confirmed_at_WFEDITABLE",
    )

    def save_model(self, request, obj: Campaign, form, change):
        obj.update_geojson_field()
        super().save_model(request, obj, form, change)

    @admin.action(description="Force update of geojson field")
    def force_update_campaign_shape(self, request, queryset):
        c: Campaign
        for c in queryset:
            c.update_geojson_field()
            c.save()
        self.message_user(request, f"GeoJson of {queryset.count()} campaign updated")

    actions = [force_update_campaign_shape]


@admin.register(SpreadSheetImport)
class SpreadSheetImportAdmin(admin.ModelAdmin):
    list_filter = ["spread_id", "created_at"]
    list_display = ["spread_id", "title", "created_at", "url"]
    readonly_fields = ["title", "table"]
    formfield_overrides = {models.JSONField: {"widget": IasoJSONEditorWidget}}

    def title(self, obj: SpreadSheetImport):
        return obj.content["title"]

    def table(self, obj: SpreadSheetImport):
        # Write a get-method for a list of module names in the class Profile
        # return HTML string which will be display in the form
        # for sheet in self.content['sheets']:
        html = ""

        for sheet in obj.content["sheets"]:
            html += f"<details open><summary><b>{sheet['title']}</b></summary><table>"
            try:
                if not sheet["values"]:
                    html += "Empty</table></details>"
                    continue

                values = gspread.utils.fill_gaps(sheet["values"])

                html += "<tr><td></td>"
                for col_num in range(len(values[0])):
                    html += f"<td>{col_num}</td>"
                html += "</tr>"

                for row_num, row in enumerate(values):
                    html += f"<tr><td>{row_num}</td>"

                    for col in row:
                        html += f"<td>{col}</td>\n"
                    html += "</tr>"

            except Exception as e:
                print(e)
                html += f"<error>render error: {e}</error>"
                html += f"<pre>{sheet['values']}</pre>"
            html += "</table></details>"

        # print(html)
        return mark_safe(html)


@admin.register(CampaignGroup)
class CampaignGroupAdmin(admin.ModelAdmin):
    list_display = ("name", "get_campaign_count", "created_at", "updated_at")
    list_display_links = ("name",)
    search_fields = ("name", "campaigns__obr_name")
    readonly_fields = ("created_at", "updated_at")
    autocomplete_fields = ("campaigns",)

    @admin.display(description="Campaigns", ordering="_campaign_count")
    def get_campaign_count(self, obj):
        return getattr(obj, "_campaign_count", 0) or 0

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(_campaign_count=Count("campaigns", distinct=True))


@admin.register(MailTemplate)
class MailTemplateAdmin(admin.ModelAdmin):
    pass


class BudgetStepLinkAdminInline(admin.TabularInline):
    model = BudgetStepLink
    extra = 0


class BudgetStepFileAdminInline(admin.TabularInline):
    model = BudgetStepFile
    extra = 0


@admin.register(BudgetStep)
class BudgetStepAdmin(admin.ModelAdmin):
    inlines = [
        BudgetStepFileAdminInline,
        BudgetStepLinkAdminInline,
    ]
    list_display = ["campaign", "transition_key", "created_by", "created_at", "deleted_at"]


@admin.register(WorkflowModel)
class WorkflowAdmin(admin.ModelAdmin):
    formfield_overrides = {models.JSONField: {"widget": IasoJSONEditorWidget}}


@admin.register(VaccineAuthorization)
class VaccineAuthorizationsAdmin(admin.ModelAdmin):
    model = VaccineAuthorization
    raw_id_fields = ("country",)


class VaccineArrivalReportAdminInline(admin.TabularInline):
    model = VaccineArrivalReport
    extra = 0


class VaccinePreAlertAdminInline(admin.TabularInline):
    model = VaccinePreAlert
    extra = 0


class VaccineRequestAdminForm(forms.ModelForm):
    class Meta:
        model = VaccineRequestForm
        fields = "__all__"

    def clean(self):
        cleaned_data = super().clean()
        return validate_rounds_and_campaign(cleaned_data)


@admin.register(VaccineRequestForm)
class VaccineRequestFormAdmin(admin.ModelAdmin):
    model = VaccineRequestForm
    form = VaccineRequestAdminForm
    inlines = [VaccinePreAlertAdminInline, VaccineArrivalReportAdminInline]
    readonly_fields = ["created_at", "updated_at"]
    list_display = (
        "get_campaign_obr_name",
        "get_country",
        "vaccine_type",
        "vrf_type",
        "get_pre_alert_count",
        "get_arrival_report_count",
        "created_at",
    )
    list_display_links = ("get_campaign_obr_name",)
    search_fields = ("campaign__obr_name", "vaccine_type")
    list_filter = ("vrf_type", "vaccine_type")
    raw_id_fields = ("campaign",)

    @admin.display(description="Campaign (OBR)", ordering="campaign__obr_name", empty_value=MISSING_CAMPAIGN_LABEL)
    def get_campaign_obr_name(self, obj):
        return format_campaign_obr_name(obj.campaign if obj.campaign_id else None)

    @admin.display(description="Country", ordering="campaign__country__name", empty_value=MISSING_CAMPAIGN_LABEL)
    def get_country(self, obj):
        return format_campaign_country(obj.campaign if obj.campaign_id else None)

    @admin.display(description="Pre-alerts")
    def get_pre_alert_count(self, obj):
        return getattr(obj, "_pre_alert_count", 0) or 0

    @admin.display(description="Arrival reports")
    def get_arrival_report_count(self, obj):
        return getattr(obj, "_arrival_report_count", 0) or 0

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related("campaign", "campaign__country")
            .annotate(
                _pre_alert_count=Count("vaccineprealert", distinct=True),
                _arrival_report_count=Count("vaccinearrivalreport", distinct=True),
            )
        )

    def save_related(self, request, form, formsets, change):
        for formset in formsets:
            if not formset.is_valid():
                print(f"Formset errors: {formset.errors}")
            else:
                formset.save()


@admin.register(VaccineStock)
class VaccineStockAdmin(admin.ModelAdmin):
    model = VaccineStock
    raw_id_fields = ("country",)
    list_display = ["country", "vaccine"]


@admin.register(OutgoingStockMovement)
class OutgoingStockMovementAdmin(CampaignRoundVaccineStockAdminDisplayMixin, admin.ModelAdmin):
    list_display = (
        "id",
        "get_campaign_obr_name",
        "get_round_number",
        "get_country",
        "get_vaccine",
        "status",
        "report_date",
        "created_at",
    )
    list_display_links = ("id", "get_campaign_obr_name")
    search_fields = (
        "campaign__obr_name",
        "non_obr_name",
        "round__number",
        "vaccine_stock__country__name",
        "vaccine_stock__vaccine",
    )
    list_filter = ("status",)
    autocomplete_fields = ("round",)
    raw_id_fields = ("campaign", "vaccine_stock")
    readonly_fields = ("created_at", "updated_at")
    date_hierarchy = "report_date"

    def _alternate_campaign_name(self, obj):
        return obj.non_obr_name


@admin.register(DestructionReport)
class DestructionReportAdmin(VaccineStockAdminDisplayMixin, admin.ModelAdmin):
    list_display = (
        "id",
        "get_country",
        "get_vaccine",
        "destruction_report_date",
        "unusable_vials_destroyed",
        "rrt_destruction_report_reception_date",
        "created_at",
    )
    list_display_links = ("id",)
    search_fields = ("vaccine_stock__country__name", "vaccine_stock__vaccine", "action")
    raw_id_fields = ("vaccine_stock",)
    readonly_fields = ("created_at", "updated_at")
    date_hierarchy = "destruction_report_date"


@admin.register(IncidentReport)
class IncidentReportAdmin(VaccineStockAdminDisplayMixin, admin.ModelAdmin):
    list_display = (
        "id",
        "get_country",
        "get_vaccine",
        "stock_correction",
        "title",
        "date_of_incident_report",
        "created_at",
    )
    list_display_links = ("id", "title")
    search_fields = ("vaccine_stock__country__name", "vaccine_stock__vaccine", "title")
    list_filter = ("stock_correction",)
    raw_id_fields = ("vaccine_stock",)
    readonly_fields = ("created_at", "updated_at")
    date_hierarchy = "date_of_incident_report"


@admin.register(EarmarkedStock)
class EarmarkedStockAdmin(CampaignRoundVaccineStockAdminDisplayMixin, admin.ModelAdmin):
    list_display = (
        "id",
        "get_campaign_obr_name",
        "get_round_number",
        "get_country",
        "get_vaccine",
        "earmarked_stock_type",
        "vials_earmarked",
        "created_at",
    )
    list_display_links = ("id", "get_campaign_obr_name")
    search_fields = (
        "campaign__obr_name",
        "temporary_campaign_name",
        "round__number",
        "vaccine_stock__country__name",
        "vaccine_stock__vaccine",
    )
    list_filter = ("earmarked_stock_type",)
    autocomplete_fields = ("round",)
    raw_id_fields = ("campaign", "vaccine_stock", "form_a")
    readonly_fields = ("created_at", "updated_at")
    date_hierarchy = "created_at"

    def _alternate_campaign_name(self, obj):
        return obj.temporary_campaign_name


_ROUND_EVALUATION_FIELDS = (
    "mop_up_started_at",
    "mop_up_ended_at",
    "im_started_at",
    "im_ended_at",
    "lqas_started_at",
    "lqas_ended_at",
    "im_percentage_children_missed_in_household",
    "im_percentage_children_missed_out_household",
    "im_percentage_children_missed_in_plus_out_household",
    "awareness_of_campaign_planning",
    "main_awareness_problem",
    "lqas_district_passing",
    "lqas_district_failing",
)


@admin.register(Round)
class RoundAdmin(admin.ModelAdmin):
    list_display = ("id", "get_obr_name", "number", "started_at", "ended_at", "on_hold")
    list_display_links = ("get_obr_name", "number")
    list_filter = ("campaign", "on_hold")
    search_fields = ("campaign__obr_name", "number")
    ordering = ("campaign__obr_name", "number")
    raw_id_fields = ("campaign", "budget_process")
    readonly_fields = ("id",) + ROUND_DEPRECATED_VACCINE_MANAGEMENT_FIELD_NAMES
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "campaign",
                    "number",
                    "started_at",
                    "ended_at",
                    "on_hold",
                    "is_planned",
                    "budget_process",
                    "age_min",
                    "age_max",
                    "age_type",
                    "target_population",
                    "percentage_covered_target_population",
                    "doses_requested",
                    "cost",
                ),
            },
        ),
        (_("Evaluation (LQAS/IM)"), {"classes": ("collapse",), "fields": _ROUND_EVALUATION_FIELDS}),
        (
            _("Preparedness"),
            {"classes": ("collapse",), "fields": ("preparedness_spreadsheet_url", "preparedness_sync_status")},
        ),
        (
            _("Deprecated – round-level vaccine management"),
            {
                "classes": ("collapse",),
                "description": ROUND_DEPRECATED_VACCINE_MANAGEMENT_HELP,
                "fields": ROUND_DEPRECATED_VACCINE_MANAGEMENT_FIELD_NAMES,
            },
        ),
    )

    @admin.display(
        description="Campaign (OBR)",
        ordering="campaign__obr_name",
        empty_value=MISSING_CAMPAIGN_LABEL,
    )
    def get_obr_name(self, obj):
        return format_round_campaign_obr_name(obj)

    def get_search_results(self, request, queryset, search_term):
        queryset, use_distinct = super().get_search_results(request, queryset, search_term)
        return queryset.select_related("campaign"), use_distinct

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("campaign")


@admin.register(ReasonForDelay)
class ReasonForDelayAdmin(admin.ModelAdmin):
    search_fields = ("name", "key_name")
    list_display = ("name", "key_name", "account")
    list_filter = ("account",)
    raw_id_fields = ("account",)


@admin.register(NotificationImport)
class NotificationImportAdmin(admin.ModelAdmin):
    @admin.action(description="Create notifications")
    def create_notifications(self, request, queryset) -> None:
        """
        Quick and easy way to test `create_polio_notifications_async()`.
        """
        for notification_import in queryset.filter(status=NotificationImport.Status.NEW):
            create_polio_notifications_async(pk=notification_import.pk, user=request.user)
        messages.success(
            request,
            "You've been redirected to the notifications list. "
            "Import of notifications has been scheduled and will start soon. "
            "Results will appear gradually below. "
            "Please refresh in a few seconds.",
        )
        return HttpResponseRedirect(reverse("admin:polio_notification_changelist"))

    actions = (create_notifications,)
    formfield_overrides = {models.JSONField: {"widget": IasoJSONEditorWidget}}
    list_display = ("pk", "file", "status", "created_by", "account")
    list_filter = ("status",)
    raw_id_fields = ("account", "created_by")


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        "epid_number",
        "get_org_unit_name",
        "site_name",
        "vdpv_category",
        "source",
        "date_of_onset",
    )
    list_filter = ("vdpv_category", "source")
    raw_id_fields = ("account", "org_unit", "created_by", "updated_by", "import_source")
    read_only_fields = ("data_source",)

    @admin.display(description="Org Unit name")
    def get_org_unit_name(self, obj):
        if obj.org_unit:
            return obj.org_unit.name
        return None

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("org_unit")


@admin.register(VaccineStockHistory)
class VaccineStockHistoryAdmin(admin.ModelAdmin):
    list_display = ("get_campaign_name", "get_round_number", "get_vaccine_name", "get_country")
    autocomplete_fields = ("round",)
    # list_filter = ("get_country", "get_vaccine_name","get_campaign_name")

    @admin.display(description="Campaign name", empty_value=MISSING_CAMPAIGN_LABEL)
    def get_campaign_name(self, obj):
        return format_round_campaign_obr_name(obj.round)

    @admin.display(description="Round number", ordering="round__number", empty_value=MISSING_CAMPAIGN_LABEL)
    def get_round_number(self, obj):
        if obj.round_id and obj.round.number is not None:
            return obj.round.number
        return MISSING_CAMPAIGN_LABEL

    @admin.display(description="Vaccine", ordering="vaccine_stock__vaccine", empty_value=MISSING_CAMPAIGN_LABEL)
    def get_vaccine_name(self, obj):
        return format_vaccine_stock_vaccine(obj.vaccine_stock)

    @admin.display(description="Country", ordering="vaccine_stock__country__name", empty_value=MISSING_CAMPAIGN_LABEL)
    def get_country(self, obj):
        return format_vaccine_stock_country(obj.vaccine_stock)

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related(
                "round__campaign",
                "vaccine_stock",
                "vaccine_stock__country",
            )
        )


class RoundAdminInline(admin.TabularInline):
    model = Round
    extra = 0
    show_change_link = True
    can_delete = False
    fields = ("get_obr_name", "number", "started_at", "ended_at", "on_hold")
    readonly_fields = fields

    @admin.display(description="Campaign (OBR)", empty_value=MISSING_CAMPAIGN_LABEL)
    def get_obr_name(self, obj):
        return format_round_campaign_obr_name(obj)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("campaign")


class BudgetStepAdminInline(admin.TabularInline):
    model = BudgetStep
    extra = 0
    show_change_link = True
    can_delete = False
    fields = ("id", "created_at", "transition_key", "created_by")
    readonly_fields = ("id", "created_at", "transition_key", "created_by")


@admin.register(BudgetProcess)
class BudgetProcessAdmin(admin.ModelAdmin):
    raw_id_fields = ("created_by",)
    inlines = [RoundAdminInline, BudgetStepAdminInline]


class SubActivityScopeInline(admin.StackedInline):
    model = SubActivityScope
    extra = 0
    show_change_link = True
    fields = ("id", "group", "vaccine")
    raw_id_fields = ("group",)


@admin.register(SubActivity)
class SubActivityAdmin(RoundRelatedAdminDisplayMixin, admin.ModelAdmin):
    list_display = (
        "name",
        "get_campaign_obr_name",
        "get_round_number",
        "start_date",
        "end_date",
    )
    list_display_links = ("name",)
    search_fields = ("name", "round__campaign__obr_name", "round__number")
    fields = ("name", "start_date", "end_date", "round")
    autocomplete_fields = ("round",)
    inlines = [SubActivityScopeInline]

    def save_related(self, request, form, formsets, change):
        for formset in formsets:
            if not formset.is_valid():
                print(f"Formset errors: {formset.errors}")
            else:
                if formset.extra_forms:
                    for fo in formset.extra_forms:
                        if fo.is_valid():
                            fo.save()
                        else:
                            print(f"Form errors: {fo.errors}")
                formset.save()


class ChronogramTaskAdminInline(admin.StackedInline):
    model = ChronogramTask
    extra = 0
    raw_id_fields = ("created_by", "updated_by")
    readonly_fields = (
        "created_at",
        "created_by",
        "deleted_at",
        "updated_at",
        "updated_by",
    )

    def get_queryset(self, request):
        return super().get_queryset(request).valid().select_related("chronogram__round", "created_by", "updated_by")


@admin.register(Chronogram)
class ChronogramAdmin(TranslatedFieldAdmin, admin.ModelAdmin):
    date_hierarchy = "created_at"
    list_display = ("pk", "obr_name", "created_at")
    list_display_links = ("pk", "obr_name")
    inlines = [ChronogramTaskAdminInline]
    autocomplete_fields = ("round",)
    raw_id_fields = ("created_by", "updated_by")
    readonly_fields = (
        "created_at",
        "created_by",
        "deleted_at",
        "updated_at",
        "updated_by",
    )
    search_fields = ("pk", "round__campaign__obr_name")

    @admin.display(
        description="Campaign (OBR)",
        ordering="round__campaign__obr_name",
        empty_value=MISSING_CAMPAIGN_LABEL,
    )
    def obr_name(self, obj):
        return format_round_campaign_obr_name(obj.round)

    def get_queryset(self, request):
        return super().get_queryset(request).valid().select_related("round__campaign", "created_by", "updated_by")

    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.created_by = request.user
        else:
            obj.updated_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(ChronogramTemplateTask)
class ChronogramTemplateTaskAdmin(TranslatedFieldAdmin, admin.ModelAdmin):
    date_hierarchy = "created_at"
    list_display = ("pk", "start_offset_in_days", "description", "created_at")
    list_display_links = ("pk", "start_offset_in_days", "description")
    list_filter = ("account__name",)
    raw_id_fields = ("account", "created_by", "updated_by")
    readonly_fields = (
        "created_at",
        "created_by",
        "deleted_at",
        "updated_at",
        "updated_by",
    )
    search_fields = ("pk", "account__name")

    def get_queryset(self, request):
        return super().get_queryset(request).valid().select_related("account", "created_by", "updated_by")

    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.created_by = request.user
        else:
            obj.updated_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(PerformanceThresholds)
class PerformanceThresholdsAdmin(admin.ModelAdmin):
    list_display = ("indicator", "account", "updated_at", "deleted_at")
    list_filter = ("account",)
    search_fields = ("indicator",)
    readonly_fields = ("created_at", "updated_at")
    raw_id_fields = ("account",)
    formfield_overrides = {
        models.JSONField: {"widget": IasoJSONEditorWidget},
    }

    def get_queryset(self, request):
        return PerformanceThresholds.objects_include_deleted.all()


@admin.register(RoundDateHistoryEntry)
class RoundDateHistoryEntryAdmin(RoundRelatedAdminDisplayMixin, admin.ModelAdmin):
    list_display = (
        "id",
        "get_campaign_obr_name",
        "get_round_number",
        "started_at",
        "ended_at",
        "previous_started_at",
        "previous_ended_at",
        "get_reason_for_delay",
        "created_at",
        "get_modified_by",
    )
    list_display_links = ("id", "get_campaign_obr_name")
    search_fields = ("round__campaign__obr_name", "round__number", "reason_for_delay__name")
    list_filter = ("reason_for_delay__key_name",)
    autocomplete_fields = ("round", "reason_for_delay")
    raw_id_fields = ("modified_by",)
    readonly_fields = (
        "previous_started_at",
        "previous_ended_at",
        "created_at",
    )
    date_hierarchy = "created_at"

    @admin.display(
        description="Reason for delay", ordering="reason_for_delay__name", empty_value=MISSING_CAMPAIGN_LABEL
    )
    def get_reason_for_delay(self, obj):
        if obj.reason_for_delay_id:
            return obj.reason_for_delay.name
        return MISSING_CAMPAIGN_LABEL

    @admin.display(description="Modified by", ordering="modified_by__username", empty_value=MISSING_CAMPAIGN_LABEL)
    def get_modified_by(self, obj):
        if obj.modified_by_id:
            return obj.modified_by.get_username()
        return MISSING_CAMPAIGN_LABEL

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("reason_for_delay", "modified_by")


admin.site.register(CountryUsersGroup)
admin.site.register(URLCache)
admin.site.register(CampaignType)
