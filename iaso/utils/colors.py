from django.utils.translation import gettext as _


DEFAULT_COLOR = "#1976D2"
COLOR_FORMAT_ERROR = _("Color must be a valid hex code (#RRGGBB).")


def validate_hex_color(value: str) -> str:
    """Validate and normalize a hex RGB color code (#RRGGBB)."""
    if not value:
        return value

    if not value.startswith("#"):
        raise ValueError("Color must start with #")

    if len(value) != 7:
        raise ValueError("Color must be in format #RRGGBB (7 characters)")

    hex_part = value[1:]
    if not all(c in "0123456789ABCDEFabcdef" for c in hex_part):
        raise ValueError("Color must contain only valid hexadecimal characters (0-9, A-F)")

    return value.upper()


COLOR_CHOICES = (
    ("#ef5350", "Red 400"),
    ("#b71c1c", "Red 900"),
    ("#ec407a", "Pink 400"),
    ("#d81b60", "Pink 600"),
    ("#c2185b", "Pink 700"),
    ("#7b1fa2", "Purple 700"),
    ("#6a1b9a", "Purple 900"),
    ("#4527a0", "Deep Purple 800"),
    ("#5c6bc0", "Indigo 400"),
    ("#42a5f5", "Light Blue 400"),
    (DEFAULT_COLOR, "Default color"),
    ("#26c6da", "Cyan 400"),
    ("#00838f", "Cyan 800"),
    ("#26a69a", "Teal 400"),
    ("#00695c", "Teal 800"),
    ("#689f38", "Green 400"),
    ("#2e7d32", "Green 800"),
    ("#558b2f", "Light Green 800"),
    ("#d4e157", "Lime 400"),
    ("#827717", "Lime 900"),
    ("#fbc02d", "Yellow 700"),
    ("#ffca28", "Amber 400"),
    ("#ff8f00", "Amber 800"),
    ("#ff9800", "Orange 500"),
    ("#f57c00", "Orange 700"),
    ("#f4511e", "Deep Orange 600"),
    ("#d84315", "Deep Orange 800"),
    ("#8d6e63", "Brown 400"),
    ("#5d4037", "Brown 700"),
    # No greys here on purpose: grey is the colour the map falls back to for an org unit that has
    # no assignee, so offering a near-identical grey as a pickable colour makes assigned and
    # unassigned org units indistinguishable. Black is dark enough to stay legible against it.
    ("#000000", "Black"),
)

# Indices into COLOR_CHOICES. Must stay a permutation of range(len(COLOR_CHOICES)) — the API
# builds the whole dispersed palette from it, so a missing index silently drops a colour.
DISPERSED_COLOR_ORDER = [
    9,  # Light Blue 400
    18,  # Lime 400
    27,  # Brown 400
    5,  # Purple 700
    11,  # Cyan 400
    21,  # Amber 400
    0,  # Red 400
    2,  # Pink 400
    14,  # Teal 800
    19,  # Lime 900
    25,  # Deep Orange 600
    6,  # Purple 900
    10,  # Default color
    22,  # Amber 800
    1,  # Red 900
    13,  # Teal 400
    23,  # Orange 500
    28,  # Brown 700
    7,  # Deep Purple 800
    15,  # Green 400
    3,  # Pink 600
    12,  # Cyan 800
    24,  # Orange 700
    20,  # Yellow 700
    8,  # Indigo 400
    16,  # Green 800
    4,  # Pink 700
    17,  # Light Green 800
    26,  # Deep Orange 800
    29,  # Black
]
