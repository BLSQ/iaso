"""Application-wide constants"""

from iaso.models.project import DEFAULT_PROJECT_COLOR


# Color choices for the application
# Used by teams, projects, and other entities
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
    (DEFAULT_PROJECT_COLOR, "Default color"),
    ("#78909c", "Blue grey 400"),
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
    ("#78909c", "Blue Grey 400"),
    ("#37474f", "Blue Grey 800"),
    ("#424242", "Grey 800"),
    ("#000000", "Black"),
)
