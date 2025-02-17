import os
import re

import pandas as pd


#
# Example usage
# original_expression = "${a} + ${b} + ${a}"
# print(get_formula_dependencies(original_expression)) => a b
def get_formula_dependencies(original_expression):
    dependencies = []
    expression = str(original_expression)  # Ensure the expression is a string

    # Regex to find all expressions like ${variable}
    regex = r"\${(.*?)}"
    variables_found = re.findall(regex, expression)

    if not variables_found:
        return dependencies

    # Add each found variable to dependencies
    for var in variables_found:
        dependencies.append(var)

    # Return unique records, but keep the order of insertion
    return list(dict.fromkeys(dependencies))


def parse_sheet(excel_file, sheet_name):
    if sheet_name not in excel_file.sheet_names:
        return []

    excel_data = excel_file.parse(sheet_name=sheet_name, keep_default_na=False)
    excel_data = excel_data.reset_index()
    excel_data.rename(columns={"index": "line_number"}, inplace=True)

    cleanable_columns = ["name", "list_name", "list name"]
    for column_name in cleanable_columns:
        if column_name in excel_data.columns:
            excel_data[column_name] = excel_data[column_name].apply(lambda x: x.strip() if isinstance(x, str) else x)

    rows = excel_data.to_dict(orient="records")

    return rows


def is_end_group(question):
    return question.get("type") == "end group" or question.get("type") == "end_group"


def is_end_repeat(question):
    return question.get("type") == "end repeat" or question.get("type") == "end_repeat"


def is_select_one(question):
    question_type = question.get("type")
    return question_type and (question_type.startswith("select_one ") or question_type.startswith("select one "))


def is_repeat_group(question):
    return question.get("type") == "begin repeat" or question.get("type") == "begin_repeat"


def get_list_name_from_select(question):
    q_type = question.get("type")
    list_name = None
    if "select one from " in q_type:
        list_name = q_type.split("select one from ")[1]
    elif "select_one" in q_type:
        list_name = q_type.split("select_one ")[1]
    elif "select one" in q_type:
        list_name = q_type.split("select one ")[1]

    if list_name is not None:
        list_name = list_name.strip()

        if list_name.endswith(" or_other"):
            list_name = list_name.replace(" or_other", "")

        list_name = list_name.strip()

    return list_name


def get_list_name_from_choice(choice):
    return choice.get("list_name") or choice.get("list name")


def group_by_lambda(collection, field_name_lambda):
    collection_by_name = {}

    for q in collection:
        field_value = field_name_lambda(q)
        if field_value:
            collection_by_name.setdefault(field_value, []).append(q)

    return collection_by_name


def validate_xls_form(xls_file):
    file_extension = os.path.splitext(xls_file.name)[1].lower()
    engine = "xlrd" if file_extension == ".xls" else "openpyxl"

    excel_file = pd.ExcelFile(xls_file, engine=engine)

    question_rows = parse_sheet(excel_file, "survey")

    choices_rows = parse_sheet(excel_file, "choices")

    questions = [q for q in question_rows if q.get("type") and not is_end_group(q) and not is_end_repeat(q)]
    choices = [c for c in choices_rows if get_list_name_from_choice(c)]

    validation_errors = []

    questions_by_name = group_by_lambda(questions, lambda x: x.get("name"))

    choices_by_list_name = group_by_lambda(choices, lambda x: get_list_name_from_choice(x))

    has_some_repeat_groups = len([q for q in question_rows if is_repeat_group(q)]) > 0

    for name, questions_list in questions_by_name.items():
        if len(questions_list) > 1 and not has_some_repeat_groups:
            # TODO : don't block if questions are in repeat groups / only if same repeat_groups
            # see odk_instance_repeat_group_form.xlsx
            # if too hard only do this validation for the moment it has no repeat_groups ?
            validation_errors.append(
                {
                    "message": "duplicated question name '" + name + "'",
                    "question": questions_list[0],
                    "questions_list": questions_list,
                    "sheet": "survey",
                    "severity": "error",
                }
            )
        if " " in name:
            validation_errors.append(
                {
                    "message": "avoid blanks in question name '" + name + "'",
                    "question": questions_list[0],
                    "sheet": "survey",
                    "severity": "error",
                }
            )

    select_one_questions = [q for q in questions if is_select_one(q)]

    for select_one_q in select_one_questions:
        list_name = get_list_name_from_select(select_one_q)
        if list_name not in choices_by_list_name:
            validation_errors.append(
                {
                    "message": "choices not found for '" + select_one_q["name"] + "' and list_name '" + list_name + "'",
                    "question": select_one_q,
                    "sheet": "survey",
                    "severity": "error",
                }
            )

    formula_columns = ["relevant", "calculation", "constraint", "required", "default", "trigger"]

    for q in questions:
        for col in formula_columns:
            formula = q.get(col)
            if formula:
                dependencies = get_formula_dependencies(formula)
                for dependency in dependencies:
                    if dependency not in questions_by_name:
                        validation_errors.append(
                            {
                                "message": f"unknown reference to '{dependency}' in '{q['name']}' {col} = '{formula}'",
                                "question": q,
                                "sheet": "survey",
                                "severity": "error",
                            }
                        )

    # TODO more advanced validations
    #    - choices
    #       - name : no blanks
    #    - calculate should have a calculation
    #    - formulas : see "relevant","calculation", "constraint", "required", "default", "trigger" columns
    #       - [x] formula's should used "known" question names (migth be done with string tokenizer)
    #       - [ ] formula's should used "known" functions (harder too, need ast to be acurate)
    #       - [ ] formula's should be valid (harder, need ast)
    #    - notes should contain valid reference to question's name
    #    - non matching "begin group" "end group"
    #    - non matching "begin repeat group" "end repeat group"
    #    - non matching nested groups or repeat groups
    #    - limit types to known/supported one ?
    #    - select_multiple verify list_name
    #    - select_*_from_file ??

    return validation_errors
