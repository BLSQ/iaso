import { useSafeIntl } from 'bluesquare-components';
import { useCallback } from 'react';
import MESSAGES from '../messages';

export const useGetJSonLogicConverter = () => {
    const { formatMessage } = useSafeIntl();
    return useCallback(
        (json: string) => {
            if (!json) return '';

            const parsed = typeof json === 'string' ? JSON.parse(json) : json;
            const value = parsed['and'];
            return value
                ?.map((rule, index) => {
                    const operator = Object.keys(rule)[0];
                    const rightHandArg = rule[operator][1];
                    const rightHandValue =
                        typeof rightHandArg === 'object'
                            ? formatMessage(MESSAGES.average).toLowerCase()
                            : rightHandArg;
                    if (index === 0) {
                        return `value ${operator} ${rightHandValue}`;
                    }
                    return ` & value ${operator} ${rightHandValue}`;
                })
                .join('');
        },
        [formatMessage],
    );
};
