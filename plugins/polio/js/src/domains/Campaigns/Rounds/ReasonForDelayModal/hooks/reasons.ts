import { useSafeIntl } from 'bluesquare-components';
import { useMemo } from 'react';
import MESSAGES from '../../../../../constants/messages';
import { DropdownOptions } from '../../../../../../../../../hat/assets/js/apps/Iaso/types/utils';

export type ReasonForDelay =
    | 'INITIAL_DATA'
    | 'ENCODING_ERROR'
    | 'PUBLIC_HOLIDAY'
    | 'OTHER_ACTIVITIES'
    | 'MOH_DECISION'
    | 'CAMPAIGN_SYNCHRONIZATION'
    | 'PREPAREDNESS_LEVEL_NOT_REACHED'
    | 'FUNDS_NOT_RECEIVED_OPS_LEVEL'
    | 'FUNDS_NOT_ARRIVED_IN_COUNTRY'
    | 'VACCINES_NOT_DELIVERED_OPS_LEVEL'
    | 'VACCINES_NOT_ARRIVED_IN_COUNTRY'
    | 'SECURITY_CONTEXT'
    | 'CAMPAIGN_MOVED_FORWARD_BY_MOH'
    | 'VRF_NOT_SIGNED';

export const reasonsForDateChange: ReasonForDelay[] = [
    // 'INITIAL_DATA', // users should not have access to that option in the dropdown
    'ENCODING_ERROR',
    'PUBLIC_HOLIDAY',
    'OTHER_ACTIVITIES',
    'MOH_DECISION',
    'CAMPAIGN_SYNCHRONIZATION',
    'PREPAREDNESS_LEVEL_NOT_REACHED',
    'FUNDS_NOT_RECEIVED_OPS_LEVEL',
    'FUNDS_NOT_ARRIVED_IN_COUNTRY',
    'VACCINES_NOT_DELIVERED_OPS_LEVEL',
    'VACCINES_NOT_ARRIVED_IN_COUNTRY',
    'SECURITY_CONTEXT',
    'CAMPAIGN_MOVED_FORWARD_BY_MOH',
    'VRF_NOT_SIGNED',
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
