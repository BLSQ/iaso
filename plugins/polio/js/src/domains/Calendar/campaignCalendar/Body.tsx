import React, { Fragment, FunctionComponent } from 'react';

import { TableBody, TableRow } from '@mui/material';

import { StaticFieldsCells } from './cells/StaticFields';
import { StaticSubactivitiesFields } from './cells/StaticSubactivitiesFields';
import { RoundPopperContextProvider } from './contexts/RoundPopperContext';
import { PlaceholderRow } from './PlaceholderRow';
import { useStyles } from './Styles';
import { CalendarData, CalendarParams, MappedCampaign } from './types';
import { getRoundsCells } from './utils/rounds';
import { getSubActivitiesCells } from './utils/subactivities';

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
                    <Fragment key={`row-${campaign.id}`}>
                        <TableRow className={classes.tableRow}>
                            <StaticFieldsCells
                                campaign={campaign}
                                isPdf={isPdf}
                            />
                            {getRoundsCells(
                                campaign,
                                currentWeekIndex,
                                firstMonday,
                                lastSunday,
                                params.periodType || 'quarter',
                            )}
                        </TableRow>
                        {campaign.subActivities.length > 0 && (
                            <TableRow className={classes.tableRow}>
                                <StaticSubactivitiesFields isPdf={isPdf} />
                                {getSubActivitiesCells(
                                    campaign,
                                    currentWeekIndex,
                                    firstMonday,
                                    lastSunday,
                                    params.periodType || 'quarter',
                                )}
                            </TableRow>
                        )}
                    </Fragment>
                ))}
            </TableBody>
        </RoundPopperContextProvider>
    );
};
