export type GraphTooltipFormatter = (
    _value: any,
    _name: any,
    props: {
        payload:
            | { passing: number; found: number }
            | { marked: number; checked: number };
    },
) => [string, string];
