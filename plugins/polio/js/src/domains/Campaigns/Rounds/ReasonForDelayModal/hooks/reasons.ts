import { UseQueryResult } from 'react-query';
import { DropdownOptions } from '../../../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { useSnackQuery } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { getRequest } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';

export type ReasonForDelay = 'INITIAL_DATA' | string;

export const useReasonsDelayOptions = (
    locale: 'en' | 'fr' = 'en',
): UseQueryResult<DropdownOptions<number>[], any> => {
    return useSnackQuery({
        queryKey: ['reasonsForDelay', locale],
        queryFn: () => getRequest('/api/polio/reasonsfordelay/forcampaign/'),
        options: {
            select: data => {
                if (!data) return [];
                const key = `name_${locale.toLowerCase()}`;
                return data.results
                    .filter(reason => reason.key_name !== 'INITIAL_DATA')
                    .map(reason => {
                        return {
                            label: reason[key],
                            value: reason.id,
                        } as DropdownOptions<number>;
                    })
                    .sort((a, b) =>
                        a.label.localeCompare(b.label, undefined, {
                            sensitivity: 'accent',
                        }),
                    );
            },
        },
    });
};
