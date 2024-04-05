import React, { FunctionComponent } from 'react';

import { Box, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import classnames from 'classnames';

import { useStyles } from './Styles';

import { Router } from '../../../../../../../hat/assets/js/apps/Iaso/types/general';
import { useStaticFields } from '../hooks/useStaticFields';
import { HeadStaticFieldsCells } from './cells/HeadStaticFields';
import { colSpanTitle } from './constants';
import { CalendarData } from './types';

type Props = {
    headers: CalendarData['headers'];
    orders: string;
    currentWeekIndex: number;
    isPdf: boolean;
    router: Router;
};

export const Head: FunctionComponent<Props> = ({
    headers,
    orders,
    currentWeekIndex,
    isPdf,
    router,
}) => {
    const classes = useStyles();
    const fields = useStaticFields(isPdf);
    return (
        <TableHead>
            <TableRow className={classes.tableRow}>
                {fields.map(f => (
                    <TableCell
                        key={f.key}
                        className={classnames(
                            classes.tableCellTitle,
                            classes.tableCellTitleEmpty,
                        )}
                        colSpan={colSpanTitle}
                    />
                ))}
                {headers.years.map(year => (
                    <TableCell
                        className={classnames(
                            classes.tableCellHead,
                            classes.tableCellTopBordered,
                        )}
                        key={`year-${year.value}`}
                        align="center"
                        colSpan={year.daysCount}
                    >
                        <Box position="relative" width="100%" height="100%">
                            <Typography
                                className={classes.tableCellSpan}
                                variant="h5"
                            >
                                {year.value}
                            </Typography>
                        </Box>
                    </TableCell>
                ))}
            </TableRow>
            <TableRow
                className={classnames(classes.tableRow, classes.tableRowSmall)}
            >
                {fields.map(f => (
                    <TableCell
                        key={f.key}
                        className={classnames(
                            classes.tableCellTitle,
                            classes.tableCellTitleEmpty,
                        )}
                        style={{ top: 50 }}
                        colSpan={colSpanTitle}
                    />
                ))}
                {headers.months.map(month => (
                    <TableCell
                        className={classnames(
                            classes.tableCellHead,
                            classes.tableCellSmall,
                        )}
                        style={{ top: 50, fontSize: 10 }}
                        key={`month-${month.year}-${month.value}`}
                        align="center"
                        colSpan={month.daysCount}
                    >
                        <Box position="relative" width="100%" height="100%">
                            <span className={classes.tableCellSpan}>
                                {month.value}
                            </span>
                        </Box>
                    </TableCell>
                ))}
            </TableRow>
            <TableRow
                className={classnames(classes.tableRow, classes.tableRowSmall)}
            >
                <HeadStaticFieldsCells
                    orders={orders}
                    isPdf={isPdf}
                    router={router}
                />
                {headers.weeks.map((week, weekIndex) => (
                    <TableCell
                        className={classnames(
                            [classes.tableCellHead, classes.tableCellSmall],
                            {
                                [classes.currentWeek]:
                                    weekIndex + 1 === currentWeekIndex,
                            },
                        )}
                        style={{ top: 100 }}
                        key={`week-${week.year}-${week.month}-${week.value}`}
                        align="center"
                        colSpan={7}
                    >
                        <Box position="relative" width="100%" height="100%">
                            <Box
                                className={classes.tableCellSpan}
                                sx={{ fontSize: 8 }}
                            >
                                {week.value}
                            </Box>
                        </Box>
                    </TableCell>
                ))}
            </TableRow>
            <TableRow
                className={classnames(classes.tableRow, classes.tableRowHidden)}
            >
                {fields.map(f => (
                    <TableCell
                        key={f.key}
                        className={classnames([
                            classes.tableCellTitle,
                            classes.tableCellHidden,
                        ])}
                        colSpan={colSpanTitle}
                    />
                ))}
                {headers.weeks.map(week => {
                    return Array(7)
                        .fill(null)
                        .map((_, i) => (
                            <TableCell
                                className={classnames([
                                    classes.tableCellHead,
                                    classes.tableCellHidden,
                                ])}
                                // eslint-disable-next-line react/no-array-index-key
                                key={`day-${week.year}-${week.month}-${week.value}-${i}`}
                                align="center"
                                colSpan={1}
                            />
                        ));
                })}
            </TableRow>
        </TableHead>
    );
};
