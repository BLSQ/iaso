from datetime import date

import pandas as pd


# --- Create Sample XLSForm Data ---

# Survey Sheet Data
survey_data = {
    "type": [
        "text",
        "integer",
        "date",
        "decimal",
        "select_one yes_no",
        "select_multiple symptom_list",
        "text",
        "integer",
        "decimal",  # For complex constraint test
    ],
    "name": [
        "respondent_id",
        "age",
        "visit_date",
        "temperature",
        "consent",
        "symptoms",
        "feedback",
        "integer_check",
        "decimal_check",  # For complex constraint test
    ],
    "label": [
        "Respondent ID (e.g., ABC123)",
        "Age (Years)",
        "Date of Visit",
        "Body Temperature (Celsius)",
        "Consent Given?",
        "Select Symptoms Experienced (Multiple)",
        "Optional Feedback",
        "Integer Check",
        "Decimal Check",  # For complex constraint test
    ],
    "required": [
        "TRUE",
        "TRUE",
        "TRUE",
        "FALSE",
        "TRUE",
        "FALSE",
        "FALSE",
        "FALSE",
        "FALSE",  # For complex constraint test
    ],
    "constraint": [
        "regex(., '^[A-Z]{3}\\d{3}$')",  # ID format: 3 letters, 3 numbers
        ". > 18 and . < 100",  # Age constraint
        ". <= today()",  # Date cannot be in the future (Validator script likely skips 'today()')
        ". >= 35.0 and . <= 43.0",  # Temperature range (simple comparison)
        "",  # No constraint on consent choice itself
        "",  # No constraint on symptoms choice itself
        "string-length(.) <= 100",  # Feedback length (Validator script will skip string-length())
        "",  # No constraint on integer_check
        ". > ${integer_check}",  # Constraint referencing another field (Validator script will skip)
    ],
    "constraint_message": [
        "ID must be 3 uppercase letters followed by 3 numbers (e.g., ABC123).",
        "Age must be between 19 and 99 years.",
        "Visit date cannot be in the future.",
        "Temperature must be between 35.0 and 43.0 Celsius.",
        "",
        "",
        "Feedback must be 100 characters or less.",
        "",
        "Decimal check value must be greater than Integer check value.",
    ],
    "calculation": [  # Added calculation column
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",  # Example calculation
    ],
}
for key in survey_data:
    print(key, len(survey_data[key]))

survey_df = pd.DataFrame(survey_data)

# Choices Sheet Data
choices_data = {
    "list_name": ["yes_no", "yes_no", "yes_no", "symptom_list", "symptom_list", "symptom_list", "symptom_list"],
    "name": ["yes", "no", "dk", "fever", "cough", "headache", "fatigue"],
    "label": ["Yes", "No", "Don't Know", "Fever", "Cough", "Headache", "Fatigue"],
}
choices_df = pd.DataFrame(choices_data)

# --- Create Sample Excel Data ---

# Get today's date for realistic date values
today_str = date.today().strftime("%Y-%m-%d")
yesterday = date.today() - pd.Timedelta(days=1)
yesterday_str = yesterday.strftime("%Y-%m-%d")
tomorrow = date.today() + pd.Timedelta(days=1)
tomorrow_str = tomorrow.strftime("%Y-%m-%d")  # Should fail date constraint if evaluated

