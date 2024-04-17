import moment from 'moment';
import React, { ReactElement } from 'react';

import { Field } from '../types';
import { EditCampaignCell } from './cells/EditCampaignCell';
import { MappedCampaign } from './types';

export const staticFields: Field[] = [
    {
        width: 16,
        key: 'edit',
        hideHeadTitle: true,
        render: (campaign: MappedCampaign): ReactElement => (
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
        key: 'campaign_types',
        render: (campaign: MappedCampaign): ReactElement => (
            <>
                {campaign.original.campaign_types
                    .map(campaignType => campaignType.name)
                    .join(', ')}
            </>
        ),
    },
    {
        key: 'r1StartDate',
        sortKey: 'first_round_started_at',
        render: (campaign: MappedCampaign): string => {
            const roundOne = campaign.rounds?.find(round => round.number === 1);
            if (roundOne?.started_at) {
                return moment(roundOne.started_at).format('L');
            }
            return '-';
        },
    },
];
