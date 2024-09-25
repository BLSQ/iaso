import re


def fix_emoji(payload):
    chrifnotspecial = lambda dec: (
        "&#%d;" % dec if dec in [10, 13, 35, 38, 59, 60, 62] else chr(dec)
    )  # don't convert `\n\r#&;<>`
    payload = re.sub(r"&#(\d+);", lambda x: chrifnotspecial(int(x.group(1))), payload)
    # No idea why 'INFORMATION SEPARATOR's ended up in some messages,
    # but I decide that I don't need them, and they make the parser barf out...
    for dec in [28, 29, 30, 31]:
        payload = payload.replace(chr(dec), "")

    # combine surrogate pairs
    payload = payload.encode("utf-16", "surrogatepass").decode("utf-16")
    payload = payload.encode("utf-8")
    return payload
