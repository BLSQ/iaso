import logging
from datetime import datetime, timedelta
from typing import NamedTuple, List, Any, Callable, Tuple, Union, Dict, Optional

from django import forms
from django.contrib.admin.widgets import AdminDateWidget
from django.db.models.query import QuerySet
from django.forms import ModelForm
from django.http.request import HttpRequest
from django.utils.translation import ugettext as _

from hat.geo.models import Village, ZS, AS, Province
from .models import Case

logger = logging.getLogger('cases.forms.py')


class FieldChoice(NamedTuple):
    id: str
    label: str
    filter: Callable[[QuerySet, Any], QuerySet]
    choices: Optional[List[Tuple[str, str]]]


class OrderChoice(NamedTuple):
    id: str
    label: str
    asc: Callable[[QuerySet], QuerySet]
    desc: Callable[[QuerySet], QuerySet]


class ColumnChoice(NamedTuple):
    id: Union[None, str]
    label: str


class CasesFilterForm(forms.Form):
    def __init__(self,
                 locations_choices_zs,
                 locations_choices_as,
                 locations_choices_village,
                 custom_filters: Optional[List[FieldChoice]],
                 orders_choices: Optional[List[Tuple[str, str]]],
                 columns: Optional[List[ColumnChoice]],
                 restricted: List[str],
                 *args: Any, **kwargs: Any) -> None:
        super(CasesFilterForm, self).__init__(*args, **kwargs)

        select_attrs = {'class': 'select--minimised'}
        date_attrs = {'class': 'input--minimised'}
        radio_attrs = {'class': 'radio--minimised'}
        input_attrs = {'class': 'input--minimised'}

        # Specify type to make choices list concatenation work
        # none_choice: Tuple[Optional[str], str] = (None, _('None'))
        none_choice = ('', _('None'))

        ########################################################################
        # location fields
        if restricted:
            self.fields['ZS'] = forms.ChoiceField(
                choices=[none_choice] + [(l, l) for l in restricted],
                widget=forms.Select(attrs=select_attrs),
                required=False,
            )
        else:
            self.fields['ZS'] = forms.ChoiceField(
                choices=[none_choice] + [(row['id'], row['name']) for row in locations_choices_zs],
                widget=forms.Select(attrs=select_attrs),
                required=False,
            )

        self.fields['AS'] = forms.ChoiceField(
            choices=[none_choice] + [(row['id'], row['name']) for row in locations_choices_as],
            widget=forms.Select(attrs=select_attrs),
            required=False
        )

        self.fields['village'] = forms.ChoiceField(
            choices=[none_choice] + [(row['id'], row['name']) for row in locations_choices_village],
            widget=forms.Select(attrs=select_attrs),
            required=False,
        )

        ########################################################################
        # date fields
        self.fields['date_from'] = forms.DateField(
            widget=DateInput(attrs=date_attrs),
            required=False,
        )
        self.fields['date_to'] = forms.DateField(
            widget=DateInput(attrs=date_attrs),
            required=False,
        )

        ########################################################################
        # custom filters
        if custom_filters:
            for field in custom_filters:
                if field.choices:
                    self.fields[field.id] = forms.ChoiceField(
                        label=field.label,
                        choices=[none_choice] + field.choices,
                        widget=forms.Select(attrs=select_attrs),
                        required=False,
                    )
                else:
                    self.fields[field.id] = forms.CharField(
                        label=field.label,
                        widget=forms.TextInput(attrs=input_attrs),
                        required=False,
                    )

        ########################################################################
        # order
        if orders_choices:
            self.fields['order'] = forms.ChoiceField(
                choices=[none_choice] + orders_choices,
                widget=forms.Select(attrs=select_attrs),
                required=False,
            )
            self.fields['asc_desc'] = forms.ChoiceField(
                choices=[('asc', _('Ascendent')), ('desc', _('Descendent'))],
                widget=forms.RadioSelect(attrs=radio_attrs),
                required=False,
                initial='asc',
            )

        ########################################################################
        # columns
        if columns:
            self.fields['columns'] = forms.ChoiceField(
                choices=columns,
                widget=forms.CheckboxSelectMultiple(attrs=radio_attrs),
                required=False,
            )


