from typing import List, Any
from .typing import JsonType
import random
import string
from datetime import datetime
from uuid import uuid4


def randstr(minlen: int=2, maxlen: int=10) -> str:
    n = min(24, random.randint(minlen, maxlen))
    return ''.join(random.sample(string.ascii_lowercase, n))


def mock_ref(schema: JsonType, defs: JsonType) -> JsonType:
    ref = schema['$ref']
    # only internal definitions are supported
    local_path = ref[:14]
    name = ref[14:]
    if local_path == '#/definitions/' and name in defs:
        return mock_schema(defs[name], defs)
    else:
        raise KeyError('Only internal definitions are supported')


def mock_enum(schema: JsonType) -> Any:
    return random.choice(schema['enum'])


def mock_object(schema: JsonType, defs: JsonType=None) -> JsonType:
    if 'properties' in schema:
        return {p: mock_schema(s, defs)
                for p, s in schema['properties'].items()}
    else:
        raise TypeError('Json schema object has no "properties" property')


def mock_array(schema: JsonType, defs: JsonType=None) -> List[Any]:
    if 'minItems' in schema:
        minimum = schema['minItems']
    else:
        minimum = 1
    if 'maxItems' in schema:
        maximum = schema['maxItems']
    else:
        maximum = minimum + 9
    n = random.randint(minimum, maximum)
    if isinstance(schema['items'], dict):
        s = schema['items']
        return [mock_schema(s, defs) for i in range(n)]
    else:
        raise TypeError('Json schema only supports arrays of objects')


def mock_integer(schema: JsonType) -> int:
    if 'minimum' in schema:
        minimum = schema['minimum']
    else:
        minimum = 0
    if 'maximum' in schema:
        maximum = schema['maximum']
    else:
        maximum = minimum + 100
    return random.randint(minimum, maximum)


def mock_number(schema: JsonType) -> float:
    if 'minimum' in schema:
        minimum = schema['minimum']
    else:
        minimum = 0
    if 'maximum' in schema:
        maximum = schema['maximum']
    else:
        maximum = minimum + 100
    return minimum + random.random() * (maximum - minimum)


def mock_string(schema: JsonType) -> str:
    if 'minLength' in schema:
        minlen = schema['minLength']
    else:
        minlen = 2
    if 'maxLength' in schema:
        maxlen = schema['maxLength']
    else:
        maxlen = max(minlen, 10)
    return randstr(minlen, maxlen)


def mock_format(schema: JsonType) -> Any:
    f = schema['format']
    if f == 'date-time':
        y = datetime.today().year
        m = random.randint(1, 12)
        d = random.randint(1, 31)
        h = random.randint(0, 23)
        mm = random.randint(0, 59)
        return datetime(y, m, d, h, mm).isoformat()
    elif f == 'str-years':
        return str(random.randint(0, 120))
    elif f == 'str-months':
        return str(random.randint(1, 12))
    elif f == 'uuid':
        return str(uuid4())
    elif f == 'name':
        return randstr(5, 10)
    elif f == 'location-zone':
        return 'zone'
    elif f == 'location-area':
        return 'area'
    elif f == 'location-village':
        return 'village'


def mock_schema(schema: JsonType, definitions: JsonType=None) -> Any:
    defs = definitions
    if defs is None:
        defs = {}
    if 'definitions' in schema:
        defs = {**defs, **schema['definitions']}

    if '$ref' in schema:
        return mock_ref(schema, defs)
    elif 'enum' in schema:
        return mock_enum(schema)
    elif 'format' in schema:
        return mock_format(schema)
    elif 'type' in schema:
        t = schema['type']
        if t == 'object':
            return mock_object(schema, defs)
        elif t == 'array' and 'items' in schema:
            return mock_array(schema, defs)
        elif t == 'boolean':
            return random.choice([True, False])
        elif t == 'integer':
            return mock_integer(schema)
        elif t == 'number':
            return mock_number(schema)
        elif t == 'null':
            return None
        elif t == 'string':
            return mock_string(schema)
        else:
            raise TypeError('Unknown json schema type: {}'.format(type))
