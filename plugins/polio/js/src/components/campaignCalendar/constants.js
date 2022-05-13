import React from 'react';
import { apiDateFormat } from 'Iaso/utils/dates';

import { EditCampaignCell } from './cells/EditCampaignCell';

const defaultStaticColWidth = 45;
const colsCount = 16;
const defaultCampaignLength = 6;
const dateFormat = apiDateFormat;
const colSpanTitle = 21;
const defaultOrder = 'round_one__started_at';
const staticFields = [
    {
        width: 16,
        key: 'edit',
        hideHeadTitle: true,
        render: campaign => <EditCampaignCell campaign={campaign} />,
    },
    {
        key: 'country',
        sortKey: 'country__name',
    },
    {
        key: 'name',
        sortKey: 'obr_name',
    },
    {
        key: 'r1StartDate',
        sortKey: 'round_one__started_at',
        render: campaign =>
            campaign.R1Start ? campaign.R1Start.format('L') : '',
    },
];

export {
    colsCount,
    dateFormat,
    colSpanTitle,
    staticFields,
    defaultOrder,
    defaultCampaignLength,
    defaultStaticColWidth,
};