def filter_and_create_form(
        request: HttpRequest,
        queryset: QuerySet,
        locations_filters: Dict[str, Any],
        dates_filters: Dict[str, Any],
        fields_filters: List[FieldChoice] = None,
        orders: List[OrderChoice] = None,
        columns: List[ColumnChoice] = None,
) -> Tuple[QuerySet, forms.Form]:
    ############################################################################
    # check locations fields and filters

    ############################################################################
    # check dates fields and filters

    date_from = request.GET.get('date_from', None)
    date_to = request.GET.get('date_to', None)
    if date_from and date_to:
        date_from = datetime.strptime(date_from, DATE_FORMAT)
        date_to = datetime.strptime(date_to, DATE_FORMAT) + timedelta(days=1)
        queryset = dates_filters['between'](queryset, date_from, date_to)

    elif date_from:
        date_from = datetime.strptime(date_from, DATE_FORMAT)
        queryset = dates_filters['from'](queryset, date_from)

    elif date_to:
        date_to = datetime.strptime(date_to, DATE_FORMAT) + timedelta(days=1)
        queryset = dates_filters['to'](queryset, date_to)

    ############################################################################
    # check fields

    if fields_filters:
        for field in fields_filters:
            value = request.GET.get(field.id, None)
            if value:
                queryset = field.filter(queryset, value)

    ############################################################################
    # extract locations list from queryset

    if 'all' in locations_filters:
        cc_locations_list = locations_filters['all']
    else:
        cc_locations_list = queryset

    location_choices_village = cc_locations_list.values_list('normalized_village_id', flat=True).distinct(
        'normalized_village_id').order_by('normalized_village_id')[:100]
    location_choices_as = cc_locations_list.values_list('normalized_AS_id', flat=True).distinct(
        'normalized_AS_id').order_by('normalized_AS_id')[:100]
    location_choices_zs = cc_locations_list.values_list('normalized_AS__ZS_id', flat=True).distinct(
        'normalized_AS__ZS_id').order_by('normalized_AS__ZS_id')

    from hat.geo.models import Village, ZS, AS  # had to import here for it to work, no idea why https://docs.python.org/3/faq/programming.html#what-are-the-best-practices-for-using-import-in-a-module
    location_choices_village_name = Village.objects.filter(id__in=location_choices_village).values('id', 'name').order_by('name')
    location_choices_as_name = AS.objects.filter(id__in=location_choices_as).values('id', 'name').order_by('name')
    location_choices_zs_name = ZS.objects.filter(id__in=location_choices_zs).values('id', 'name').order_by('name')

    restricted = []  # type: List[str]

    ZS = request.GET.get('ZS', None)
    AS = request.GET.get('AS', None)
    village = request.GET.get('village', None)

    if village:
        queryset = queryset.filter(normalized_village_id=village)
    elif AS:
        queryset = queryset.filter(normalized_AS_id=AS)
    elif ZS:
        queryset = queryset.filter(normalized_AS__ZS_id=ZS)

    ############################################################################
    # check order

    orders_choices = None
    if orders:
        orders_choices = [(o.id, o.label) for o in orders]
        order = request.GET.get('order', None)
        if order:
            order_choice = next(o for o in orders if o.id == order)
            if order_choice:
                asc_desc = request.GET.get('asc_desc', None)
                if asc_desc != 'desc':
                    queryset = order_choice.asc(queryset)
                else:
                    queryset = order_choice.desc(queryset)

    ############################################################################
    # create form
    form = CasesFilterForm(location_choices_zs_name,
                           location_choices_as_name,
                           location_choices_village_name,
                           fields_filters,
                           orders_choices,
                           columns,
                           restricted,
                           request.GET or None,
                           )

    return queryset, form


class CaseForm(ModelForm):
    class Meta:
        model = Case
        exclude = ('hat_id', 'source', 'document_id', 'entry_name', 'latitude', 'longitude',
                   'mobile_unit', 'device_id', 'version_number', 'normalized_village', 'confirmed_case',
                   'corrected_province', 'corrected_ZS', 'corrected_AS', 'corrected_village')

    # The first migrate on an empty DB will fail on this selection, just ignore
    try:
        PROVINCE_choices = Province.objects.order_by('name').values_list('name', 'name').distinct().__repr__()
        AS_choices = AS.objects.order_by('name').values_list("name", "name").distinct().__repr__()
        ZS_choices = ZS.objects.order_by('name').values_list('name', 'name').distinct().__repr__()
        VILLAGE_choices = Village.objects.order_by('name').values_list("name", "name").distinct().__repr__()
        TREATMENT_CENTER_choices = Case.objects.order_by('treatment_center') \
            .values_list("treatment_center", "treatment_center").distinct().__repr__()
    except:
        PROVINCE_choices = []
        AS_choices = []
        ZS_choices = []
        VILLAGE_choices = []
        TREATMENT_CENTER_choices = []

    widgets = {
        'document_date': AdminDateWidget(),
        'entry_date': AdminDateWidget(),
        'sex': forms.Select(choices=Case.SEX_CHOICES),
        'source': forms.Select(choices=Case.SOURCE_CHOICES),
        'name': forms.TextInput(),
        'lastname': forms.TextInput(),
        "prename": forms.TextInput(),
        "mothers_surname": forms.TextInput(),
        "AS": forms.Select(choices=AS_choices),
        "ZS": forms.Select(choices=ZS_choices),
        "province": forms.Select(choices=PROVINCE_choices),
        "village": forms.Select(choices=VILLAGE_choices),
        "treatment_center": forms.Select(choices=TREATMENT_CENTER_choices),
        "test_pl_result": forms.Select(choices=Case.PL_TEST_RESULT_CHOICES),
        "treatment_start_date": AdminDateWidget(),
        "treatment_end_date": AdminDateWidget(),
        "treatment_prescribed": forms.TextInput(),
        "treatment_result": forms.TextInput(),
        "test_catt_dilution": forms.TextInput(),
        "test_catt_index": forms.TextInput(),
        "test_catt_picture_filename": forms.TextInput(),
        "test_catt_session_type": forms.TextInput(),

        "test_pl_liquid": forms.TextInput(),
        "test_pl_trypanosome": forms.TextInput(),
        "test_pl_gb_mm3": forms.TextInput(),
        "test_pl_albumine": forms.TextInput(),
        "test_pl_lcr": forms.TextInput(),
        "test_pl_comments": forms.TextInput(),

        "test_followup_pg": forms.TextInput(),
        "test_followup_sf": forms.TextInput(),
        "test_followup_ge": forms.TextInput(),
        "test_followup_woo": forms.TextInput(),
        "test_followup_maect": forms.TextInput(),
        "test_followup_woo_maect": forms.TextInput(),
        "test_followup_pl": forms.TextInput(),
        "test_followup_pl_trypanosome": forms.TextInput(),
        "test_followup_pl_gb": forms.TextInput(),
        "test_followup_decision": forms.TextInput(),
    }


################################################################################
# HELPERS
################################################################################

class DateInput(forms.DateInput):
    # Django uses type="text" by default, but we want type="date"
    input_type = 'date'
