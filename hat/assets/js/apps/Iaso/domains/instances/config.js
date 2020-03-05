import { INSTANCE_STATUSES } from './constants';

// eslint-disable-next-line import/prefer-default-export
export const instanceStatusOptions = INSTANCE_STATUSES.map(instanceStatus => (
    {
        value: instanceStatus,
        label: {
            id: `iaso.label.instanceStatus.${instanceStatus.toLowerCase()}`,
            defaultMessage: instanceStatus,
        },
    }
));
