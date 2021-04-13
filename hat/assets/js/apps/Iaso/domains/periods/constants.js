import MESSAGES from './messages';

export const PERIOD_TYPE_YEAR = 'YEAR';
export const PERIOD_TYPE_SIX_MONTH = 'SIX_MONTH';
export const PERIOD_TYPE_QUARTER = 'QUARTER';
export const PERIOD_TYPE_MONTH = 'MONTH';

export const PERIOD_TYPES = [
    PERIOD_TYPE_MONTH,
    PERIOD_TYPE_QUARTER,
    PERIOD_TYPE_SIX_MONTH,
    PERIOD_TYPE_YEAR,
];

export const periodTypeOptions = [
    PERIOD_TYPE_MONTH,
    PERIOD_TYPE_QUARTER,
    PERIOD_TYPE_YEAR,
].map(periodType => ({
    value: periodType,
    label: MESSAGES[periodType.toLowerCase()],
}));
