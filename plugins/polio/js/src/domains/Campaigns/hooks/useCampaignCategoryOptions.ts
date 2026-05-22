import { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { DropdownOptions } from '../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import MESSAGES from '../../../constants/messages';

export const useCampaignCategoryOptions = (): DropdownOptions<string>[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(
        () => [
            { label: formatMessage(MESSAGES.all), value: 'all' },
            {
                label: formatMessage(MESSAGES.preventiveShort),
                value: 'preventive',
            },
            { label: formatMessage(MESSAGES.regular), value: 'regular' },
            { label: formatMessage(MESSAGES.campaignOnHold), value: 'on_hold' },
            { label: formatMessage(MESSAGES.planned), value: 'is_planned' },
        ],
        [formatMessage],
    );
};
