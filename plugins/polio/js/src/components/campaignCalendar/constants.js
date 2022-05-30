import React from 'react';
import moment from 'moment';
import { apiDateFormat } from 'Iaso/utils/dates.ts';

import { EditCampaignCell } from './cells/EditCampaignCell';

const defaultStaticColWidth = 45;
const colsCount = 16;
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
        render: campaign => {
            const roundOne =
                campaign.rounds &&
                campaign.rounds.find(round => round.number === 1);
            if (roundOne && roundOne.started_at) {
                return moment(roundOne.started_at).format('L');
            }
            return '-';
        },
    },
];

export {
    colsCount,
    dateFormat,
    colSpanTitle,
    staticFields,
    defaultOrder,
    defaultStaticColWidth,
};
