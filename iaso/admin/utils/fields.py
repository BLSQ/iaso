from django import forms
from django_json_widget.widgets import JSONEditorWidget


class IasoJSONEditorWidget(JSONEditorWidget):
    class Media:
        css = {"all": ("css/admin-json-widget.css",)}

    def __init__(self, attrs=None, mode="code", options=None, width=None, height=None):
        if height == None:
            height = "400px"

        default_options = {
            "modes": ["text", "code"],
            "mode": mode,
            "search": True,
        }
        if options:
            default_options.update(options)

        super(IasoJSONEditorWidget, self).__init__(
            attrs=attrs, mode=mode, options=default_options, width=width, height=height
        )


class ArrayFieldMultipleChoiceField(forms.MultipleChoiceField):
    """
    Display a multi-select field for ArrayField:

    formfield_overrides = {
        ArrayField: {
            "form_class": ArrayFieldMultipleChoiceField,
        }
    }

    formfield_overrides = {
        ArrayField: {
            "form_class": ArrayFieldMultipleChoiceField,
            "widget": forms.CheckboxSelectMultiple,
        }
    }
    """

    def __init__(self, *args, **kwargs):
        kwargs.pop("max_length", None)
        base_field = kwargs.pop("base_field", None)
        kwargs["choices"] = base_field.choices
        kwargs["choices"].pop(0)
        super().__init__(*args, **kwargs)
