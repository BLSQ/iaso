import { useSafeIntl } from 'bluesquare-components';
import { MESSAGES } from '../messages';

export const useGetCriteriaOptions = () => {
    const { formatMessage } = useSafeIntl();
    return [
        {
            label: formatMessage(MESSAGES.ruralUrban),
            value: 'RURAL/URBAN',
        },
        {
            label: formatMessage(MESSAGES.urban),
            value: 'URBAN',
        },
        {
            label: formatMessage(MESSAGES.rural),
            value: 'RURAL',
        },
    ];
};
