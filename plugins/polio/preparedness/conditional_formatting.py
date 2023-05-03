from typing import List

from gspread_formatting import (
    BooleanRule,
    BooleanCondition,
    CellFormat,
    Color,
    TextFormat,
    NumberFormat,
)

LIGHT_BLUE = Color(0.7882353, 0.85490197, 0.972549)

# #9c0006
DARK_RED = Color(0.61, 0.0, 0.024)
# #ffc7ce
LIGHT_RED = Color(1.0, 0.78, 0.81)

# #9c5700
DARK_YELLOW = Color(0.612, 0.341, 0)

# #ffeb9c
LIGHT_YELLOW = Color(1.0, 0.922, 0.612)

# #006100
DARK_GREEN = Color(0.0, 0.38, 0.0)

# #c6efce
LIGHT_GREEN = Color(0.776, 0.937, 0.808)

NOT_BLANK = BooleanRule(condition=BooleanCondition("NOT_BLANK", []), format=CellFormat(backgroundColor=LIGHT_BLUE))

IS_BLANK = BooleanRule(condition=BooleanCondition("BLANK", []), format=CellFormat(backgroundColor=LIGHT_YELLOW))

TEXT_CENTERED = CellFormat(verticalAlignment="MIDDLE", horizontalAlignment="CENTER")

PERCENT_FORMAT = CellFormat(
    numberFormat=NumberFormat(type="PERCENT", pattern="0%"),
)


def get_between_rule(values: List[str], text_foreground_color: Color = DARK_RED, background_color: Color = LIGHT_RED):
    return BooleanRule(
        condition=BooleanCondition("NUMBER_BETWEEN", values),
        format=CellFormat(
            textFormat=TextFormat(bold=True, foregroundColor=text_foreground_color), backgroundColor=background_color
        ),
    )


EQ_TO_0 = BooleanRule(
    condition=BooleanCondition("NUMBER_EQ", ["0"]),
    format=CellFormat(textFormat=TextFormat(foregroundColor=DARK_RED), backgroundColor=LIGHT_RED),
)
