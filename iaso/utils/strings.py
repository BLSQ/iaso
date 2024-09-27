def remove_prefix_from_str(str, prefix):
    if str.startswith(prefix):
        return str[len(prefix):]
    return str
