"""
https://docs.dhis2.org/2.30/en/developer/html/dhis2_developer_manual_full.html#webapi_csv_data_elements

supported   Value type	        Description
y        AGE	                approximative as date
y        COORDINATE             Coordinate     A point coordinate specified as longitude and latitude in decimal degrees. All coordinate should be specified in the format "-19.23 , 56.42" with a comma separating the longitude and latitude.
y        DATE                   Date           Dates rendered as calendar widget in data entry.
y        DATETIME               Date & time	        -
y        EMAIL                  Email	                Email.
n        FILE_RESOURCE          File            A file resource where you can store external files, for example documents and photos.
y        INTEGER                Integer	        Any whole number (positive and negative), including zero.
y        LETTER                 Letter              A single letter.
y        LONG_TEXT              Long text           Textual value. Renders as text area with no length constraint in forms.
y        INTEGER_NEGATIVE       Negative integer	Any whole number less than (but not including) zero.
y        NUMBER                 Number	            Any real numeric value with a single decimal point. Thousands separators and scientific notation is not supported.
y        PERCENTAGE             Percentage	        Whole numbers inclusive between 0 and 100.
y        PHONE_NUMBER           Phone number	        Phone number.
y        INTEGER_POSITIVE       Positive integer	Any whole number greater than (but not including) zero.
y        INTEGER_ZERO_OR_POSITIVE   Positive of zero integer	Any positive whole number, including zero.
y        ORGANISATION_UNIT	    Organisation units rendered as a hierarchy tree widget.
n        UNIT_INTERVAL          Unit interval    Any real number greater than or equal to 0 and less than or equal to 1.
y        TEXT                   Text            Textual value. The maximum number of allowed characters per value is 50,000.
y        ??                     Time	            "Time is stored in HH:mm format. HH is a number between 0 and 23 mm is a number between 00 and 59"
n        ???                    Tracker associate	Tracked entity instance. Rendered as dialog with a list of tracked entity instances and a search field.
y        USERNAME               Username	        DHIS 2 user. Rendered as a dialog with a list of users and a search field.
y        BOOLEAN                Yes/No	            Boolean values, renders as drop-down lists in data entry.
n        TRUE_ONLY              Yes only	        True values, renders as check-boxes in data entry.
"""


def translate_optionset(data_element, raw_value):
    if "optionSet" in data_element:
        if raw_value == "":
            return None

        for options in data_element["optionSet"]["options"]:
            if options.get("odk") == raw_value:
                return options["code"]

        for options in data_element["optionSet"]["options"]:
            if options["code"] == raw_value:
                return raw_value

        raise Exception("no value matching : '" + raw_value + "' in " + str(data_element))
    return raw_value


def format_value(data_element, raw_value, orgunit_resolver):
    if "valueType" in data_element:
        data_element_type = data_element["valueType"]
    else:
        raise Exception("no valueType for ", data_element)

    if raw_value is None:
        return None

    translated_value = translate_optionset(data_element, raw_value)

    if data_element_type == "NUMBER":
        if translated_value == "":
            return None
        try:
            if isinstance(translated_value, float):
                return translated_value
            if isinstance(translated_value, int):
                return translated_value
            if "." in translated_value:
                return float(translated_value)
            else:
                return int(translated_value)
        except Exception:
            import traceback

            raise Exception("Bad value for float '" + str(raw_value) + "'", data_element)

    if (
        data_element_type == "INTEGER_ZERO_OR_POSITIVE"
        or data_element_type == "INTEGER"
        or data_element_type == "INTEGER_POSITIVE"
        or data_element_type == "INTEGER_NEGATIVE"
        or data_element_type == "PERCENTAGE"
    ):
        if translated_value == "":
            return None
        try:
            return int(translated_value)
        except:
            raise Exception("Bad value for int '" + str(raw_value) + "'", data_element)

    if data_element_type == "ORGANISATION_UNIT":
        if translated_value is None:
            return None
        return orgunit_resolver(str(translated_value))

    if (
        data_element_type == "TEXT"
        or data_element_type == "LONG_TEXT"
        or data_element_type == "USERNAME"
        or data_element_type == "EMAIL"
        or data_element_type == "PHONE_NUMBER"
        or data_element_type == "LETTER"
    ):
        if translated_value is None:
            return None
        return str(translated_value)

    if data_element_type == "BOOLEAN":
        if translated_value == "1" or translated_value == "yes" or translated_value == "true" or translated_value == 1:
            return True
        elif (
            translated_value == "0" or translated_value == "no" or translated_value == "false" or translated_value == 0
        ):
            return False
        elif translated_value == "":
            return None
        else:
            raise Exception("Bad value for boolean '" + str(raw_value) + "'", data_element)

    if data_element_type == "COORDINATE":
        if translated_value:
            coordinates = translated_value.split(" ")
            return "[" + coordinates[1] + "," + coordinates[0] + "]"
        return None

    if data_element_type == "TIME":
        return translated_value[0:5]

    if data_element_type == "DATE" or data_element_type == "AGE":
        if translated_value:
            return translated_value
        return None

    raise Exception("unsupported data element type : " + str(data_element), raw_value)
