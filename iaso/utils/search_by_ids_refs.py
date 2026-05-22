import re

from logging import getLogger


logger = getLogger(__name__)


def parse_ids(prefix, search):
    s = search.replace(prefix, "")
    try:
        parsed_ids = re.findall("[A-Za-z0-9_-]+", s)
    except Exception as err:
        logger.warn("Failed parsing ids in search '%s': %s", search, err)
        parsed_ids = []
    return parsed_ids
