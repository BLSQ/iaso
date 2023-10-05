import { useSafeIntl } from 'bluesquare-components';
import { useMemo } from 'react';
import { UseQueryResult } from 'react-query';
import MESSAGES from '../../../../../constants/messages';
import { DropdownOptions } from '../../../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { useSnackQuery } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { getRequest } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';

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
    | 'VRF_NOT_SIGNED'
    | 'FOUR_WEEKS_GAP_BETWEEN_ROUNDS'
    | 'OTHER_VACCINATION_CAMPAIGNS';

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
    'FOUR_WEEKS_GAP_BETWEEN_ROUNDS',
    'OTHER_VACCINATION_CAMPAIGNS',
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

export const useReasonsDelayOptions = (
    locale: 'en' | 'fr' = 'en',
): UseQueryResult<DropdownOptions<number>[], any> => {
    return useSnackQuery({
        queryKey: ['reasonsForDelay', locale],
        queryFn: () => getRequest('/api/polio/reasonsfordelay/'),
        options: {
            select: data => {
                if (!data) return [];
                const key = `name_${locale.toLowerCase()}`;
                return data.results.map(reason => {
                    return {
                        label: reason[key],
                        value: reason.id,
                    } as DropdownOptions<number>;
                });
            },
        },
    });
};
