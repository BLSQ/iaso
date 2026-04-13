def detect_multi_field_value_splitter(dialect, value):
    delimiter = dialect.delimiter
    alternatives = {
        ";": [",", "|"],
        ",": [";", "|"],
        "|": [",", ";"],
    }

    if delimiter not in alternatives:
        raise ValueError

    for alt in alternatives[delimiter]:
        if alt in value:
            return alt

    return delimiter
