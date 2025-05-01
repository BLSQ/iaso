from django import forms
from .models import Validation, Record


class ValidationForm(forms.ModelForm):
    class Meta:
        model = Validation
        fields = ["comment", "validation_status", "period", "org_unit"]
        widgets = {
            "comment": forms.Textarea(attrs={"rows": 4}),
            "period": forms.HiddenInput(),
            "org_unit": forms.HiddenInput(),
        }


class ActivePatientsListForm(forms.ModelForm):
    """
    Form for creating and updating ActivePatientsList instances.
    """

    class Meta:
        model = Record
        exclude = [
            "import_source",
            "org_unit",
            "active",
            "region",
            "district",
            "code_ets",
            "number",
            "facility_name",
            "period",
            "next_dispensation_date",
        ]  # Exclude foreign key fields
        widgets = {
            "import_source": forms.HiddenInput(),
            "active": forms.HiddenInput(),
            "validation_status": forms.HiddenInput(),
            "org_unit": forms.HiddenInput(),
            "received_arv": forms.HiddenInput(),
            "disappeared": forms.HiddenInput(),
            "region": forms.HiddenInput(),
            "district": forms.HiddenInput(),
            "code_ets": forms.HiddenInput(),
            "number": forms.HiddenInput(),
            "facility_name": forms.HiddenInput(),
            "period": forms.HiddenInput(),
            "last_dispensation_date": forms.DateInput(attrs={"type": "date"}),
            "next_dispensation_date": forms.DateInput(attrs={"type": "date"}),
            "discontinuation_date": forms.DateInput(attrs={"type": "date"}),
        }
