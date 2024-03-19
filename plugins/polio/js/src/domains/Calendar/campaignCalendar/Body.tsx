import React, { FunctionComponent } from 'react';

import { TableBody, TableRow } from '@mui/material';
import { useStyles } from './Styles';

import { PlaceholderRow } from './PlaceholderRow';
import { StaticFieldsCells } from './cells/StaticFields';
import { RoundPopperContextProvider } from './contexts/RoundPopperContext';
import { CalendarData, MappedCampaign } from './types';
import { getCells } from './utils';

type BodyProps = {
    campaigns: MappedCampaign[];
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
                {campaigns.map((campaign: MappedCampaign) => (
                    <TableRow
                        className={classes.tableRow}
                        key={`row-${campaign.id}`}
                    >
                        <StaticFieldsCells campaign={campaign} isPdf={isPdf} />
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
