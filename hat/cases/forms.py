from typing import NamedTuple, List, Any, Callable, Tuple, Union, Dict, Optional
from datetime import datetime, timedelta
from django import forms
from django.utils.translation import ugettext as _
from django.db.models.query import QuerySet
from django.http.request import HttpRequest

DATE_FORMAT = '%Y-%m-%d'


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
                 locations_choices: List[List[str]],
                 custom_filters: Optional[List[FieldChoice]],
                 orders_choices: Optional[List[Tuple[str, str]]],
                 columns: Optional[List[ColumnChoice]],
                 restricted: Dict[str, Any],
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

        if 'ZS' not in restricted:
            self.fields['ZS'] = forms.ChoiceField(
                choices=[none_choice] + [(l, l) for l in locations_choices[0]],
                widget=forms.Select(attrs=select_attrs),
                required=False,
            )

        if len(locations_choices) > 1:
            self.fields['AS'] = forms.ChoiceField(
                choices=[none_choice] + [(l, l) for l in locations_choices[1]],
                widget=forms.Select(attrs=select_attrs),
                required=False
            )

        if len(locations_choices) > 2:
            self.fields['village'] = forms.ChoiceField(
                choices=[none_choice] + [(l, l) for l in locations_choices[2]],
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
    fields_filters: List[FieldChoice]=None,
    orders: List[OrderChoice]=None,
    columns: List[ColumnChoice]=None,
) -> Tuple[QuerySet, forms.Form]:

    ############################################################################
    # check locations fields and filters

    # extract locations list from queryset
    if 'all' in locations_filters:
        locations_list = locations_filters['all']
    else:
        locations_list = queryset
    locations_list = locations_list \
        .values('ZS', 'AS', 'village') \
        .order_by('ZS', 'AS', 'village') \
        .distinct()

    locations_choices = [locations_list.order_by('ZS').values_list('ZS', flat=True).distinct()]

    restricted = {}
    restrict_to_zs = request.user.profile.restrict_to_zs
    if restrict_to_zs:
        restricted['ZS'] = restrict_to_zs
        ZS = restrict_to_zs
    else:
        ZS = request.GET.get('ZS', None)

    AS = None
    village = None
    if ZS:
        queryset = locations_filters['ZS'](queryset, ZS)
        ASs = locations_list \
            .filter(ZS=ZS) \
            .order_by('AS') \
            .values_list('AS', flat=True) \
            .distinct()
        locations_choices.append(ASs)

        AS = request.GET.get('AS', None)
        if AS and AS in ASs:
            queryset = locations_filters['AS'](queryset, AS)
            villages = locations_list \
                .filter(ZS=ZS, AS=AS) \
                .order_by('village') \
                .values_list('village', flat=True) \
                .distinct()
            locations_choices.append(villages)

            village = request.GET.get('village', None)
            if village and village in villages:
                queryset = locations_filters['village'](queryset, village)

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

    form = CasesFilterForm(locations_choices,
                           fields_filters,
                           orders_choices,
                           columns,
                           restricted,
                           request.GET or None,
                           )

    return queryset, form


################################################################################
# HELPERS
################################################################################

class DateInput(forms.DateInput):
    # Django uses type="text" by default, but we want type="date"
    input_type = 'date'
