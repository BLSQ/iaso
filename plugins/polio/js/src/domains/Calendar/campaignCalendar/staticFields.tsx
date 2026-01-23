import React, { ReactElement } from 'react';
import { Box, SxProps } from '@mui/material';
import { textPlaceholder } from 'bluesquare-components';
import moment from 'moment';

import { Field } from '../types';
import { CountryStaticFields } from './cells/CountryStaticFields';
import { EditCampaignCell } from './cells/EditCampaignCell';
import { INTEGRATED_CAMPAIGN_BORDER_COLOR } from './constants';
import { MappedCampaign } from './types';

export const getCellStyle = (
    fieldKey: string,
    campaign: MappedCampaign,
): SxProps => {
    const borderStyle = `2px solid ${INTEGRATED_CAMPAIGN_BORDER_COLOR}`;
    if (fieldKey === 'edit')
        switch (campaign.layout) {
            case 'top':
                return {
                    borderTop: borderStyle,
                    borderLeft: borderStyle,
                };
            case 'middle':
                return {
                    borderLeft: borderStyle,
                };
            case 'bottom':
                return {
                    borderBottom: borderStyle,
                    borderLeft: borderStyle,
                };
            default:
                return {};
        }
    if (
        fieldKey === 'country' ||
        fieldKey == 'name' ||
        fieldKey === 'campaign_types'
    ) {
        switch (campaign.layout) {
            case 'top':
                return {
                    borderTop: borderStyle,
                };
            case 'middle':
                return {};
            case 'bottom':
                return {
                    borderBottom: borderStyle,
                };
            default:
                return {};
        }
    }
    if (fieldKey === 'r1StartDate') {
        switch (campaign.layout) {
            case 'top':
                return {
                    borderTop: borderStyle,
                    borderRight: borderStyle,
                };
            case 'middle':
                return { borderRight: borderStyle };
            case 'bottom':
                return {
                    borderBottom: borderStyle,
                    borderRight: borderStyle,
                };
            default:
                return {};
        }
    }
    return {};
};

export const staticFields: Field[] = [
    {
        width: 30,
        key: 'edit',
        hideHeadTitle: true,
        render: (campaign: MappedCampaign): ReactElement => {
            return <EditCampaignCell campaign={campaign} />;
        },
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
            return textPlaceholder;
        },
    },
];
