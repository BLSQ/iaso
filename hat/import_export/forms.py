from django import forms
from django.utils.translation import ugettext_lazy as _


class UploadMdbFilesForm(forms.Form):
    file = forms.FileField(
        label=_("File"),
        widget=forms.FileInput(attrs={'multiple': True, 'accept': '.mdb,.accdb,.enc'}))


class DownloadCsvForm(forms.Form):
    pass
