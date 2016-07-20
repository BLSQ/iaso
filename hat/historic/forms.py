from django import forms


class UploadMdbFilesForm(forms.Form):
    file = forms.FileField(
        widget=forms.FileInput(attrs={'multiple': True, 'accept': '.mdb,.accdb'}))


class DownloadCsvForm(forms.Form):
    pass
