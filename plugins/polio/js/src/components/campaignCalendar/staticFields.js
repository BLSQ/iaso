import React from 'react';
import moment from 'moment';

import { EditCampaignCell } from './cells/EditCampaignCell';

const staticFields = [
    {
        width: 16,
        key: 'edit',
        hideHeadTitle: true,
        render: campaign => <EditCampaignCell campaign={campaign} />,
        exportHide: true,
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
        sortKey: 'first_round_started_at',
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

export { staticFields };
