import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';

export const useGetRequiresUserActionOptions = () => {
    const { formatMessage } = useSafeIntl();
    return [
        { value: 'true', label: formatMessage(MESSAGES.yes) },
        { value: 'false', label: formatMessage(MESSAGES.no) },
    ];
};
