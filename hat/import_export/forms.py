from django import forms
from django.utils.translation import ugettext_lazy as _


class UploadMdbFilesForm(forms.Form):
    file = forms.FileField(
        label=_('Upload file'),
        widget=forms.FileInput(attrs={'multiple': True, 'accept': '.mdb,.accdb,.enc'}))


class UploadLocationsFileForm(forms.Form):
    file = forms.FileField(label=_('Upload file'),
                           widget=forms.FileInput(attrs={'accept': '.dbf'}))


class UploadReconciledFileForm(forms.Form):
    file = forms.FileField(label=_('Upload file'),
                           widget=forms.FileInput(attrs={'accept': '.xlsx'}))


class DateInput(forms.DateInput):
    ''' Django uses type="text" by default, but we want type="date" '''
    input_type = 'date'


class DownloadCsvForm(forms.Form):
    date_from = forms.DateField(widget=DateInput, required=False,
                                label=_('From'))
    date_to = forms.DateField(widget=DateInput, required=False,
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
        (',', _('Comma “,”')),
        (';', _('Semicolon “;”')),
    )
    sep = forms.ChoiceField(
        required=True,
        widget=forms.RadioSelect,
        choices=SEP_CHOICES,
        label=_('Field separator'),
        initial=','
    )