# Data Rows (Dictionary matching survey 'name' columns)
# Rows designed to test different pass/fail scenarios
data_rows = [
    # Row 1: Should Pass
    {
        "respondent_id": "XYZ789",
        "age": 35,
        "visit_date": today_str,
        "temperature": 37.2,
        "consent": "yes",
        "symptoms": "fever cough",
        "feedback": "Feeling better.",
        "integer_check": 5,
        "decimal_check": 6.1,
    },
    # Row 2: Fail (Required field 'age' is empty)
    {
        "respondent_id": "ABC111",
        "age": None,
        "visit_date": today_str,
        "temperature": 38.0,
        "consent": "yes",
        "symptoms": "cough",
        "feedback": "",
        "integer_check": 10,
        "decimal_check": 10.1,
    },
    # Row 3: Fail (Type error: 'age' is text)
    {
        "respondent_id": "DEF222",
        "age": "Twenty Five",
        "visit_date": today_str,
        "temperature": 36.8,
        "consent": "no",
        "symptoms": "",
        "feedback": "Typo test.",
        "integer_check": 2,
        "decimal_check": 3,
    },
    # Row 4: Fail (Constraint: 'age' < 19)
    {
        "respondent_id": "GHI333",
        "age": 15,
        "visit_date": yesterday_str,
        "temperature": 37.0,
        "consent": "yes",
        "symptoms": "headache",
        "feedback": "",
        "integer_check": 8,
        "decimal_check": 8.8,
    },
    # Row 5: Fail (Constraint: 'temperature' too high)
    {
        "respondent_id": "JKL444",
        "age": 45,
        "visit_date": today_str,
        "temperature": 44.1,
        "consent": "yes",
        "symptoms": "fever",
        "feedback": "",
        "integer_check": 1,
        "decimal_check": 5,
    },
    # Row 6: Fail (Constraint: 'respondent_id' regex mismatch)
    {
        "respondent_id": "MNO-555",
        "age": 60,
        "visit_date": today_str,
        "temperature": 36.5,
        "consent": "yes",
        "symptoms": "fatigue",
        "feedback": "ID format wrong.",
        "integer_check": 15,
        "decimal_check": 25,
    },
    # Row 7: Fail (select_one: 'consent' value 'maybe' not in choices)
    {
        "respondent_id": "PQR666",
        "age": 28,
        "visit_date": today_str,
        "temperature": 37.1,
        "consent": "maybe",
        "symptoms": "cough",
        "feedback": "",
        "integer_check": 20,
        "decimal_check": 20.5,
    },
    # Row 8: Fail (select_multiple: 'symptoms' includes 'nausea' which is not in choices)
    {
        "respondent_id": "STU777",
        "age": 52,
        "visit_date": yesterday_str,
        "temperature": 38.5,
        "consent": "yes",
        "symptoms": "fever nausea cough",
        "feedback": "Invalid symptom.",
        "integer_check": 3,
        "decimal_check": 4,
    },
    # Row 9: Pass (Required field 'consent' has valid 'dk' value, optional fields empty)
    {
        "respondent_id": "VWX888",
        "age": 70,
        "visit_date": today_str,
        "temperature": None,
        "consent": "dk",
        "symptoms": "",
        "feedback": "",
        "integer_check": 7,
        "decimal_check": 7.7,
    },
    # Row 10: Pass (Boundary age, valid multiple symptoms)
    {
        "respondent_id": "YZA999",
        "age": 19,
        "visit_date": today_str,
        "temperature": 36.9,
        "consent": "yes",
        "symptoms": "fatigue headache",
        "feedback": "Boundary test.",
        "integer_check": 9,
        "decimal_check": 19,
    },
    # Row 11: Fail (Date constraint: Future date - script might skip this check)
    {
        "respondent_id": "BCD000",
        "age": 33,
        "visit_date": tomorrow_str,
        "temperature": 37.0,
        "consent": "yes",
        "symptoms": "",
        "feedback": "Future date.",
        "integer_check": 11,
        "decimal_check": 11.1,
    },
    # Row 12: Skipped Constraint (decimal_check <= integer_check, but script skips ${} references)
    {
        "respondent_id": "EFG111",
        "age": 41,
        "visit_date": today_str,
        "temperature": 37.0,
        "consent": "yes",
        "symptoms": "cough",
        "feedback": "Constraint check",
        "integer_check": 10,
        "decimal_check": 5.5,
    },
]
data_df = pd.DataFrame(data_rows)

# --- Write Files ---

xlsform_filename = "your_form.xlsx"
data_filename = "your_data.xlsx"

try:
    # Write XLSForm
    with pd.ExcelWriter(xlsform_filename, engine="openpyxl") as writer:
        survey_df.to_excel(writer, sheet_name="survey", index=False)
        choices_df.to_excel(writer, sheet_name="choices", index=False)
    print(f"Successfully created XLSForm file: {xlsform_filename}")

    # Write Data File
    # Ensure columns match the 'name' fields from the survey sheet exactly for the validator
    data_df_ordered = data_df[survey_df["name"].tolist()]  # Order columns like survey sheet names
    data_df_ordered.to_excel(data_filename, sheet_name="Sheet1", index=False)  # Use default sheet name 'Sheet1'
    print(f"Successfully created Excel data file: {data_filename}")
    print("\nThese files can now be used with the validation script.")
    print(
        "Expected Fails for Rows: 2 (required), 3 (type), 4 (constraint), 5 (constraint), 6 (regex), 7 (select_one), 8 (select_multiple)"
    )
    print("Row 11 (date constraint) might pass if validator skips today().")
    print("Row 12 (complex constraint) should pass validation as the script skips that check.")


except Exception as e:
    print(f"An error occurred while creating the files: {e}")
    import traceback

    traceback.print_exc()
