from django import forms
from django.utils.translation import ugettext_lazy as _


class UploadMdbFilesForm(forms.Form):
    file = forms.FileField(
        label=_('Files'),
        widget=forms.FileInput(attrs={'multiple': True, 'accept': '.mdb,.accdb,.enc'}))


class UploadLocationsFileForm(forms.Form):
    file = forms.FileField(label=_('File'),
                           widget=forms.FileInput(attrs={'accept': '.dbf'}))


class DateInput(forms.DateInput):
    ''' Django uses type="text" by default, but we want type="date" '''
    input_type = 'date'


class DownloadCsvForm(forms.Form):
    start_date = forms.DateField(widget=DateInput, required=False,
                                 label=_('From'))
    end_date = forms.DateField(widget=DateInput, required=False,
                               label=_('To'))
    SOURCE_CHOICES = (
        ('historic', _('Historic data')),
        ('mobile_backup', _('Mobile backup data')),
        ('pv', _('Pharmacovigilance data')),
    )
    sources = forms.MultipleChoiceField(
        required=False,
        widget=forms.CheckboxSelectMultiple,
        choices=SOURCE_CHOICES,
        label=_('Sources')
    )

    SEP_CHOICES = (
        (',', _('Comma ","')),
        (';', _('Semicolon ";"')),
        ('\t', _('Tab "\\t"'))
    )
    sep = forms.ChoiceField(
        required=True,
        widget=forms.RadioSelect,
        choices=SEP_CHOICES,
        label=_('Fields separator'),
        initial=','
    )
