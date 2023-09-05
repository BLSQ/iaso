import os, django

from django.apps import apps
import sys

project_name = sys.argv[1]

print(sys.argv)

if len(sys.argv) > 2:
    if "*" in sys.argv[2]:
        model_selector = sys.argv[2].replace("*", "")
    else:
        model_selector = sys.argv[2].split(",")
else:
    model_selector = None

if len(sys.argv) > 3:
    model_file = sys.argv[3] + ".md"
else:
    model_file = f"{project_name}_model.md"

os.environ.setdefault("DJANGO_SETTINGS_MODULE", f"{project_name}.settings_local")
django.setup()

models_list = apps.get_models()

for model in models_list:
    print(str(model.__module__))
    print(model_selector)
    print(model_selector in str(model.__module__))
    print("---------")


models_data = []
relations = []

if model_selector is not None:
    if type(model_selector) == str:
        models_list = [model for model in models_list if model_selector in str(model.__module__)]
    else:
        models_list = [model for model in models_list if model.__name__ in model_selector]


print(models_list)

try:
    from django.conf import settings

    if settings.APP_EXCLUDE:
        for app in settings.APP_EXCLUDE:
            models = apps.get_app_config(app).models
            for model in models:
                if models[model] in models_list:
                    models_list.remove(models[model])
except Exception as e:
    print("There was a error in loading the models/app to exclude")
    pass

for model in models_list:
    model_dict = {}
    model_fields = []
    for field in model._meta.get_fields():
        model_fields.append(field)

    model_dict[model.__name__] = model_fields
    models_data.append(model_dict)

with open("schemas/" + model_file, "w") as f:
    f.write(f"## {project_name}'s ER Diagram\n\n```mermaid\n")
    f.write("%%{init: {'theme': 'neutral' } }%%\n")
    f.write("erDiagram\n")
    for model in models_data:
        for model_name in model:
            f.write(model_name + "{\n")
            for field in model[model_name]:
                try:
                    field_type = field.get_internal_type()
                except AttributeError:
                    field_type = field.__class__.__name__

                field_name = field.name

                if field_name[0] == "_":
                    field_name = field_name[1:]

                if field.related_model and field.related_model in models_list:
                    field_related_model = field.related_model.__name__
                    field_model = field.model.__name__
                    if field_type == "ForeignKey":
                        relationship = "||--|{"
                    elif field_type == "ManyToManyField":
                        relationship = "}|--|{"
                    elif field_type == "OneToOneField":
                        relationship = "||--||"
                    relations.append(field_model + relationship + field_related_model + " : " + field_name + "\n")
                else:
                    f.write(f"{field_type} {field_name}\n")
            f.write("}\n")
    f.writelines(relations)
    f.write("```\n")
    print(f"ER Diagram for {project_name} generated in the file -> {model_file}")
