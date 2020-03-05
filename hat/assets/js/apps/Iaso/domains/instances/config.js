import { INSTANCE_STATUSES } from './constants';

export const instanceStatusOptions = INSTANCE_STATUSES.map(instanceStatus => (
    {
        value: instanceStatus,
        label: {
            id: `iaso.label.instanceStatus.${instanceStatus.toLowerCase()}`,
            defaultMessage: instanceStatus,
        },
    }
));

export const instanceStatusPluralOptions = INSTANCE_STATUSES.map(instanceStatus => (
    {
        value: instanceStatus,
        label: {
            id: `iaso.label.instanceStatus.${instanceStatus.toLowerCase()}Multi`,
            defaultMessage: instanceStatus,
        },
    }
));
