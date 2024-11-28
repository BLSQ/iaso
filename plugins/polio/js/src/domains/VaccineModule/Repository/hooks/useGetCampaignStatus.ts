// import { useSafeIntl } from 'bluesquare-components';
import { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';
import { DropdownOptions } from '../../../../../../../../hat/assets/js/apps/Iaso/types/utils';

export const useGetCampaignStatus = (): DropdownOptions<string>[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(
        () => [
            {
                value: 'PREPARING',
                label: formatMessage(MESSAGES.preparing),
            },
            {
                value: 'PAST',
                label: formatMessage(MESSAGES.pastCampaigns),
            },
            {
                value: 'ONGOING',
                label: formatMessage(MESSAGES.ongoingCampaigns),
            },
        ],
        [formatMessage],
    );
};
