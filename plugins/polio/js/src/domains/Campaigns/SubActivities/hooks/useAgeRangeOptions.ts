import { useSafeIntl } from 'bluesquare-components';
import { useMemo } from 'react';
import MESSAGES from '../messages';
import { DropdownOptions } from '../../../../../../../../hat/assets/js/apps/Iaso/types/utils';

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
