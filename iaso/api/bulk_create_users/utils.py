def detect_multi_field_value_splitter(dialect, value):
    if dialect.delimiter == ";":
        if "," in value:
            return ","
        return "|"
    if dialect.delimiter == ",":
        if ";" in value:
            return ";"
        return "|"
    if dialect.delimiter == "|":
        if "," in value:
            return ","
        return ";"
    raise ValueError
