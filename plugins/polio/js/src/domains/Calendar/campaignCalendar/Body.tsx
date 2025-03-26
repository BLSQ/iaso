import React, { FunctionComponent } from 'react';

import { TableBody, TableRow } from '@mui/material';

import { StaticFieldsCells } from './cells/StaticFields';
import { StaticSubactivitiesFields } from './cells/StaticSubactivitiesFields';
import { RoundPopperContextProvider } from './contexts/RoundPopperContext';
import { PlaceholderRow } from './PlaceholderRow';
import { useStyles } from './Styles';
import { CalendarData, CalendarParams, MappedCampaign } from './types';
import { getCells, getSubActivitiesCells } from './utils';

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
    const classes = useStyles();
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
                    <>
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
                                params.periodType || 'quarter',
                            )}
                        </TableRow>
                        {campaign.subActivities.length > 0 && (
                            <TableRow
                                className={classes.tableRow}
                                key={`row-${campaign.id}`}
                            >
                                <StaticSubactivitiesFields isPdf={isPdf} />
                                {getSubActivitiesCells(
                                    campaign,
                                    currentWeekIndex,
                                    firstMonday,
                                    lastSunday,
                                )}
                            </TableRow>
                        )}
                    </>
                ))}
            </TableBody>
        </RoundPopperContextProvider>
    );
};
