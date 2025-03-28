import React, { Fragment, FunctionComponent, useState } from 'react';

import { TableRow } from '@mui/material';

import { StaticFieldsCells } from './cells/StaticFields';
import { StaticSubactivitiesFields } from './cells/StaticSubactivitiesFields';
import { useStyles } from './Styles';
import { CalendarData, CalendarParams, MappedCampaign } from './types';
import { getRoundsCells } from './utils/rounds';
import { getSubActivitiesCells } from './utils/subactivities';

type Props = {
    campaign: MappedCampaign;
    currentWeekIndex: number;
    firstMonday: CalendarData['firstMonday'];
    lastSunday: CalendarData['lastSunday'];
    isPdf: boolean;
    params: CalendarParams;
};

export const CampaignRows: FunctionComponent<Props> = ({
    campaign,
    currentWeekIndex,
    firstMonday,
    lastSunday,
    isPdf,
    params,
}) => {
    const classes = useStyles();
    const [subActivitiesExpanded, setSubActivitiesExpanded] = useState(false);
    return (
        <Fragment key={`row-${campaign.id}`}>
            <TableRow className={classes.tableRow}>
                <StaticFieldsCells
                    campaign={campaign}
                    isPdf={isPdf}
                    subActivitiesExpanded={subActivitiesExpanded}
                    setSubActivitiesExpanded={setSubActivitiesExpanded}
                />
                {getRoundsCells(
                    campaign,
                    currentWeekIndex,
                    firstMonday,
                    lastSunday,
                    params.periodType || 'quarter',
                )}
            </TableRow>
            {subActivitiesExpanded &&
                campaign.rounds
                    .filter(round => round.subActivities.length > 0)
                    .map(round => (
                        <TableRow
                            className={classes.tableRowSmall}
                            key={`round-${round.id}`}
                        >
                            <StaticSubactivitiesFields
                                isPdf={isPdf}
                                roundNumber={round.number}
                            />
                            {getSubActivitiesCells(
                                campaign,
                                round.subActivities,
                                currentWeekIndex,
                                firstMonday,
                                lastSunday,
                            )}
                        </TableRow>
                    ))}
        </Fragment>
    );
};
