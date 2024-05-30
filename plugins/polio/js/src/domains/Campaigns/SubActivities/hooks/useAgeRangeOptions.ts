import { useSafeIntl } from 'bluesquare-components';
import { useMemo } from 'react';
import MESSAGES from '../messages';

const options = ['m', 'y'];

export const useAgeRangeOptions = () => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return options.map(value => {
            const label = MESSAGES[value]
                ? formatMessage(MESSAGES[value])
                : value;
            return { value, label };
        });
    }, [formatMessage]);
};
