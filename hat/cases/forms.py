from collections import namedtuple
from datetime import datetime, timedelta
from django import forms
from django.utils.translation import ugettext as _

DATE_FORMAT = "%Y-%m-%d"


ItemsAndForm = namedtuple('ItemsAndForm', ['items', 'form'])
FieldChoice = namedtuple('FieldChoice', ['id', 'label', 'filter'])
OrderChoice = namedtuple('OrderChoice', ['id', 'label', 'asc', 'desc'])


class CasesFilterForm(forms.Form):
    def __init__(self,
                 locations_choices,
                 fields_choices,
                 field_choice,
                 orders_choices,
                 *args, **kwargs):
        super(CasesFilterForm, self).__init__(*args, **kwargs)

        select_attrs = {
            'class': 'select--minimised',
            'onchange': 'casesfilter.submit();',
        }
        date_attrs = {
            'class': 'input--minimised',
            'onchange': 'casesfilter.submit();',
        }
        radio_attrs = {
            'class': 'radio--minimised',
            'onchange': 'casesfilter.submit();'
        }
        input_attrs = {'class': 'input--minimised'}
        none_choice = (None, _('None'))

        ########################################################################
        # location fields

        self.fields['ZS'] = forms.ChoiceField(
            choices=[none_choice] + [(l, l) for l in locations_choices[0]],
            widget=forms.Select(attrs=select_attrs),
            required=False
        )

        if len(locations_choices) > 1:
            self.fields['AS'] = forms.ChoiceField(
                choices=[none_choice] + [(l, l) for l in locations_choices[1]],
                widget=forms.Select(attrs=select_attrs),
                required=False
            )
        else:
            self.fields['AS'] = forms.ChoiceField(widget=forms.HiddenInput)

        if len(locations_choices) > 2:
            self.fields['village'] = forms.ChoiceField(
                choices=[none_choice] + [(l, l) for l in locations_choices[2]],
                widget=forms.Select(attrs=select_attrs),
                required=False
            )
        else:
            self.fields['village'] = forms.ChoiceField(widget=forms.HiddenInput)

        ########################################################################
        # date fields
        self.fields['date_from'] = forms.DateField(
            widget=DateInput(attrs=date_attrs),
            required=False
        )
        self.fields['date_to'] = forms.DateField(
            widget=DateInput(attrs=date_attrs),
            required=False
        )

        ########################################################################
        # custom filter fields
        if fields_choices is None:
            self.fields['case_field'] = forms.ChoiceField(widget=forms.HiddenInput)
        else:
            self.fields['case_field'] = forms.ChoiceField(
                choices=[none_choice] + fields_choices,
                widget=forms.Select(select_attrs),
                required=False
            )
            if field_choice:
                case_field_value_widget = forms.TextInput(attrs=input_attrs)
            else:
                case_field_value_widget = forms.HiddenInput()
            self.fields['case_field_value'] = forms.CharField(
                widget=case_field_value_widget,
                required=False
            )

        ########################################################################
        # order
        if orders_choices is None:
            self.fields['order'] = forms.ChoiceField(widget=forms.HiddenInput)
        else:
            self.fields['order'] = forms.ChoiceField(
                choices=[none_choice] + orders_choices,
                widget=forms.Select(attrs=select_attrs),
                required=False
            )
            self.fields['asc_desc'] = forms.ChoiceField(
                choices=[('asc', _('Ascendent')), ('desc', _('Descendent'))],
                widget=forms.RadioSelect(attrs=radio_attrs),
                required=False,
                initial='asc',
            )


def filter_and_create_form(
    request,
    items,
    locations_filters,
    dates_filters,
    fields_filters: None,
    orders: None,
) -> ItemsAndForm:

    ############################################################################
    # check locations fields and filters

    # extract locations list from items
    if 'all' in locations_filters:
        locations_list = locations_filters['all']
    else:
        locations_list = items
    locations_list = locations_list \
        .values('ZS', 'AS', 'village') \
        .order_by('ZS', 'AS', 'village') \
        .distinct()

    locations_choices = [locations_list.order_by('ZS').values_list('ZS', flat=True).distinct()]

    ZS = request.GET.get('ZS', None)
    AS = None
    village = None
    if ZS:
        items = locations_filters['ZS'](items, ZS)
        ASs = locations_list \
            .filter(ZS=ZS) \
            .order_by('AS') \
            .values_list('AS', flat=True) \
            .distinct()
        locations_choices.append(ASs)

        AS = request.GET.get('AS', None)
        if AS and AS in ASs:
            items = locations_filters['AS'](items, AS)
            villages = locations_list \
                .filter(ZS=ZS, AS=AS) \
                .order_by('village') \
                .values_list('village', flat=True) \
                .distinct()
            locations_choices.append(villages)

            village = request.GET.get('village', None)
            if village and village in villages:
                items = locations_filters['village'](items, village)

    ############################################################################
    # check dates fields and filters

    date_from = request.GET.get('date_from', None)
    date_to = request.GET.get('date_to', None)
    if date_from and date_to:
        date_from = datetime.strptime(date_from, DATE_FORMAT)
        date_to = datetime.strptime(date_to, DATE_FORMAT) + timedelta(days=1)
        items = dates_filters['between'](items, date_from, date_to)

    elif date_from:
        date_from = datetime.strptime(date_from, DATE_FORMAT)
        items = dates_filters['from'](items, date_from)

    elif date_to:
        date_to = datetime.strptime(date_to, DATE_FORMAT) + timedelta(days=1)
        items = dates_filters['to'](items, date_to)

    ############################################################################
    # check fields

    if fields_filters:
        fields_choices = [(f.id, f.label) for f in fields_filters]
        case_field = request.GET.get('case_field', None)
        if case_field:
            case_field_value = request.GET.get('case_field_value', None)
            if case_field_value:
                f = next(f.filter for f in fields_filters if f.id == case_field)
                items = f(items, case_field_value)
        else:
            case_field = None
    else:
        fields_choices = None
        case_field = None

    ############################################################################
    # check order

    if orders:
        orders_choices = [(o.id, o.label) for o in orders]
        order = request.GET.get('order', None)
        if order:
            order_choice = next(o for o in orders if o.id == order)
            if order_choice:
                asc_desc = request.GET.get('asc_desc', None)
                if asc_desc != 'desc':
                    items = order_choice.asc(items)
                else:
                    items = order_choice.desc(items)
    else:
        orders_choices = None

    ############################################################################
    # create form

    form = CasesFilterForm(locations_choices,
                           fields_choices,
                           case_field,
                           orders_choices,
                           request.GET or None
                           )

    return ItemsAndForm(form=form, items=items)


################################################################################
# HELPERS
################################################################################

class DateInput(forms.DateInput):
    ''' Django uses type="text" by default, but we want type="date" '''
    input_type = 'date'
