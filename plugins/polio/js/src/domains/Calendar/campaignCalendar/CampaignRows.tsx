import React, { Fragment, FunctionComponent, useMemo, useState } from 'react';

import { TableRow } from '@mui/material';

import { StaticFieldsCells } from './cells/StaticFields';
import { StaticSubactivitiesFields } from './cells/StaticSubactivitiesFields';
import { useStyles } from './Styles';
import {
    CalendarData,
    CalendarParams,
    MappedCampaign,
    SubActivity,
} from './types';
import { getRoundsCells } from './utils/rounds';
import { getSubActivitiesRow } from './utils/subactivities';
import classNames from 'classnames';

type Props = {
    campaign: MappedCampaign;
    currentWeekIndex: number;
    firstMonday: CalendarData['firstMonday'];
    lastSunday: CalendarData['lastSunday'];
    isPdf: boolean;
    params: CalendarParams;
};

type SubactivitiesPerRound = {
    subactivities: SubActivity[];
    roundNumber: number;
    roundId: number;
    is_planned: boolean;
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
    const subactivitiesPerRound: SubactivitiesPerRound[] = useMemo(
        () =>
            campaign.rounds
                .filter(round => round.subActivities.length > 0)
                .map(round => ({
                    subactivities: round.subActivities,
                    roundNumber: round.number,
                    roundId: round.id,
                    is_planned: round.is_planned,
                })),
        [campaign.rounds],
    );

    return (
        <Fragment key={`row-${campaign.id}`}>
            <TableRow
                className={classNames(
                    classes.tableRow,
                    campaign.isPlanned ? classes.plannedCampaign : '',
                )}
            >
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
                subactivitiesPerRound.map(
                    ({ subactivities, roundNumber, roundId, is_planned }) =>
                        subactivities.map((subActivity, index) => (
                            <TableRow
                                className={classNames(
                                    classes.tableRowSmall,
                                    is_planned || campaign.isPlanned
                                        ? classes.plannedCampaign
                                        : '',
                                )}
                                key={`round-${roundId}-subactivity-${subActivity.id}`}
                            >
                                <StaticSubactivitiesFields
                                    isPdf={isPdf}
                                    subActivity={subActivity}
                                    displayRoundCell={index === 0}
                                    roundNumber={roundNumber}
                                    subActivitiesCount={subactivities.length}
                                />
                                {getSubActivitiesRow(
                                    subActivity,
                                    firstMonday,
                                    lastSunday,
                                    currentWeekIndex,
                                    campaign,
                                )}
                            </TableRow>
                        )),
                )}
        </Fragment>
    );
};
