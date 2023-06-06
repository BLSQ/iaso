import { useSafeIntl } from 'bluesquare-components';
import { useMemo } from 'react';
import MESSAGES from '../../../constants/messages';
import { DropdownOptions } from '../../../../../../../hat/assets/js/apps/Iaso/types/utils';

export type ReasonForDelay = 'INITIAL_DATA' | 'ENCODING_ERROR';

export const reasonsForDateChange: ReasonForDelay[] = [
    'INITIAL_DATA',
    'ENCODING_ERROR',
];

export const useReasonsForDateChangeOptions =
    (): DropdownOptions<ReasonForDelay>[] => {
        const { formatMessage } = useSafeIntl();
        return useMemo(() => {
            return reasonsForDateChange.map(reason => {
                return {
                    label: formatMessage(MESSAGES[reason]),
                    value: reason,
                };
            });
        }, [formatMessage]);
    };
