import { PERIOD_TYPES } from './periods';
import { INSTANCE_STATUSES } from '../instances/constants';

export const periodTypeOptions = PERIOD_TYPES.map(periodType => ({
    value: periodType,
    label: {
        id: `iaso.label.periodType.${periodType.toLowerCase()}`,
        defaultMessage: periodType,
    },
}));

export const instanceStatusesOptions = INSTANCE_STATUSES.map(instanceStatus => (
    {
        value: instanceStatus,
        label: {
            id: `iaso.completeness.${instanceStatus.toLowerCase()}`,
            defaultMessage: instanceStatus,
        },
    }
));
