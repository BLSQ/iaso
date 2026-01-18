import re

from typing import Dict, Iterable


MAX_COL_LEN = 63
SAFE_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def fix_field_name(name):
    if name == "id":
        return "answer_id"
    return name


def _sanitize(name: str) -> str:
    name = fix_field_name(name)
    s = re.sub(r"[^A-Za-z0-9_]", "_", name).strip("_")
    if not s:
        return ""
    if not re.match(r"^[A-Za-z_]", s):
        s = "_" + s
    return s


def make_safe_name(orig: str, idx: int, used_lower: set) -> str:
    base = _sanitize(orig) or f"c{idx}"
    if len(base) > MAX_COL_LEN:
        base = base[:MAX_COL_LEN]
    candidate = base
    i = 1
    while candidate.lower() in used_lower:
        suffix = f"_{i}"
        cut = MAX_COL_LEN - len(suffix)
        candidate = (base[:cut] + suffix) if cut > 0 else f"c{idx}{suffix}"
        i += 1
    used_lower.add(candidate.lower())
    return candidate


def generate_safe_mapping(keys: Iterable[str]) -> Dict[str, str]:
    used_lower = set()
    mapping: Dict[str, str] = {}
    for idx, k in enumerate(keys, start=1):
        safe = make_safe_name(k, idx, used_lower)
        mapping[k] = safe
    return mapping
