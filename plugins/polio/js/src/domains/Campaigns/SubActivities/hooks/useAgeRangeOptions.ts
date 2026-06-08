import { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { DropdownOptions } from '../../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import MESSAGES from '../messages';

const options = ['m', 'y'];

export const useAgeRangeOptions = (): DropdownOptions<'m' | 'y'>[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return options.map((value: 'm' | 'y') => {
            const label = MESSAGES[value]
                ? formatMessage(MESSAGES[value])
                : value;
            return { value, label };
        });
    }, [formatMessage]);
};
