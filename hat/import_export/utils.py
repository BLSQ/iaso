import collections
from typing import Optional
import pandas
import re
from base64 import b64encode, b64decode
from hashlib import md5

import logging
from pandas import Series
from string import capwords

from hat.cases.models import CaseAbstract


logger = logging.getLogger(__name__)


def capitalize(x: str) -> Optional[str]:
    if pandas.isnull(x):
        return None
    return capwords(x)


def create_documentid(row) -> str:
    """
    Hash some columns to create the document id
    IMPORTANT: We use the `document_id` to identify cases. If something in
               the import code changes, this function should still produce
               the same id for a case as it did before the change. So that
               cases that are reimported will get the same id as when they
               were exported in the past.
    """
    COLUMNS = [
        # 'document_date',
        "postname",
        "lastname",
        "prename",
        "sex",
        "year_of_birth",
        "mothers_surname",
        "village",
        "province",
        "ZS",
        "AS",
    ]

    if isinstance(row, Series):
        t = tuple(row[COLUMNS])
    elif isinstance(row, CaseAbstract):
        t = [getattr(row, x) for x in COLUMNS]
    else:
        logger.warning(
            f"Type of create_documentid is unexpected: {type(row)}, trying as a Series"
        )
        t = tuple(row[COLUMNS])

    return create_documentid_tuple(t)


def create_documentid_tuple(t) -> str:
    h = md5()
    for x in t:
        h.update(str(x).encode())
    return h.hexdigest()


def strip_accents(s: str) -> str:
    s = re.sub(r"[ÀÁÂ]", "A", s, flags=re.I)
    s = re.sub(r"[ÈÉÊ]", "E", s, flags=re.I)
    s = re.sub(r"Û", "U", s, flags=re.I)
    s = re.sub(r"[^A-Z0-9]", "", s, flags=re.I)
    if len(s) == 0:
        return "XX"
    if len(s) == 1:
        return s + "X"
    return s


def hat_id(row) -> str:
    """
    This generates a HAT-Id from a couple of values.
    It's important that it works the same as the function in sense-hat-mobile:
    https://github.com/eHealthAfrica/sense-hat-mobile/blob/develop/src/data/mapping.js#L110-L117
    """
    empty = "XX"
    if isinstance(row, Series):
        r2 = row.dropna()
    else:
        COLUMNS = [
            "lastname",
            "postname",
            "prename",
            "sex",
            "year_of_birth",
            "mothers_surname",
        ]
        r2 = {
            col: getattr(row, col)
            for col in COLUMNS
            if getattr(row, col, None) is not None
        }

    if "lastname" in r2:
        lastname = strip_accents(r2["lastname"])
    else:
        lastname = empty

    if "postname" in r2:
        postname = strip_accents(r2["postname"])
    else:
        postname = empty

    if "prename" in r2:
        prename = strip_accents(r2["prename"])
    else:
        prename = empty

    if "sex" in r2:
        sex = r2["sex"]
    else:
        sex = empty

    if "year_of_birth" in r2:
        yob = str(r2["year_of_birth"])
    else:
        yob = "XXXX"

    if "mothers_surname" in r2:
        mothers = strip_accents(r2["mothers_surname"])
    else:
        mothers = empty

    return (
        lastname[0:2] + postname[0:2] + prename[0:2] + sex[0:1] + yob[0:4] + mothers[0:1]
    ).upper()


def hash_file(filename: str) -> str:
    hasher = md5()
    with open(filename, "rb") as file:
        hasher.update(file.read())
    return hasher.hexdigest()


def read_file_base64(filename: str) -> str:
    """ Read the file contents into a base64 encoded string """
    with open(filename, "rb") as file:
        # return b64encode(file.read()).decode('ascii')
        return b64encode(file.read()).decode("ascii")


def write_file_base64(filename: str, b64str: str) -> None:
    """ Decode a base64 encoded string and write it to a file """
    with open(filename, "wb") as file:
        file.write(b64decode(b64str))


def replace_in_dict_recursive(obj, key, val):
    if isinstance(obj, collections.Mapping):
        return {
            k: replace_in_dict_recursive(val if k == key else v, key, val)
            for k, v in obj.items()
        }
    elif isinstance(obj, list):
        return [i for i in obj]
    else:
        return obj
