import random
import string
from datetime import datetime
from uuid import uuid4

def randstr(minlen=2, maxlen=10):
    n = min(24, random.randint(minlen, maxlen))
    return ''.join(random.sample(string.ascii_lowercase, n))

def mock_ref(schema, defs):
    ref = schema['$ref']
    # only internal definitions are supported
    if ref[:14] == '#/definitions/':
        d = ref[14:]
        if d in defs:
            return mock_schema(defs[d], defs)

def mock_enum(schema):
    return random.choice(schema['enum'])

def mock_object(schema, defs=None):
     if 'properties' in schema:
        return {p: mock_schema(s, defs)
                for p, s in schema['properties'].items()}

def mock_array(schema, defs=None):
    if 'minItems' in schema: minimum = schema['minItems']
    else: minimum = 1
    if 'maxItems' in schema: maximum = schema['maxItems']
    else: maximum = minimum + 9
    n = random.randint(minimum, maximum)
    if isinstance(schema['items'], dict):
        s = schema['items']
        return [mock_schema(s, defs) for i in range(minimum)]

def mock_integer(schema):
    if 'minimum' in schema: minimum = schema['minimum']
    else: minimum = 0
    if 'maximum' in schema: maximum = schema['maximum']
    else: maximum = minimum + 100
    return random.randint(minimum, maximum)

def mock_number(schema):
    if 'minimum' in schema: minimum = schema['minimum']
    else: minimum = 0
    if 'maximum' in schema: maximum = schema['maximum']
    else: maximum = minimum + 100
    return minimum + random.random() * (maximum - minimum)

def mock_string(schema):
    if 'minLength' in schema: minlen = schema['minLength']
    else: minlen = 2
    if 'maxLength' in schema: maxlen = schema['maxLength']
    else: maxlen = max(minlen, 10)
    return randstr(minlen, maxlen)

def mock_format(schema):
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

def mock_schema(schema, definitions=None):
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
