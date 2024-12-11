from django import forms
from .models import Validation


class ValidationForm(forms.ModelForm):
    class Meta:
        model = Validation
        fields = ["comment", "validation_status"]
        widgets = {
            "comment": forms.Textarea(attrs={"rows": 4}),
        }
