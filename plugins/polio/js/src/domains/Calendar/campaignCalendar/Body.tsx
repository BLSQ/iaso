import React, { FunctionComponent } from 'react';

import { TableRow, TableBody } from '@mui/material';
import { useStyles } from './Styles';

import { getCells } from './utils';
import { StaticFieldsCells } from './cells/StaticFields';
import { PlaceholderRow } from './PlaceholderRow';
import { RoundPopperContextProvider } from './contexts/RoundPopperContext';
import { Campaign, CalendarData } from './types';

type BodyProps = {
    campaigns: Campaign[];
    currentWeekIndex: number;
    firstMonday: CalendarData['firstMonday'];
    lastSunday: CalendarData['lastSunday'];
    loadingCampaigns: boolean;
    isPdf: boolean;
};

export const Body: FunctionComponent<BodyProps> = ({
    campaigns,
    currentWeekIndex,
    firstMonday,
    lastSunday,
    loadingCampaigns,
    isPdf,
}) => {
    const classes = useStyles();
    return (
        <RoundPopperContextProvider>
            <TableBody>
                {campaigns.length === 0 && (
                    <PlaceholderRow loadingCampaigns={loadingCampaigns} />
                )}
                {campaigns.map(campaign => (
                    <TableRow
                        className={classes.tableRow}
                        key={`row-${campaign.id}`}
                    >
                        <StaticFieldsCells
                            campaign={campaign}
                            isPdf={isPdf}
                        />
                        {getCells(
                            campaign,
                            currentWeekIndex,
                            firstMonday,
                            lastSunday,
                        )}
                    </TableRow>
                ))}
            </TableBody>
        </RoundPopperContextProvider>
    );
};
