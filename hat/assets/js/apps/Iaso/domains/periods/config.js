import { PERIOD_TYPES } from './constants';

// eslint-disable-next-line import/prefer-default-export
export const periodTypeOptions = PERIOD_TYPES.map(periodType => ({
    value: periodType,
    label: {
        id: `iaso.label.periodType.${periodType.toLowerCase()}`,
        defaultMessage: periodType,
    },
}));
