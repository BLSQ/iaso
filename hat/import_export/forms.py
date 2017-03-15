from typing import Any
from django import forms
from django.utils.translation import ugettext_lazy as _


class UploadFileForm(forms.Form):
    def __init__(self,
                 multiple: bool,
                 accept: str,
                 *args: Any, **kwargs: Any) -> None:
        super(UploadFileForm, self).__init__(*args, **kwargs)

        self.fields['file'] = forms.FileField(
            label=_('Upload file'),
            widget=forms.FileInput(attrs={'multiple': multiple, 'accept': accept}),
        )
