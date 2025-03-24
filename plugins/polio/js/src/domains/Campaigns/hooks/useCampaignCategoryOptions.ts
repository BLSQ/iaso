import { useSafeIntl } from 'bluesquare-components';
import { DropdownOptions } from '../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import MESSAGES from '../../../constants/messages';

export const useCampaignCategoryOptions = (): DropdownOptions<string>[] => {
    const { formatMessage } = useSafeIntl();
    return [
        { label: formatMessage(MESSAGES.all), value: 'all' },
        { label: formatMessage(MESSAGES.preventiveShort), value: 'preventive' },
        { label: formatMessage(MESSAGES.regular), value: 'regular' },
        { label: formatMessage(MESSAGES.campaignOnHold), value: 'on_hold' },
    ];
};
