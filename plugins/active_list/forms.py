from django import forms

from .models import Record, Validation


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
        fields = [
            "patient",
            "sex",
            "age",
            "weight",
            "new_inclusion",
            "transfer_in",
            "return_to_care",
            "tb_hiv",
            "hiv_type",
            "treatment_line",
            "last_dispensation_date",
            "days_dispensed",
            "regimen",
            "stable",
            "discontinuation_date",
            "arv_stock_days",
            "received_arv",
            "transfer_out",
            "death",
            "art_stoppage",
            "served_elsewhere",
        ]
        widgets = {
            "received_arv": forms.HiddenInput(),
            "last_dispensation_date": forms.DateInput(attrs={"type": "date"}),
            "discontinuation_date": forms.DateInput(attrs={"type": "date"}),
        }
