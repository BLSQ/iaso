// import { useSafeIntl } from 'bluesquare-components';
import { useMemo } from 'react';
// import MESSAGES from '../messages';
import { DropdownOptions } from '../../../../../../../../hat/assets/js/apps/Iaso/types/utils';

export const useGetCampaignStatus = (): DropdownOptions<string>[] => {
    // const { formatMessage } = useSafeIntl();
    return useMemo(
        () => [
            {
                value: 'PREPARING',
                label: 'Preparing',
            },
            {
                value: 'PAST',
                label: 'Past Campaigns',
            },
            {
                value: 'ONGOING',
                label: 'Ongoing Campaigns',
            },
        ],
        [],
    );
};
