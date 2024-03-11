import React, { ReactElement } from 'react';
import moment from 'moment';

import { EditCampaignCell } from './cells/EditCampaignCell';
import { Campaign } from '../../../constants/types';
import { Field } from '../types';

export const staticFields: Field[] = [
    {
        width: 16,
        key: 'edit',
        hideHeadTitle: true,
        render: (campaign: Campaign): ReactElement => (
            <EditCampaignCell campaign={campaign} />
        ),
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
        render: (campaign: Campaign): string => {
            const roundOne = campaign.rounds?.find(round => round.number === 1);
            if (roundOne?.started_at) {
                return moment(roundOne.started_at).format('L');
            }
            return '-';
        },
    },
];
