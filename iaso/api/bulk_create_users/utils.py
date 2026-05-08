def detect_multi_field_value_splitter_csv(dialect, value):
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


def detect_multi_field_value_splitter_xls(value):
    possible_delimiters = [";", "|", ","]
    counts = {char: value.count(char) for char in possible_delimiters}
    most_present_delimiter = max(counts, key=counts.get)

    return most_present_delimiter
