import { useSafeIntl } from 'bluesquare-components';
import { DropdownOptions } from '../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import MESSAGES from '../../../constants/messages';

export const useCampaignCategoryOptions = (
    isEmbedded: boolean,
): DropdownOptions<string>[] => {
    const { formatMessage } = useSafeIntl();
    const baseOptions = [
        { label: formatMessage(MESSAGES.all), value: 'all' },
        { label: formatMessage(MESSAGES.preventiveShort), value: 'preventive' },
        { label: formatMessage(MESSAGES.regular), value: 'regular' },
        { label: formatMessage(MESSAGES.campaignOnHold), value: 'on_hold' },
    ];
    if (isEmbedded) return baseOptions;
    return [
        ...baseOptions,
        { label: formatMessage(MESSAGES.planned), value: 'is_planned' },
    ];
};
