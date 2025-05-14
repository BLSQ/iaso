import React, { Fragment, FunctionComponent, useState } from 'react';

import { Box, TableCell, TableRow } from '@mui/material';

import classnames from 'classnames';
import { StaticFieldsCells } from './cells/StaticFields';
import { StaticSubactivitiesFields } from './cells/StaticSubactivitiesFields';
import { useStyles } from './Styles';
import { CalendarData, CalendarParams, MappedCampaign } from './types';
import { getRoundsCells } from './utils/rounds';
import { getSubActivitiesRow } from './utils/subactivities';

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
    const [subActivitiesExpanded, setSubActivitiesExpanded] = useState(true);
    const defaultCellStyles = [classes.tableCell, classes.tableCellBordered];
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
                    .map(round =>
                        round.subActivities.map((subActivity, idx) => (
                            <TableRow
                                className={classes.tableRowSmall}
                                key={`round-${round.id}-subactivity-${subActivity.id}`}
                            >
                                {idx === 0 && (
                                    <TableCell
                                        rowSpan={round.subActivities.length}
                                        className={classnames(
                                            defaultCellStyles,
                                        )}
                                        sx={{
                                            fontSize: '9px',
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            R{round.number}
                                        </Box>
                                    </TableCell>
                                )}
                                <StaticSubactivitiesFields
                                    isPdf={isPdf}
                                    subActivity={subActivity}
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
