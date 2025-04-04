import React, { ReactElement } from 'react';
import { Box } from '@mui/material';
import moment from 'moment';

import { Field } from '../types';
import { CountryStaticFields } from './cells/CountryStaticFields';
import { EditCampaignCell } from './cells/EditCampaignCell';
import { MappedCampaign } from './types';

export const staticFields: Field[] = [
    {
        width: 30,
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
        width: 100,
        render: (
            campaign,
            subActivitiesExpanded,
            setSubActivitiesExpanded,
            hasSubActivities,
        ): ReactElement => (
            <CountryStaticFields
                campaign={campaign}
                subActivitiesExpanded={subActivitiesExpanded}
                setSubActivitiesExpanded={setSubActivitiesExpanded}
                hasSubActivities={hasSubActivities}
            />
        ),
    },
    {
        key: 'name',
        sortKey: 'obr_name',
        width: 90,
    },
    {
        key: 'campaign_types',
        width: 55,
        render: (campaign: MappedCampaign): ReactElement => (
            <Box>
                {campaign.original.campaign_types
                    .map(campaignType => campaignType.name)
                    .join(', ')}
            </Box>
        ),
    },
    {
        key: 'r1StartDate',
        width: 65,
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
