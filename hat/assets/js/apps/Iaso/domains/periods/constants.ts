import MESSAGES from './messages';

export const PERIOD_TYPE_DAY = 'DAY';
export const PERIOD_TYPE_YEAR = 'YEAR';
export const PERIOD_TYPE_SIX_MONTH = 'SIX_MONTH';
export const PERIOD_TYPE_QUARTER = 'QUARTER';
export const PERIOD_TYPE_QUARTER_NOV = 'QUARTER_NOV';
export const PERIOD_TYPE_FINANCIAL_NOV = 'FINANCIAL_NOV';
export const PERIOD_TYPE_MONTH = 'MONTH';
export const PERIOD_TYPE_WEEK = 'WEEK';
export const PERIOD_TYPE_PLACEHOLDER = 'EMPTY';
export const NO_PERIOD = 'NO_PERIOD';

export const PERIOD_TYPES = [
    PERIOD_TYPE_MONTH,
    PERIOD_TYPE_QUARTER,
    PERIOD_TYPE_QUARTER_NOV,
    PERIOD_TYPE_SIX_MONTH,
    PERIOD_TYPE_YEAR,
    PERIOD_TYPE_FINANCIAL_NOV,
    PERIOD_TYPE_WEEK,
];

const PERIOD_TYPE_MESSAGES = {
    [PERIOD_TYPE_DAY]: MESSAGES.day,
    [PERIOD_TYPE_MONTH]: MESSAGES.month,
    [PERIOD_TYPE_QUARTER]: MESSAGES.quarter,
    [PERIOD_TYPE_QUARTER_NOV]: MESSAGES.quarter_nov,
    [PERIOD_TYPE_YEAR]: MESSAGES.year,
    [PERIOD_TYPE_FINANCIAL_NOV]: MESSAGES.financial_nov,
    [PERIOD_TYPE_WEEK]: MESSAGES.week,
    [PERIOD_TYPE_SIX_MONTH]: MESSAGES.six_month,
} as const;

export const periodTypeOptions = (
    [
        PERIOD_TYPE_DAY,
        PERIOD_TYPE_MONTH,
        PERIOD_TYPE_QUARTER,
        PERIOD_TYPE_QUARTER_NOV,
        PERIOD_TYPE_YEAR,
        PERIOD_TYPE_FINANCIAL_NOV,
        PERIOD_TYPE_WEEK,
    ] as const
).map(periodType => ({
    value: periodType,
    label: PERIOD_TYPE_MESSAGES[periodType],
}));
export const periodTypeOptionsWithNoPeriod = [
    {
        value: NO_PERIOD,
        label: MESSAGES.noPeriod,
    },
].concat(periodTypeOptions);

export const QUARTERS = {
    1: 'Q1',
    2: 'Q2',
    3: 'Q3',
    4: 'Q4',
};

export const QUARTERS_NOV = {
    1: 'NovQ1',
    2: 'NovQ2',
    3: 'NovQ3',
    4: 'NovQ4',
};

export const SEMESTERS = {
    1: 'S1',
    2: 'S2',
};

export const MONTHS = {
    1: MESSAGES.january,
    2: MESSAGES.february,
    3: MESSAGES.march,
    4: MESSAGES.april,
    5: MESSAGES.may,
    6: MESSAGES.june,
    7: MESSAGES.july,
    8: MESSAGES.august,
    9: MESSAGES.september,
    10: MESSAGES.october,
    11: MESSAGES.november,
    12: MESSAGES.december,
};

export const QUARTERS_RANGE = {
    1: [MONTHS[1], MONTHS[3]],
    2: [MONTHS[4], MONTHS[6]],
    3: [MONTHS[7], MONTHS[9]],
    4: [MONTHS[10], MONTHS[12]],
};

export const QUARTERS_NOV_RANGE = {
    1: [MONTHS[11], MONTHS[1]],
    2: [MONTHS[2], MONTHS[4]],
    3: [MONTHS[5], MONTHS[7]],
    4: [MONTHS[8], MONTHS[10]],
};

export const SEMESTERS_RANGE = {
    1: [MONTHS[1], MONTHS[6]],
    2: [MONTHS[7], MONTHS[12]],
};
