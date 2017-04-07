from typing import Dict, Any
from enum import IntEnum, unique

ImportResult = Dict[str, Any]


@unique
class ResultValues(IntEnum):
    '''store screening values.'''
    positive = 2
    negative = 1
    missing = -1
    absent = 0
