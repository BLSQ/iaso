import React, { FunctionComponent } from 'react';

import { TableBody } from '@mui/material';

import { CampaignRows } from './CampaignRows';
import { RoundPopperContextProvider } from './contexts/RoundPopperContext';
import { PlaceholderRow } from './PlaceholderRow';

import { CalendarData, CalendarParams, MappedCampaign } from './types';

type BodyProps = {
    campaigns: MappedCampaign[];
    currentWeekIndex: number;
    firstMonday: CalendarData['firstMonday'];
    lastSunday: CalendarData['lastSunday'];
    loadingCampaigns: boolean;
    isPdf: boolean;
    params: CalendarParams;
};

export const Body: FunctionComponent<BodyProps> = ({
    campaigns,
    currentWeekIndex,
    firstMonday,
    lastSunday,
    loadingCampaigns,
    isPdf,
    params,
}) => {
    return (
        <RoundPopperContextProvider>
            <TableBody>
                {campaigns.length === 0 && (
                    <PlaceholderRow
                        loadingCampaigns={loadingCampaigns}
                        params={params}
                    />
                )}
                {campaigns.map((campaign: MappedCampaign) => (
                    <CampaignRows
                        key={`campaign-${campaign.id}`}
                        campaign={campaign}
                        currentWeekIndex={currentWeekIndex}
                        firstMonday={firstMonday}
                        lastSunday={lastSunday}
                        isPdf={isPdf}
                        params={params}
                    />
                ))}
            </TableBody>
        </RoundPopperContextProvider>
    );
};
