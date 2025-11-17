import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../../constants/messages';
import { CampaignListItem } from '../../../constants/types';

type Props = {
    row: {
        original: CampaignListItem;
    };
};

export const CampaignCategoryCell: FunctionComponent<Props> = ({
    row: { original: campaign },
}) => {
    const { formatMessage } = useSafeIntl();
    const categories: string[] = [];

    if (campaign.on_hold) {
        categories.push(formatMessage(MESSAGES.campaignOnHold));
    } else if (campaign.is_test) {
        categories.push(formatMessage(MESSAGES.testCampaign));
    } else if (campaign.is_planned) {
        categories.push(formatMessage(MESSAGES.planned));
    } else if (campaign.is_preventive) {
        categories.push(formatMessage(MESSAGES.preventiveShort));
    } else {
        categories.push(formatMessage(MESSAGES.regular));
    }

    if (
        campaign.is_preventive &&
        !categories.includes(formatMessage(MESSAGES.preventiveShort))
    ) {
        categories.push(formatMessage(MESSAGES.preventiveShort));
    }

    return <>{categories.join(' - ')}</>;
};
